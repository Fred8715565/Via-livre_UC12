import { Link } from 'react-router-dom'
import { fmt } from '../services/geo'
export default function PlaceCard({ p, selected, onSelect }) {
  return (<article className={'card' + (selected ? ' sel' : '')}>
    <div className="row"><h3>{p.name}</h3><span>{fmt(p.dist)}</span></div>
    <p>{p.reviews ? <><span aria-hidden="true">★</span> {p.rating.toFixed(1)} · {p.reviews} avaliações</> : 'Sugestão sua · sem avaliações'}</p>
    <ul className="tags">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
    <div className="row acts2">{onSelect ? <button className="link" onClick={onSelect}>Ver no mapa</button> : <span />}<Link className="link" to={`/drone?destino=${p.id}`}>Levar até aqui</Link></div>
  </article>)
}
