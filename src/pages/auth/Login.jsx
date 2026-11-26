import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, LockKeyhole, Chrome, LoaderCircle, Smartphone } from 'lucide-react'
import AuthShell from './AuthShell'
import { useAuth } from '../../auth/AuthContext'
import { safeAuthError } from '../../services/authRules'

// Logo da Apple (não existe no lucide-react).
const AppleLogo = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>

export default function Login() {
  const { user, signIn, signInWithGoogle, signInWithApple, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (user) navigate(location.state?.from || '/', { replace: true }) }, [user, navigate, location.state])

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await signIn({ email, password, rememberMe }); navigate(location.state?.from || '/', { replace: true }) }
    catch (err) { setError(err.message?.includes('Informe ') ? err.message : safeAuthError(err)) }
    finally { setBusy(false) }
  }

  async function handleGoogle() {
    setError(''); setBusy(true)
    try { await signInWithGoogle(rememberMe) }
    catch (err) { setError(safeAuthError(err)); setBusy(false) }
  }

  async function handleApple() {
    setError(''); setBusy(true)
    try { await signInWithApple(rememberMe) }
    catch (err) { setError(safeAuthError(err)); setBusy(false) }
  }

  return <AuthShell title="Bem-vindo de volta" subtitle="Entre na sua conta para continuar."
    footer={<>Ainda não tem uma conta? <Link to="/cadastro">Criar conta</Link></>}>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-label" htmlFor="login-email">E-mail</label>
      <div className="auth-input-wrap"><Mail size={18} /><input id="login-email" type="email" autoComplete="email" placeholder="seuemail@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
      <div className="auth-label-row"><label className="auth-label" htmlFor="login-password">Senha</label><Link to="/recuperar-senha">Esqueci minha senha</Link></div>
      <div className="auth-input-wrap"><LockKeyhole size={18} /><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} required /><button className="auth-icon-button" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      <label className="auth-check"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /><span>Lembrar de mim</span></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={busy || !isConfigured}>{busy ? <><LoaderCircle className="spin" size={18} /> Entrando...</> : 'Entrar'}</button>
      <div className="auth-divider"><span />ou<span /></div>
      <button className="auth-google" type="button" onClick={handleGoogle} disabled={busy || !isConfigured}><Chrome size={18} /> Entrar com Google</button>
      <button className="auth-apple" type="button" onClick={handleApple} disabled={busy || !isConfigured}><AppleLogo /> Entrar com Apple</button>
      <Link className="auth-google auth-link-btn" to="/login-celular" state={location.state} aria-disabled={busy}><Smartphone size={18} /> Entrar com celular</Link>
    </form>
  </AuthShell>
}
