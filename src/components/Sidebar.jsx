import { NavLink } from 'react-router-dom'
import { Home, Globe, Star, Menu, Settings } from 'lucide-react'
import { useApp } from '../context/AppContext'
const ITEMS = [['/', 'Início', Home], ['/mapa', 'Mapa', Globe], ['/drone', 'Sinal do drone', Star], ['/historico', 'Histórico', Menu], ['/perfil', 'Perfil e ajustes', Settings]]
export default function Sidebar() {
  const { profile } = useApp()
  return (<aside className="sidebar">
    <div className="logo"><span className="dot" aria-hidden="true" />Via Livre</div>
    <nav aria-label="Principal"><ul>{ITEMS.map(([to, label, Icon]) => (
      <li key={to}><NavLink to={to} end={to === '/'} className={({ isActive }) => 'nav' + (isActive ? ' active' : '')}><Icon size={20} aria-hidden="true" /><span>{label}</span></NavLink></li>))}</ul></nav>
    <div className="who"><span className="avatar" aria-hidden="true">{profile.name.trim()[0]?.toUpperCase() || '?'}</span>
      <div><strong>{profile.name || 'Usuário'}</strong><small>{profile.mobility.join(', ') || 'Mobilidade não informada'}</small></div></div>
  </aside>)
}
