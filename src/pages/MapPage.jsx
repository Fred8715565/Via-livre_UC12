import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { FEATURES, USER } from '../services/geo'
import { filterPlaces, toggle } from '../services/places'
import LMap from '../components/LMap'
import PlaceCard from '../components/PlaceCard'
export default function MapPage() {
  const { places } = useApp(); const [params] = useSearchParams(); const q = params.get('q') || ''; const nav = useNavigate()
  const [active, setActive] = useState([]); const [sel, setSel] = useState(null)
  const list = useMemo(() => filterPlaces(places, active, q), [places, active, q])
  const markers = useMemo(() => [{ pos: USER, label: 'Você', kind: 'user' }, ...list.map(p => ({ id: p.id, pos: p.pos, label: p.name, kind: p.id === sel ? 'sel' : 'dest' }))], [list, sel])
  const focus = useMemo(() => places.find(p => p.id === sel)?.pos, [places, sel])
  return (<section className="page t-explorar">
    <div className="barra"><button className="rd" onClick={() => nav(-1)} aria-label="Voltar"><ArrowLeft size={17} /></button><h1>Explorar</h1>
      <Link className="rd" to="/sugerir" aria-label="Sugerir um lugar"><Plus size={17} /></Link></div>
    <div className="chips" role="group" aria-label="Filtros de acessibilidade">{FEATURES.map(f => (
      <button key={f} className={'chip' + (active.includes(f) ? ' on' : '')} aria-pressed={active.includes(f)} onClick={() => setActive(a => toggle(a, f))}>{f}</button>))}</div>
    <div className="mp expl"><LMap markers={markers} fitKey={list.map(p => p.id).join() + active.join()} focus={focus} onMarker={setSel} label="Mapa com sua localização e os lugares acessíveis" /></div>
    <p className="sr" aria-live="polite">{list.length} {list.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}</p>
    <div className="lista">{list.map(p => <PlaceCard key={p.id} p={p} selected={p.id === sel} />)}</div>
    {list.length === 0 && <p className="aviso">Nenhum lugar tem todos esses recursos. Remova algum filtro ou <Link className="link" to="/sugerir">sugira um lugar</Link>.</p>}
  </section>)
}
