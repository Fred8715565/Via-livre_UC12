import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, LoaderCircle } from 'lucide-react'
import AuthShell from './AuthShell'
import { useAuth } from '../../auth/AuthContext'
import { safeAuthError } from '../../services/authRules'

// Segunda etapa do login: o usuário já passou pela senha/SMS/Google/Apple (aal1)
// e agora confirma o código do aplicativo autenticador para chegar ao aal2.
export default function MfaChallenge() {
  const { user, loading, mfaReady, needsMfa, mfa, refreshAal, signOut, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.from || '/'
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return undefined
    let active = true
    mfa.list().then(({ verified }) => {
      if (!active) return
      if (verified[0]) setFactorId(verified[0].id)
      else setError('Nenhum autenticador encontrado nesta conta. Peça ajuda ao administrador.')
    }).catch(() => { if (active) setError('Não foi possível carregar seu autenticador. Atualize a página.') })
    return () => { active = false }
  }, [user, mfa])

  if (loading || (user && !mfaReady)) return <div className="auth-loading" role="status">Verificando sua sessão…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!needsMfa) return <Navigate to={destination} replace />

  async function verify(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await mfa.verify(factorId, code)
      await refreshAal() // garante que o app já enxerga o nível aal2 antes de navegar
      navigate(destination, { replace: true })
    } catch (err) {
      setCode('')
      setError(err.message?.startsWith('Digite ') ? err.message : safeAuthError(err, 'mfa'))
    } finally { setBusy(false) }
  }

  async function leave() {
    try { await signOut() } finally { navigate('/login', { replace: true }) }
  }

  return <AuthShell title="Verificação em duas etapas" subtitle="Abra seu aplicativo autenticador e digite o código de 6 dígitos do Via Livre.">
    <form className="auth-form" onSubmit={verify}>
      <div className="auth-email-note"><ShieldCheck size={19} /><span>Conta: <b>{user.email || user.phone}</b></span></div>
      <label className="auth-label" htmlFor="mfa-code">Código do autenticador</label>
      <input className="auth-code-input" id="mfa-code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus />
      <p className="auth-hint">O código muda a cada 30 segundos. Funciona com Google Authenticator, Microsoft Authenticator, Authy, 1Password e similares.</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={busy || !isConfigured || !factorId || code.length !== 6}>{busy ? <><LoaderCircle className="spin" size={18} /> Verificando...</> : 'Confirmar e entrar'}</button>
      <button className="auth-back" type="button" onClick={leave}>Sair e usar outra conta</button>
    </form>
  </AuthShell>
}
