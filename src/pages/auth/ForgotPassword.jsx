import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, LoaderCircle } from 'lucide-react'
import AuthShell from './AuthShell'
import { useAuth } from '../../auth/AuthContext'
import { supabase } from '../../services/supabase'
import { requestPasswordCode } from '../../services/authService'
import { safeAuthError } from '../../services/authRules'

export default function ForgotPassword() {
  const { isConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      await requestPasswordCode(supabase, email)
      navigate(`/verificar-codigo?email=${encodeURIComponent(email.trim())}`, { state: { email: email.trim() } })
    } catch (err) {
      setError(err.message === 'Informe um e-mail válido.' ? err.message : safeAuthError(err))
    } finally { setBusy(false) }
  }
  return <AuthShell title="Recuperar senha" subtitle="Informe o e-mail da sua conta. Vamos enviar um código de verificação.">
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-label" htmlFor="recovery-email">E-mail cadastrado</label>
      <div className="auth-input-wrap"><Mail size={18} /><input id="recovery-email" type="email" autoComplete="email" placeholder="seuemail@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
      <p className="auth-hint">Por segurança, não informamos se um endereço está ou não cadastrado.</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={busy || !isConfigured}>{busy ? <><LoaderCircle className="spin" size={18} /> Enviando...</> : 'Enviar código'}</button>
      <Link className="auth-back" to="/login">Voltar ao login</Link>
    </form>
  </AuthShell>
}
