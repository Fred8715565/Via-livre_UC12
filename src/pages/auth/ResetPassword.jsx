import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import AuthShell from './AuthShell'
import { useAuth } from '../../auth/AuthContext'
import { supabase } from '../../services/supabase'
import { updatePassword } from '../../services/authService'

export default function ResetPassword() {
  const { user, loading, isConfigured, signOut } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!loading && !user) return <AuthShell title="Verificação necessária" subtitle="Valide primeiro o código enviado ao seu e-mail."><div className="auth-form"><Link className="auth-submit auth-link-button" to="/recuperar-senha">Solicitar código</Link></div></AuthShell>

  async function save(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await updatePassword(supabase, password, confirmation)
      await signOut()
      navigate('/senha-alterada', { replace: true })
    } catch (err) { setError(err.message?.startsWith('Use ') || err.message?.startsWith('As senhas') ? err.message : 'Não foi possível alterar a senha. Verifique o código e tente novamente.') }
    finally { setBusy(false) }
  }

  return <AuthShell title="Criar nova senha" subtitle="Escolha uma senha forte para proteger sua conta.">
    <form className="auth-form" onSubmit={save}>
      <label className="auth-label" htmlFor="new-password">Nova senha</label>
      <div className="auth-input-wrap"><LockKeyhole size={18} /><input id="new-password" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Digite sua nova senha" value={password} onChange={e => setPassword(e.target.value)} required /><button className="auth-icon-button" type="button" onClick={() => setShow(v => !v)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      <p className="auth-hint">Mínimo de 8 caracteres, com maiúsculas, minúsculas e números.</p>
      <label className="auth-label" htmlFor="confirm-new-password">Confirmar nova senha</label>
      <div className="auth-input-wrap"><LockKeyhole size={18} /><input id="confirm-new-password" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Digite novamente" value={confirmation} onChange={e => setConfirmation(e.target.value)} required /></div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={busy || !isConfigured || loading}>{busy ? <><LoaderCircle className="spin" size={18} /> Salvando...</> : 'Salvar nova senha'}</button>
    </form>
  </AuthShell>
}
