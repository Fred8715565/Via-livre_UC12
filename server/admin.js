import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { requireAuth } from './authMiddleware.js'
import { STATUSES, suggestionStore } from './suggestions.js'
import { BAN_FOREVER, PanelSessions, UUID, computeStats, filterUsers, hasFreshTotp, mapUser, readAal, sortByNewest } from './adminUtils.js'

// ⚠️ A chave service_role ignora todas as regras de segurança do banco.
// Ela só pode existir aqui, no servidor (SUPABASE_SERVICE_ROLE_KEY) — jamais em variável VITE_ ou no navegador.
let adminClient
function getAdminClient() {
  if (adminClient === undefined) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    adminClient = url && key
      ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      : null
  }
  return adminClient
}

// Camada 2 de proteção. Duas etapas:
//  1) requireAdminRole: token válido + papel "admin" + sessão com 2FA (aal2). Lido do Supabase agora,
//     então remover o papel de alguém vale na hora.
//  2) Sessão do painel: o admin troca um código do autenticador recém-digitado (POST /session)
//     por uma sessão que só vale enquanto ele estiver no painel. Sem ela, todas as rotas recusam.
export function requireAdminRole(req, res, next) {
  if (req.user?.app_metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' })
  }
  if (readAal(req.accessToken) !== 'aal2') {
    return res.status(403).json({ error: 'Ative e confirme o autenticador para acessar o painel.', code: 'mfa_required' })
  }
  return next()
}

const panelSessions = new PanelSessions()
function requirePanelSession(req, res, next) {
  if (!panelSessions.isValid(req.get('x-admin-session'), req.user.id)) {
    return res.status(403).json({ error: 'Digite o código do autenticador para entrar no painel.', code: 'panel_locked' })
  }
  return next()
}

function requireServiceKey(req, res, next) {
  const client = getAdminClient()
  if (!client) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' })
  req.admin = client
  return next()
}

// Pequeno cache para não listar todos os usuários a cada clique no painel.
let cache = null
const invalidate = () => { cache = null }
async function loadUsers(client) {
  if (cache && Date.now() - cache.at < 10_000) return cache.users
  const users = []
  for (let page = 1; page <= 50; page++) { // até 10 mil usuários; acima disso, consulte via SQL
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < 200) break
  }
  const mapped = sortByNewest(users.map(u => mapUser(u)))
  cache = { at: Date.now(), users: mapped }
  return mapped
}

// Registro de ações (em memória + console). Em produção, grave em uma tabela do banco.
const auditLog = []
function audit(req, action, target = {}) {
  const entry = {
    at: new Date().toISOString(), action,
    actor: req.user.email || req.user.phone || req.user.id,
    target: target.label || target.id || null
  }
  auditLog.unshift(entry)
  auditLog.length = Math.min(auditLog.length, 200)
  console.log('[admin]', JSON.stringify(entry))
}

const handler = fn => async (req, res) => {
  try { await fn(req, res) }
  catch (error) {
    console.error('[admin] erro:', error?.message || error)
    res.status(500).json({ error: 'Não foi possível concluir a operação.' })
  }
}

function targetId(req, res) {
  const { id } = req.params
  if (!UUID.test(id)) { res.status(400).json({ error: 'ID de usuário inválido.' }); return null }
  return id
}
const isSelf = (req, id) => req.user.id === id
const labelOf = u => u?.email || u?.phone || u?.id

export const adminRouter = Router()
adminRouter.use(requireAuth, requireAdminRole)

// Abre o painel: exige um código do autenticador digitado agora há pouco (um ciclo de 30 s).
adminRouter.post('/session', (req, res) => {
  if (!hasFreshTotp(req.accessToken)) {
    return res.status(403).json({ error: 'Digite o código atual do autenticador para entrar no painel.', code: 'mfa_stale' })
  }
  const panelToken = panelSessions.create(req.user.id, randomBytes(32).toString('base64url'))
  audit(req, 'abriu o painel')
  return res.json({ panelToken })
})

// Sair do painel: a sessão deixa de valer na hora.
adminRouter.delete('/session', (req, res) => {
  panelSessions.revoke(req.get('x-admin-session'))
  return res.status(204).end()
})

// Tudo abaixo exige a sessão do painel (ou seja, um código do autenticador na entrada).
adminRouter.use(requirePanelSession)

// ---- Lugares sugeridos (/admin/lugares). Não usam a chave service_role. ----
const SUGGESTION_ACTION = { approved: 'aprovou a sugestão', rejected: 'recusou a sugestão', pending: 'devolveu para análise a sugestão' }

adminRouter.get('/suggestions', (req, res) => {
  const status = STATUSES.includes(req.query.status) ? req.query.status : 'all'
  res.json({ suggestions: suggestionStore.list({ status, q: req.query.q }), counts: suggestionStore.counts() })
})

adminRouter.post('/suggestions/:id/status', (req, res) => {
  if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'ID de sugestão inválido.' })
  const status = req.body?.status
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido.' })
  const item = suggestionStore.setStatus(req.params.id, status, labelOf(req.user))
  if (!item) return res.status(404).json({ error: 'Sugestão não encontrada (o servidor pode ter sido reiniciado).' })
  audit(req, SUGGESTION_ACTION[status], { label: item.name })
  return res.json({ ok: true, suggestion: item })
})

adminRouter.delete('/suggestions/:id', (req, res) => {
  if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'ID de sugestão inválido.' })
  const item = suggestionStore.items.find(entry => entry.id === req.params.id)
  if (!item || !suggestionStore.remove(req.params.id)) return res.status(404).json({ error: 'Sugestão não encontrada.' })
  audit(req, 'excluiu a sugestão', { label: item.name })
  return res.status(204).end()
})

// ---- Usuários (precisam da chave service_role) ----
adminRouter.use(requireServiceKey)

adminRouter.get('/stats', handler(async (req, res) => {
  res.json({ stats: computeStats(await loadUsers(req.admin)) })
}))

adminRouter.get('/users', handler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(5, parseInt(req.query.pageSize, 10) || 15))
  const filtered = filterUsers(await loadUsers(req.admin), { q: req.query.q, filter: req.query.filter })
  res.json({ users: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize })
}))

adminRouter.get('/audit', (req, res) => res.json({ entries: auditLog.slice(0, 50) }))

adminRouter.post('/users/:id/ban', handler(async (req, res) => {
  const id = targetId(req, res); if (!id) return
  if (isSelf(req, id)) return res.status(400).json({ error: 'Você não pode bloquear a si mesmo.' })
  const banned = req.body?.banned === true
  // Bloqueado não consegue entrar nem renovar a sessão (o token atual vale até expirar, em até 1h).
  const { data, error } = await req.admin.auth.admin.updateUserById(id, { ban_duration: banned ? BAN_FOREVER : 'none' })
  if (error) throw error
  invalidate(); audit(req, banned ? 'bloqueou' : 'desbloqueou', { label: labelOf(data.user) })
  res.json({ ok: true })
}))

adminRouter.post('/users/:id/role', handler(async (req, res) => {
  const id = targetId(req, res); if (!id) return
  if (isSelf(req, id)) return res.status(400).json({ error: 'Você não pode alterar o seu próprio papel.' })
  const role = req.body?.role === 'admin' ? 'admin' : 'user'
  // app_metadata só pode ser escrito com service_role: o usuário nunca consegue se promover sozinho.
  const { data, error } = await req.admin.auth.admin.updateUserById(id, { app_metadata: { role } })
  if (error) throw error
  invalidate(); audit(req, role === 'admin' ? 'promoveu a administrador' : 'removeu o papel de administrador', { label: labelOf(data.user) })
  res.json({ ok: true })
}))

// Para quem perdeu o celular: apaga os autenticadores; no próximo login a pessoa ativa um novo.
adminRouter.delete('/users/:id/mfa', handler(async (req, res) => {
  const id = targetId(req, res); if (!id) return
  if (isSelf(req, id)) return res.status(400).json({ error: 'Gerencie o seu próprio autenticador pelo Perfil.' })
  const { data, error } = await req.admin.auth.admin.mfa.listFactors({ userId: id })
  if (error) throw error
  const factors = data?.factors ?? []
  for (const factor of factors) {
    const { error: deleteError } = await req.admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: id })
    if (deleteError) throw deleteError
  }
  invalidate(); audit(req, `resetou o 2FA (${factors.length} autenticador(es))`, { id })
  res.json({ ok: true, removed: factors.length })
}))

adminRouter.delete('/users/:id', handler(async (req, res) => {
  const id = targetId(req, res); if (!id) return
  if (isSelf(req, id)) return res.status(400).json({ error: 'Você não pode excluir a sua própria conta pelo painel.' })
  const { error } = await req.admin.auth.admin.deleteUser(id)
  if (error) throw error
  invalidate(); audit(req, 'excluiu a conta', { id })
  res.status(204).end()
}))
