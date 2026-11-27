import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthShell from './AuthShell'

export default function PasswordChanged() {
  return <AuthShell title="Senha alterada!" subtitle="Senha alterada com sucesso! Agora você pode entrar na sua conta utilizando sua nova senha.">
    <div className="auth-complete"><CheckCircle2 size={48} /><p> sua conta está pronta para ser acessada novamente.</p><Link className="auth-submit auth-link-button" to="/login">Voltar ao login</Link></div>
  </AuthShell>
}
