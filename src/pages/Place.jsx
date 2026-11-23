import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'
export default function Place() {
  const { id } = useParams(); const { places, startDrone } = useApp(); const nav = useNavigate()
  const p = places.find(x => x.id === id)
  if (!p) return <Navigate to="/mapa" replace />
  return (<section className="page t-detalhe">
    <div className="capa"><button className="volta" onClick={() => nav(-1)} aria-label="Voltar"><ArrowLeft size={20} /></button>
      {p.key ? <img className="emo" src={`/img/capa-${p.key}.png`} alt="" width="72" height="76" /> : <span className="emo" aria-hidden="true">{p.emoji}</span>}</div>
    <div className="corpo"><h1>{p.name}</h1>
      <p className="meta">{p.reviews ? `★ ${p.rating.toFixed(1)} · ${p.reviews} avaliações · ` : 'Sugestão sua · '}{p.address}{p.hours ? ` · ${p.hours}` : ''}</p>
      <p className="desc">{p.about || p.notes || 'Lugar sugerido por você.'}</p>
      <ul className="rec">{p.features.map(f => <li key={f}><span aria-hidden="true">✓</span><span>{f}</span></li>)}</ul></div>
    <div className="rodape"><button className="btn" onClick={() => { startDrone(p.id); nav('/drone?destino=' + p.id) }}>✦ Chamar drone até aqui</button></div>
  </section>)
}
