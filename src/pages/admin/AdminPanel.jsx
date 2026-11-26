import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Ban, CheckCircle2, KeyRound, LoaderCircle, LogOut, RefreshCw, Search, ShieldCheck, ShieldOff, Trash2, UserCog, Users } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../auth/AuthContext'

const PAGE_SIZE = 12
const PROVIDER_LABEL = { email: 'E-mail', google: 'Google', apple: 'Apple', phone: 'Celular' }
const FILTERS = [['all', 'Todos'], ['admin', 'Administradores'], ['banned', 'Bloqueados'], ['nomfa', 'Sem 2FA']]
const fmt = iso => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
const query = params => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString()

export default function AdminPanel({ panelToken, onLock }) {
  const { user, signOut } = useAuth()
  // Toda chamada leva a sessão do painel. Se o servidor disser que ela não vale mais
  // (ex.: foi reiniciado), a tela volta a pedir o código do autenticador.
  const call = useCallback(async (path, opts = {}) => {
    try { return await api(path, { ...opts, headers: { ...opts.headers, 'X-Admin-Session': panelToken } }) }
    catch (err) { if (err.code === 'panel_locked') onLock?.(); throw err }
  }, [panelToken, onLock])
  const [stats, setStats] = useState(null)
  const [list, setList] = useState({ users: [], total: 0 })
  const [audit, setAudit] = useState([])
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('') // valor aplicado (com atraso para não consultar a cada tecla)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(q); setPage(1) }, 350)
    return () => clearTimeout(timer)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [s, u, a] = await Promise.all([
        call('/admin/stats'),
        call('/admin/users?' + query({ q: search, filter, page, pageSize: PAGE_SIZE })),
        call('/admin/audit')
      ])
      setStats(s.stats); setList(u); setAudit(a.entries)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [call, search, filter, page])
  useEffect(() => { load() }, [load])

  async function run(target, label, request, success) {
    if (!window.confirm(label)) return
    setWorkingId(target.id); setError(''); setNotice('')
    try { await request(); setNotice(success); await load() }
    catch (err) { setError(err.message) }
    finally { setWorkingId('') }
  }

  const who = u => u.name || u.email || u.phone || u.id
  const actions = {
    ban: u => run(u, `${u.banned ? 'Desbloquear' : 'Bloquear'} ${who(u)}?`,
      () => call(`/admin/users/${u.id}/ban`, { method: 'POST', body: JSON.stringify({ banned: !u.banned }) }),
      u.banned ? 'Usuário desbloqueado.' : 'Usuário bloqueado. Ele não poderá mais entrar.'),
    role: u => run(u, u.role === 'admin' ? `Remover ${who(u)} dos administradores?` : `Tornar ${who(u)} administrador?`,
      () => call(`/admin/users/${u.id}/role`, { method: 'POST', body: JSON.stringify({ role: u.role === 'admin' ? 'user' : 'admin' }) }),
      'Papel atualizado. A pessoa precisa sair e entrar de novo para o acesso mudar.'),
    mfa: u => run(u, `Remover o autenticador de ${who(u)}? Use isso quando a pessoa perdeu o celular.`,
      () => call(`/admin/users/${u.id}/mfa`, { method: 'DELETE' }), 'Autenticador removido. A pessoa poderá ativar um novo.'),
    remove: u => run(u, `EXCLUIR a conta de ${who(u)}? Essa ação não pode ser desfeita.`,
      () => call(`/admin/users/${u.id}`, { method: 'DELETE' }), 'Conta excluída.')
  }

  const pages = Math.max(1, Math.ceil(list.total / PAGE_SIZE))
  const cards = stats && [
    ['Usuários', stats.total], ['Novos (7 dias)', stats.new7d], ['Ativos (7 dias)', stats.active7d],
    ['Com autenticador', stats.withMfa], ['Bloqueados', stats.banned], ['Administradores', stats.admins]
  ]

  return <div className="adm">
    <header className="adm-top">
      <div className="adm-title"><span className="auth-brand-mark"><i /></span><div><h1>Painel de gestão</h1><small>Via Livre · {user?.email || user?.phone}</small></div></div>
      <div className="adm-top-actions">
        <Link className="adm-btn" to="/"><ArrowLeft size={15} /> Voltar ao app</Link>
        <button className="adm-btn" type="button" onClick={() => signOut()}><LogOut size={15} /> Sair</button>
      </div>
    </header>

    <main className="adm-main">
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="auth-success" role="status">{notice}</p>}

      <section className="adm-cards" aria-label="Resumo">
        {cards ? cards.map(([label, value]) => <div className="adm-card" key={label}><small>{label}</small><b>{value}</b></div>)
          : Array.from({ length: 6 }, (_, i) => <div className="adm-card" key={i}><small>&nbsp;</small><b>…</b></div>)}
      </section>

      {stats && <section className="adm-providers" aria-label="Usuários por método de entrada">
        <h2>Como as pessoas entram</h2>
        {Object.entries(stats.byProvider).filter(([k, n]) => k !== 'other' || n > 0).map(([k, n]) => <div className="adm-bar" key={k}>
          <span>{PROVIDER_LABEL[k] || 'Outro'}</span>
          <div><i style={{ width: `${stats.total ? Math.round((n / stats.total) * 100) : 0}%` }} /></div>
          <b>{n}</b>
        </div>)}
      </section>}

      <section className="adm-box">
        <div className="adm-toolbar">
          <label className="adm-search"><Search size={16} aria-hidden="true" /><input type="search" placeholder="Buscar por nome, e-mail, celular ou ID" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar usuários" /></label>
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} aria-label="Filtrar usuários">{FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button className="adm-btn" type="button" onClick={load} disabled={loading}>{loading ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />} Atualizar</button>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Usuário</th><th>Entra com</th><th>2FA</th><th>Criado em</th><th>Último acesso</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {list.users.map(u => {
                const self = u.id === user?.id
                return <tr key={u.id} className={workingId === u.id ? 'busy' : ''}>
                  <td><b>{u.name || u.email || u.phone || 'Sem nome'}</b>{u.name && <small>{u.email || u.phone}</small>}{self && <em className="adm-you">você</em>}</td>
                  <td>{u.providers.length ? u.providers.map(p => <span className="adm-tag" key={p}>{PROVIDER_LABEL[p] || p}</span>) : '—'}</td>
                  <td>{u.mfa === null ? '—' : u.mfa > 0 ? <span className="adm-ok"><ShieldCheck size={15} /> Ativo</span> : <span className="adm-off"><ShieldOff size={15} /> Não</span>}</td>
                  <td>{fmt(u.createdAt)}</td>
                  <td>{fmt(u.lastSignInAt)}</td>
                  <td>{u.banned && <span className="adm-tag red">Bloqueado</span>}{u.role === 'admin' && <span className="adm-tag dark">Admin</span>}{!u.confirmed && <span className="adm-tag amber">Não confirmado</span>}{!u.banned && u.role !== 'admin' && u.confirmed && <span className="adm-tag">Ativo</span>}</td>
                  <td><div className="adm-actions">
                    <button type="button" title={u.banned ? 'Desbloquear' : 'Bloquear'} aria-label={`${u.banned ? 'Desbloquear' : 'Bloquear'} ${who(u)}`} onClick={() => actions.ban(u)} disabled={self || workingId === u.id}>{u.banned ? <CheckCircle2 size={16} /> : <Ban size={16} />}</button>
                    <button type="button" title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'} aria-label={`${u.role === 'admin' ? 'Remover admin de' : 'Tornar admin'} ${who(u)}`} onClick={() => actions.role(u)} disabled={self || workingId === u.id}><UserCog size={16} /></button>
                    <button type="button" title="Resetar autenticador (2FA)" aria-label={`Resetar 2FA de ${who(u)}`} onClick={() => actions.mfa(u)} disabled={self || u.mfa === 0 || workingId === u.id}><KeyRound size={16} /></button>
                    <button type="button" className="danger" title="Excluir conta" aria-label={`Excluir ${who(u)}`} onClick={() => actions.remove(u)} disabled={self || workingId === u.id}><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              })}
              {!loading && list.users.length === 0 && <tr><td colSpan={7} className="adm-empty"><Users size={22} /> Nenhum usuário encontrado.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="adm-pager">
          <span>{list.total} usuário(s)</span>
          <div><button className="adm-btn" type="button" onClick={() => setPage(p => p - 1)} disabled={page <= 1 || loading}>Anterior</button>
            <span>Página {page} de {pages}</span>
            <button className="adm-btn" type="button" onClick={() => setPage(p => p + 1)} disabled={page >= pages || loading}>Próxima</button></div>
        </div>
      </section>

      <section className="adm-box">
        <h2>Atividade recente do painel</h2>
        {audit.length === 0 ? <p className="adm-muted">Nenhuma ação registrada desde que o servidor iniciou.</p>
          : <ul className="adm-audit">{audit.slice(0, 10).map((e, i) => <li key={i}><time>{fmt(e.at)}</time> <b>{e.actor}</b> {e.action}{e.target ? <> — {e.target}</> : null}</li>)}</ul>}
      </section>
    </main>
  </div>
}
