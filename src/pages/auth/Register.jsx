import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserRound, Mail, LockKeyhole, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import AuthShell from './AuthShell'
import { useAuth } from '../../auth/AuthContext'
import { safeAuthError } from '../../services/authRules'

export default function Register() {
  const { user, signUp, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmation: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  useEffect(() => { if (user) navigate('/', { replace: true }) }, [user, navigate])

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true)
    try {
      const result = await signUp(form)
      if (!result.session) {
        setSuccess('Cadastro iniciado! Confira seu e-mail para confirmar a conta antes de entrar.')
      } else {
        setSuccess('Conta criada com sucesso!')
        navigate('/', { replace: true })
      }
    } catch (err) { setError(err.message?.startsWith('Informe ') || err.message?.startsWith('Use ') || err.message?.startsWith('As senhas') || err.message?.startsWith('Não foi') ? err.message : safeAuthError(err)) }
    finally { setBusy(false) }
  }

  return <AuthShell title="Crie sua conta" subtitle="É rápido. Preencha seus dados para começar."
    footer={<>Já tem uma conta? <Link to="/login">Voltar ao login</Link></>}>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-label" htmlFor="register-name">Nome completo</label>
      <div className="auth-input-wrap"><UserRound size={18} /><input id="register-name" autoComplete="name" placeholder="Seu nome completo" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
      <label className="auth-label" htmlFor="register-email">E-mail</label>
      <div className="auth-input-wrap"><Mail size={18} /><input id="register-email" type="email" autoComplete="email" placeholder="seuemail@gmail.com" value={form.email} onChange={e => update('email', e.target.value)} required /></div>
      <label className="auth-label" htmlFor="register-password">Senha</label>
      <div className="auth-input-wrap"><LockKeyhole size={18} /><input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" value={form.password} onChange={e => update('password', e.target.value)} required /><button className="auth-icon-button" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      <p className="auth-hint">Use letras maiúsculas, minúsculas e números.</p>
      <label className="auth-label" htmlFor="register-confirm">Confirmar senha</label>
      <div className="auth-input-wrap"><LockKeyhole size={18} /><input id="register-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Digite a senha novamente" value={form.confirmation} onChange={e => update('confirmation', e.target.value)} required /></div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {success && <p className="auth-success" role="status">{success}</p>}
      <button className="auth-submit" type="submit" disabled={busy || !isConfigured}>{busy ? <><LoaderCircle className="spin" size={18} /> Criando conta...</> : 'Criar minha conta'}</button>
    </form>
  </AuthShell>
}
