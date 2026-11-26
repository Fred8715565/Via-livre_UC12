import { NavLink } from 'react-router-dom'
import { Home, Map as MapIcon, Navigation, Settings } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../auth/AuthContext'
const ITEMS = [['/', 'Início', Home], ['/mapa', 'Mapa', MapIcon], ['/ir', 'Ir', Navigation], ['/perfil', 'Perfil', Settings]]
// Celular/tablet: barra de abas embaixo. Computador/notebook (≥ 1024 px): menu lateral.
export default function TabBar({ hideOnMobile }) {
  const { profile } = useApp(); const { user } = useAuth()
  const accountName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.phone || profile.name
  return (<nav className={'tabbar' + (hideOnMobile ? ' hide-m' : '')} aria-label="Principal">
    <span className="brand"><i aria-hidden="true" />Via Livre</span>
    {ITEMS.map(([to, label, Icon]) => (<NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}><Icon size={17} strokeWidth={1.6} aria-hidden="true" />{label}</NavLink>))}
    <div className="who"><span className="avatar" aria-hidden="true">{accountName.trim()[0]?.toUpperCase() || '?'}</span>
      <div><strong>{accountName || 'Usuário'}</strong><small>{profile.mobility.join(', ') || 'Mobilidade não informada'}</small></div></div></nav>)
}
