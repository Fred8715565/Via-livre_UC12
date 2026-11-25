import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { fmt } from '../services/geo'
import PageHead from '../components/PageHead'
import Modal from '../components/Modal'
import Stars from '../components/Stars'
export default function History() {
  const { history, places, rate, removeTrip, notify } = useApp(); const [id, setId] = useState(null); const [confirm, setConfirm] = useState(false)
  const trip = history.find(h => h.id === id); const place = trip && places.find(p => p.id === trip.placeId)
  const close = () => { setId(null); setConfirm(false) }
  return (<section className="page">
    <PageHead title="Histórico de trajetos" sub="Seus últimos trajetos, de Uber ou pelo Maps" />
    {history.length === 0 && <p className="empty">Você ainda não fez trajetos. Escolha um lugar e vá de Uber ou pelo Maps.</p>}
    <ul className="trips">{history.map(h => (<li key={h.id}><button className="trip" onClick={() => setId(h.id)} aria-label={`${h.name}, ${h.date}. Ver detalhes`}>
      <span className="em" aria-hidden="true">{h.emoji}</span><span className="grow"><strong>{h.name}</strong><small>{h.date}{h.via ? ` · ${h.via}` : ''}</small></span><Stars value={h.rating} /></button></li>))}</ul>
    {trip && (<Modal title={trip.name} onClose={close}>
      {!confirm ? (<>
        <p><b>Data:</b> {trip.date}{trip.via && <><br /><b>Como foi:</b> {trip.via === 'Uber' ? 'Uber' : 'Maps'}</>}{place && <><br /><b>Distância:</b> {fmt(place.dist)}<br /><b>Recursos:</b> {place.features.join(', ')}</>}</p>
        <p id="av">Sua avaliação:</p><Stars value={trip.rating} onChange={n => { rate(trip.id, n); notify(`Avaliação salva para ${trip.name}.`) }} />
        <div className="row end"><button className="btn red" onClick={() => setConfirm(true)}>Excluir trajeto</button><button className="btn teal" onClick={close}>Fechar</button></div></>)
      : (<><p>Excluir o trajeto para <b>{trip.name}</b> ({trip.date})? Essa ação não pode ser desfeita.</p>
        <div className="row end"><button className="btn gray" onClick={() => setConfirm(false)}>Voltar</button>
          <button className="btn red" onClick={() => { removeTrip(trip.id); notify('Trajeto excluído.'); close() }}>Sim, excluir</button></div></>)}</Modal>)}
  </section>)
}
