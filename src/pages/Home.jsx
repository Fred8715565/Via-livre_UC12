import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHead from '../components/PageHead'
import PlaceCard from '../components/PlaceCard'
import SuggestModal from '../components/SuggestModal'
export default function Home() {
  const { profile, places } = useApp(); const nav = useNavigate(); const [q, setQ] = useState(''); const [open, setOpen] = useState(false)
  const top = [...places].filter(p => p.reviews).sort((a, b) => b.rating - a.rating).slice(0, 4)
  return (<section className="page">
    <PageHead title={`Olá, ${profile.name.split(' ')[0] || 'bem-vindo(a)'}!`} sub="Para onde o drone vai te levar hoje?"><button className="btn gray" onClick={() => setOpen(true)}>Sugerir um lugar</button></PageHead>
    <form role="search" className="search hero" onSubmit={e => { e.preventDefault(); nav('/mapa?q=' + encodeURIComponent(q.trim())) }}>
      <Search size={20} aria-hidden="true" /><input aria-label="Buscar lugar acessível" placeholder="Buscar lugar acessível..." value={q} onChange={e => setQ(e.target.value)} /><button className="btn teal">Buscar</button></form>
    <div className="row start"><Link className="btn teal" to="/drone">Chamar drone-guia</Link><Link className="btn gray" to="/mapa">Explorar o mapa</Link></div>
    <h2>Sugestões de locais acessíveis</h2>
    <div className="cards">{top.map(p => <PlaceCard key={p.id} p={p} />)}</div>
    <p className="demo">Locais, distâncias e avaliações são dados demonstrativos.</p>
    {open && <SuggestModal onClose={() => setOpen(false)} />}
  </section>)
}
