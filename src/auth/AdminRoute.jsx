import { cloneElement, useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { LoaderCircle, ShieldAlert } from 'lucide-react'
import { useAuth } from './AuthContext'
import MfaSettings from '../components/MfaSettings'
import { api } from '../services/api'
import { safeAuthError } from '../services/authRules'

// Para abrir a gestão (usuários e lugares sugeridos) o administrador precisa:
//   1) ter um autenticador ativo (se não tiver, ativa aqui mesmo);
//   2) digitar o código atual do app TODA VEZ que entra (tela "Acesso do administrador").
// A liberação fica só na memória desta tela: bloquear o painel, recarregar a página ou fechar a aba
// trava de novo. Vale para todas as páginas da gestão (AdminLayout). Isto é a parte visual; quem realmente protege é o servidor (server/admin.js).
export default function AdminRoute({ children }) {
  const { user, loading, mfaReady, needsMfa, isAdmin, mfa, refreshAal, session } = useAuth()
  const location = useLocation()
  const [factors, setFactors] = useState(null)
  const [panelToken, setPanelToken] = useState('')
  const tokenRef = useRef('')
  tokenRef.current = panelToken
  const accessToken = session?.access_token

  // Relê os autenticadores quando o token muda (ex.: logo depois de ativar um novo).
  useEffect(() => {
    if (!user || !isAdmin) return undefined
    let active = true
    mfa.list().then(({ verified }) => { if (active) setFactors(verified) })
      .catch(() => { if (active) setFactors([]) })
    return () => { active = false }
  }, [user, isAdmin, mfa, accessToken])

  // Ao sair da tela do painel, encerra a sessão no servidor.
  useEffect(() => () => {
    if (tokenRef.current) api('/admin/session', { method: 'DELETE', headers: { 'X-Admin-Session': tokenRef.current } }).catch(() => {})
  }, [])

  // "Bloquear painel": encerra a sessão no servidor na hora e volta a pedir o código.
  const lock = useCallback(() => {
    if (tokenRef.current) api('/admin/session', { method: 'DELETE', headers: { 'X-Admin-Session': tokenRef.current } }).catch(() => {})
    setPanelToken('')
  }, [])

  if (loading || (user && !mfaReady)) return <div className="auth-loading" role="status">Verificando sua sessão…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (needsMfa) return <Navigate to="/verificar-2fa" replace state={{ from: location.pathname }} />
  if (!isAdmin) return <Navigate to="/" replace />
  if (factors === null) return <div className="auth-loading" role="status">Verificando seu autenticador…</div>

  // Sem autenticador: ativa aqui mesmo (QR Code). Ao concluir, o próximo passo é digitar o código.
  if (factors.length === 0) {
    return <main className="auth-loading"><div className="adm-gate wide">
      <ShieldAlert size={34} />
      <h1>Ative o autenticador para entrar no painel</h1>
      <p>O painel de gestão só abre com um aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy…). Configure agora, em poucos passos.</p>
      <MfaSettings />
      <Link className="adm-btn" to="/">Voltar ao app</Link>
    </div></main>
  }

  // Com autenticador: pede o código atual.
  if (!panelToken) {
    return <AdminUnlock factorId={factors[0].id} verify={mfa.verify} refreshAal={refreshAal} onUnlocked={setPanelToken} />
  }

  return cloneElement(children, { panelToken, onLock: lock })
}

function AdminUnlock({ factorId, verify, refreshAal, onUnlocked }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await verify(factorId, code)       // o Supabase confere o código do app
      await refreshAal()
      const { panelToken } = await api('/admin/session', { method: 'POST' }) // o servidor confere que o código é recente
      onUnlocked(panelToken)
    } catch (err) {
      setCode('')
      setError(err.code || err.message?.startsWith('Digite ') || err.message?.startsWith('Ative ') ? err.message : safeAuthError(err, 'mfa'))
    } finally { setBusy(false) }
  }

  return <main className="auth-loading"><form className="adm-gate adm-gate--code" onSubmit={submit}>
    <span className="adm-eyebrow">Gestão</span>
    <h1>Acesso do administrador</h1>
    <label className="adm-mono" htmlFor="admin-code">Código de 6 dígitos do seu app autenticador</label>
    <input id="admin-code" className="auth-code-input" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus required />
    <p className="adm-muted">O código muda a cada 30 segundos e é pedido toda vez que você abre a gestão.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="auth-submit" type="submit" disabled={busy || code.length !== 6}>{busy ? <><LoaderCircle className="spin" size={18} /> Verificando…</> : 'Entrar'}</button>
    <Link className="adm-btn" to="/">Voltar ao app</Link>
  </form></main>
}
