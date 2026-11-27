import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, LockKeyhole, Chrome, LoaderCircle } from 'lucide-react'
import AuthShell from './AuthShell'
import { useAuth } from '../../auth/AuthContext'
import { safeAuthError } from '../../services/authRules'

export default function Login() {
  const { user, signIn, signInWithGoogle, isConfigured } = useAuth()
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
    </form>
  </AuthShell>
}
