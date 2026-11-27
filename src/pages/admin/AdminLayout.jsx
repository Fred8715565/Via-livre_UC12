import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowLeft, Lock, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'

// Moldura comum das páginas de gestão. Quem a abre é o AdminRoute (código do autenticador na entrada):
// o código vale para todas as páginas daqui, então trocar de aba não pede o código de novo.
export default function AdminLayout({ panelToken, onLock }) {
  const { user, signOut } = useAuth()
  return <div className="adm">
    <header className="adm-top">
      <div className="adm-title"><span className="auth-brand-mark"><i /></span><div><h1>Gestão</h1><small>Via Livre · {user?.email}</small></div></div>
      <div className="adm-top-actions">
        <Link className="adm-btn" to="/"><ArrowLeft size={15} /> Voltar ao app</Link>
        <button className="adm-btn" type="button" onClick={onLock}><Lock size={15} /> Bloquear painel</button>
        <button className="adm-btn" type="button" onClick={() => signOut()}><LogOut size={15} /> Sair da conta</button>
      </div>
    </header>
    <nav className="adm-nav" aria-label="Páginas da gestão">
      <NavLink to="/admin" end>Usuários</NavLink>
      <NavLink to="/admin/lugares">Lugares sugeridos</NavLink>
    </nav>
    <Outlet context={{ panelToken, onLock }} />
  </div>
}
