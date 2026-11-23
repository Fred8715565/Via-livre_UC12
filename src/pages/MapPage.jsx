import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { FEATURES, USER } from '../services/geo'
import PageHead from '../components/PageHead'
import LMap from '../components/LMap'
import PlaceCard from '../components/PlaceCard'
import SuggestModal from '../components/SuggestModal'
export default function MapPage() {
  const { places } = useApp(); const [params] = useSearchParams(); const q = (params.get('q') || '').toLowerCase()
  const [active, setActive] = useState([]); const [sel, setSel] = useState(null); const [open, setOpen] = useState(false)
  const list = useMemo(() => places.filter(p => active.every(f => p.features.includes(f)) && (!q || (p.name + ' ' + p.features.join(' ')).toLowerCase().includes(q))), [places, active, q])
  const markers = useMemo(() => [{ pos: USER, label: 'Você', kind: 'user' }, ...list.map(p => ({ id: p.id, pos: p.pos, label: p.name, kind: p.id === sel ? 'sel' : 'dest' }))], [list, sel])
  const toggle = f => setActive(a => (a.includes(f) ? a.filter(x => x !== f) : [...a, f]))
  const focus = useMemo(() => places.find(p => p.id === sel)?.pos, [places, sel])
  return (<section className="page">
    <PageHead title="Explorar lugares acessíveis" sub="Filtre por recursos e escolha para onde o drone vai te levar."><button className="btn gray" onClick={() => setOpen(true)}>Sugerir um lugar</button></PageHead>
    <div className="chips" role="group" aria-label="Filtros de acessibilidade">{FEATURES.map(f => (
      <button key={f} className={'chip' + (active.includes(f) ? ' on' : '')} aria-pressed={active.includes(f)} onClick={() => toggle(f)}>{f}</button>))}</div>
    <p className="count" aria-live="polite">{list.length} {list.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}{q && ` para “${params.get('q')}”`}{active.length > 0 && <> · <button className="link" onClick={() => setActive([])}>Limpar filtros</button></>}</p>
    <LMap markers={markers} fitKey={list.map(p => p.id).join() + active.join()} focus={focus} onMarker={setSel} label="Mapa com sua localização e os lugares acessíveis" />
    {list.length === 0 && <p className="empty">Nenhum lugar tem todos esses recursos. Remova algum filtro ou sugira um lugar.</p>}
    <div className="cards">{list.map(p => <PlaceCard key={p.id} p={p} selected={p.id === sel} onSelect={() => setSel(p.id)} />)}</div>
    <p className="demo">Locais, distâncias, avaliações e sua posição são dados demonstrativos.</p>
    {open && <SuggestModal onClose={() => setOpen(false)} />}
  </section>)
}
