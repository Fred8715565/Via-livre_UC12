import { NavLink } from 'react-router-dom'
import { Home, Map as MapIcon, MapPin, Settings } from 'lucide-react'
const ITEMS = [['/', 'Início', Home], ['/mapa', 'Mapa', MapIcon], ['/drone', 'Sinal', MapPin], ['/perfil', 'Perfil', Settings]]
export default function TabBar() {
  return (<nav className="tabbar" aria-label="Principal">{ITEMS.map(([to, label, Icon]) => (
    <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}><Icon size={17} strokeWidth={1.6} aria-hidden="true" />{label}</NavLink>))}</nav>)
}
