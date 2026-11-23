import { Link } from 'react-router-dom'
import { fmt } from '../services/geo'
export default function PlaceCard({ p, selected }) {
  return (<Link to={`/lugar/${p.id}`} className={'card' + (selected ? ' sel' : '')}>
    {p.key ? <img src={`/img/ic-${p.key}.png`} alt="" width="33" height="34" /> : <span className="th" aria-hidden="true">{p.emoji}</span>}
    <span className="tx"><b>{p.name}</b><small>{p.features.join(' · ')}</small></span><b className="dist">{fmt(p.dist)}</b></Link>)
}
