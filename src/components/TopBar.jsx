import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
export default function TopBar() {
  const { notifs, markRead, clearNotifs } = useApp(); const nav = useNavigate(); const { pathname } = useLocation()
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false)
  const unread = notifs.filter(n => !n.read).length
  return (<header className="topbar">
    {pathname === '/' ? <span /> : (
      <form role="search" className="search" onSubmit={e => { e.preventDefault(); nav('/mapa?q=' + encodeURIComponent(q.trim())) }}>
        <Search size={18} aria-hidden="true" /><input aria-label="Buscar lugar acessível" placeholder="Buscar lugar acessível..." value={q} onChange={e => setQ(e.target.value)} /></form>)}
    <div className="bellwrap" onKeyDown={e => e.key === 'Escape' && setOpen(false)}>
      <button className="bell" aria-expanded={open} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ''}`} onClick={() => { setOpen(!open); markRead() }}>
        <Bell size={22} aria-hidden="true" />{unread > 0 && <i aria-hidden="true">{unread}</i>}</button>
      {open && (<div className="pop" role="region" aria-label="Notificações"><h2>Notificações</h2>
        {notifs.length === 0 ? <p>Nenhuma notificação ainda. Chame o drone para começar.</p> : <ul>{notifs.map(n => <li key={n.id}><small>{n.time}</small> {n.text}</li>)}</ul>}
        {notifs.length > 0 && <button className="link" onClick={clearNotifs}>Limpar notificações</button>}</div>)}
    </div></header>)
}
