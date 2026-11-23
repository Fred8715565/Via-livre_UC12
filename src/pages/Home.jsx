import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { USER } from '../services/geo'
import { nearest } from '../services/places'
import LMap from '../components/LMap'
import PlaceCard from '../components/PlaceCard'
export default function Home() {
  const { profile, places, notifs, markRead, clearNotifs, startDrone } = useApp(); const nav = useNavigate(); const [open, setOpen] = useState(false)
  const unread = notifs.filter(n => !n.read).length; const near = places.slice(0, 3)
  const markers = useMemo(() => [{ pos: USER, label: 'Você', kind: 'user' }, ...places.slice(0, 3).map(p => ({ pos: p.pos, label: p.name, kind: 'dest' }))], [places])
  return (<section className="page t-inicio">
    <header className="topo"><span className="dot" aria-hidden="true" /><b>Via Livre</b><img className="senac" src="/img/senac.png" alt="Senac" width="33" height="20" />
      <div className="bellwrap" onKeyDown={e => e.key === 'Escape' && setOpen(false)}>
        <button className="bell" aria-expanded={open} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ''}`} onClick={() => { setOpen(!open); markRead() }}><Bell size={16} strokeWidth={1.3} aria-hidden="true" />{unread > 0 && <i aria-hidden="true" />}</button>
        {open && (<div className="pop" role="region" aria-label="Notificações"><h2>Notificações</h2>
          {notifs.length === 0 ? <p>Nenhuma notificação ainda. Chame o drone para começar.</p> : <ul>{notifs.map(n => <li key={n.id}><small>{n.time}</small> {n.text}</li>)}</ul>}
          {notifs.length > 0 && <button className="link" onClick={clearNotifs}>Limpar notificações</button>}</div>)}</div></header>
    <h1>Bom te ver, {profile.name.split(' ')[0] || 'bem-vindo(a)'}</h1>
    <p className="sub">Peça um drone-guia até o lugar acessível mais perto de você.</p>
    <section className="hero"><small>DRONE-GUIA</small><h2>Um sinal, e o drone vem te mostrar o caminho acessível</h2>
      <button className="btn" onClick={() => { startDrone(nearest(places).id); nav('/drone') }}>✦ Enviar sinal ao drone</button></section>
    <div className="mp ini"><LMap markers={markers} fitKey="home" label="Mapa com sua localização e lugares acessíveis por perto" /></div>
    <div className="linha"><h3>Perto de você</h3><Link className="link" to="/mapa">ver mapa</Link></div>
    {near.map(p => <PlaceCard key={p.id} p={p} />)}
    <p className="aviso"><b>Antes de chamar</b>: o drone guia por um sinal de luz que você segue visualmente. Ainda não é indicado para pessoas com deficiência visual.</p>
  </section>)
}
