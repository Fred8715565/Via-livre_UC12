// Funções puras do painel de gestão (testáveis sem o Supabase).

export const BAN_FOREVER = '876000h' // ~100 anos; 'none' remove o bloqueio
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DAY = 86_400_000

export function isBanned(user, now = Date.now()) {
  return Boolean(user?.banned_until && new Date(user.banned_until).getTime() > now)
}

// Entrega ao painel só o que ele precisa: nunca tokens, hashes ou metadados internos.
export function mapUser(user, now = Date.now()) {
  const meta = user.app_metadata || {}
  const providers = Array.isArray(meta.providers) ? meta.providers : (meta.provider ? [meta.provider] : [])
  return {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    providers,
    role: meta.role === 'admin' ? 'admin' : 'user',
    // null = a API não informou os fatores; 0 = sem autenticador; 1+ = autenticador ativo
    mfa: Array.isArray(user.factors) ? user.factors.filter(f => f.status === 'verified').length : null,
    confirmed: Boolean(user.email_confirmed_at || user.phone_confirmed_at || user.confirmed_at),
    banned: isBanned(user, now),
    createdAt: user.created_at || null,
    lastSignInAt: user.last_sign_in_at || null
  }
}

export function computeStats(users, now = Date.now()) {
  const stats = { total: users.length, new7d: 0, active7d: 0, withMfa: 0, banned: 0, admins: 0, byProvider: { email: 0, google: 0, apple: 0, phone: 0, other: 0 } }
  for (const u of users) {
    if (u.createdAt && now - new Date(u.createdAt).getTime() <= 7 * DAY) stats.new7d++
    if (u.lastSignInAt && now - new Date(u.lastSignInAt).getTime() <= 7 * DAY) stats.active7d++
    if (u.mfa > 0) stats.withMfa++
    if (u.banned) stats.banned++
    if (u.role === 'admin') stats.admins++
    for (const provider of new Set(u.providers.length ? u.providers : ['other'])) {
      stats.byProvider[provider in stats.byProvider ? provider : 'other']++
    }
  }
  return stats
}

export function filterUsers(users, { q = '', filter = 'all' } = {}) {
  const term = String(q).trim().toLowerCase()
  return users.filter(u => {
    if (filter === 'admin' && u.role !== 'admin') return false
    if (filter === 'banned' && !u.banned) return false
    if (filter === 'nomfa' && u.mfa !== 0) return false
    if (!term) return true
    return [u.email, u.phone, u.name, u.id].some(value => String(value || '').toLowerCase().includes(term))
  })
}

export function sortByNewest(users) {
  return [...users].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

// Lê o nível de autenticação (aal1/aal2) do JWT. Só use depois de requireAuth: o token já foi validado pelo Supabase.
export function readAal(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'))
    return payload.aal || null
  } catch {
    return null
  }
}

// O código do autenticador muda a cada 30 segundos. Para abrir o painel ele precisa ter sido digitado
// no ciclo atual: 30 s + 15 s de tolerância para internet lenta e relógios levemente diferentes.
export const CODE_MAX_AGE_SECONDS = 45

// O Supabase registra cada método de login no claim `amr`, com a hora (em segundos).
// Sem o claim `amr` não há como provar que o código é recente, então a resposta é "não".
export function hasFreshTotp(token, maxAgeSeconds = CODE_MAX_AGE_SECONDS, nowMs = Date.now()) {
  try {
    const claims = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'))
    if (!Array.isArray(claims.amr)) return false
    const last = Math.max(0, ...claims.amr.filter(item => item?.method === 'totp').map(item => Number(item.timestamp) || 0))
    return last > 0 && nowMs / 1000 - last <= maxAgeSeconds
  } catch {
    return false
  }
}

// Sessão do painel: criada quando o admin digita o código e apagada quando ele sai do painel.
// Fica só na memória do servidor, então reiniciar o servidor também exige um código novo.
// O limite de 8 horas é só uma trava de segurança contra abas esquecidas abertas.
export class PanelSessions {
  constructor(maxMs = 8 * 3_600_000) { this.maxMs = maxMs; this.items = new Map() }
  create(userId, token, now = Date.now()) {
    for (const [key, value] of this.items) if (value.exp <= now) this.items.delete(key)
    this.items.set(token, { userId, exp: now + this.maxMs })
    return token
  }
  isValid(token, userId, now = Date.now()) {
    const session = token ? this.items.get(token) : null
    if (!session) return false
    if (session.exp <= now) { this.items.delete(token); return false }
    return session.userId === userId
  }
  revoke(token) { if (token) this.items.delete(token) }
}
