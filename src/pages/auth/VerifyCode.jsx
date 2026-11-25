import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck, LoaderCircle } from 'lucide-react'
import AuthShell from './AuthShell'
import { useAuth } from '../../auth/AuthContext'
import { supabase } from '../../services/supabase'
import { requestPasswordCode, verifyPasswordCode } from '../../services/authService'
import { safeAuthError } from '../../services/authRules'

export default function VerifyCode() {
  const { isConfigured } = useAuth()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || params.get('email') || ''
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [seconds, setSeconds] = useState(60)

  useEffect(() => {
    if (seconds <= 0) return undefined
    const timer = window.setTimeout(() => setSeconds(value => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])

  async function verify(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try { await verifyPasswordCode(supabase, email, code); navigate('/redefinir-senha', { replace: true }) }
    catch (err) { setError(err.message?.startsWith('Digite ') || err.message?.startsWith('E-mail ') ? err.message : safeAuthError(err)) }
    finally { setBusy(false) }
  }

  async function resend() {
    setBusy(true); setError(''); setNotice('')
    try {
      await requestPasswordCode(supabase, email)
      setSeconds(60); setCode(''); setNotice('Se o endereço estiver cadastrado, um novo código será enviado.')
    } catch (err) { setError(safeAuthError(err)) }
    finally { setBusy(false) }
  }

  return <AuthShell title="Verificar código" subtitle="Digite os 6 números enviados para o e-mail da sua conta.">
    <form className="auth-form" onSubmit={verify}>
      <div className="auth-email-note"><MailCheck size={19} /><span>Código enviado para <b>{email || 'seu e-mail'}</b></span></div>
      <label className="auth-label" htmlFor="recovery-code">Código de verificação</label>
      <input className="auth-code-input" id="recovery-code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
      <p className="auth-hint">O código é válido por 5 minutos. Não compartilhe esse código com ninguém.</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="auth-success" role="status">{notice}</p>}
      <button className="auth-submit" type="submit" disabled={busy || !isConfigured || code.length !== 6}>{busy ? <><LoaderCircle className="spin" size={18} /> Verificando...</> : 'Verificar código'}</button>
      <button className="auth-resend" type="button" onClick={resend} disabled={busy || seconds > 0 || !isConfigured}>{seconds > 0 ? `Reenviar código em ${seconds}s` : 'Reenviar código'}</button>
      <Link className="auth-back" to="/recuperar-senha">Usar outro e-mail</Link>
    </form>
  </AuthShell>
}
