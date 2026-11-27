import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { USER } from '../services/geo'
import { nearest } from '../services/places'
import LMap from '../components/LMap'
import PlaceCard from '../components/PlaceCard'
import TripActions from '../components/TripActions'
import { fmt } from '../services/geo'
import { useAuth } from '../auth/AuthContext'
export default function Home() {
  const { profile, places, notifs, markRead, clearNotifs } = useApp(); const { user } = useAuth(); const [open, setOpen] = useState(false)
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || profile.name
  const unread = notifs.filter(n => !n.read).length; const near = places.slice(0, 3); const target = nearest(places)
  const markers = useMemo(() => [{ pos: USER, label: 'Você', kind: 'user' }, ...places.slice(0, 3).map(p => ({ pos: p.pos, label: p.name, kind: 'dest' }))], [places])
  return (<section className="page t-inicio">
    <header className="topo"><span className="dot" aria-hidden="true" /><b>Via Livre</b><img className="senac" src="/img/senac.png" alt="Senac" width="33" height="20" />
      <div className="bellwrap" onKeyDown={e => e.key === 'Escape' && setOpen(false)}>
        <button className="bell" aria-expanded={open} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ''}`} onClick={() => { setOpen(!open); markRead() }}><Bell size={16} strokeWidth={1.3} aria-hidden="true" />{unread > 0 && <i aria-hidden="true" />}</button>
        {open && (<div className="pop" role="region" aria-label="Notificações"><h2>Notificações</h2>
          {notifs.length === 0 ? <p>Nenhuma notificação ainda. Abra o Uber ou o Maps para começar.</p> : <ul>{notifs.map(n => <li key={n.id}><small>{n.time}</small> {n.text}</li>)}</ul>}
          {notifs.length > 0 && <button className="link" onClick={clearNotifs}>Limpar notificações</button>}</div>)}</div></header>
    <div className="saud"><h1>Bom te ver, {displayName.split(' ')[0] || 'bem-vindo(a)'}</h1>
      <p className="sub">Encontre locais, converse com a comunidade e escolha Uber, 99 ou Maps para chegar.</p></div>
    <section className="hero"><small>COMO IR</small><h2>Escolha como chegar: Uber, 99 ou Maps</h2>
      <p className="alvo">Mais perto de você: <b>{target.name}</b> · {fmt(target.dist)}</p><TripActions place={target} /></section>
    <div className="mp ini"><LMap markers={markers} fitKey="home" label="Mapa com sua localização e lugares acessíveis por perto" /></div>
    <div className="linha"><h3>Perto de você</h3><Link className="link" to="/mapa">ver mapa</Link></div>
    <div className="cards-home">{near.map(p => <PlaceCard key={p.id} p={p} />)}</div>
    <p className="aviso"><b>Antes de ir</b>: confira os recursos do lugar. Uber e 99 dependem de disponibilidade na sua região. O link da 99 abre o canal oficial para você informar o destino. Os locais extras são ilustrativos e precisam ser confirmados.</p>
  </section>)
}
