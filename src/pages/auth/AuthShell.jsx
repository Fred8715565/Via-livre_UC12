import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function AuthShell({ title, subtitle, children, footer }) {
  const { isConfigured, configProblem } = useAuth()
  return <main className="auth-page">
    <section className="auth-panel" aria-labelledby="auth-title">
      <Link to="/login" className="auth-brand" aria-label="Via Livre - login">
        <span className="auth-brand-mark"><i /></span><span>Via Livre</span>
      </Link>
      <div className="auth-heading">
        <span className="auth-kicker"><ShieldCheck size={14} /> SUA CONTA VIA LIVRE</span>
        <h1 id="auth-title">{title}</h1>
        <p>{subtitle}</p>
      </div>
      {!isConfigured && <div className="auth-config" role="alert">
        {configProblem}
      </div>}
      {children}
      {footer && <div className="auth-footer">{footer}</div>}
      <p className="auth-privacy">Sua conta é protegida por autenticação segura.</p>
    </section>
    <aside className="auth-aside" aria-label="Sobre o Via Livre">
      <div className="auth-aside-shape shape-one" /><div className="auth-aside-shape shape-two" />
      <div className="auth-aside-content">
        <span className="auth-aside-tag">ACESSIBILIDADE EM MOVIMENTO</span>
        <h2>Mais autonomia para chegar onde você precisa.</h2>
        <p>Encontre lugares, planeje caminhos e tenha informações acessíveis em um só lugar.</p>
        <div className="auth-aside-line"><span /> Um caminho mais livre começa aqui.</div>
      </div>
      <span className="auth-aside-version">VIA LIVRE · ACESSIBILIDADE URBANA</span>
    </aside>
  </main>
}
