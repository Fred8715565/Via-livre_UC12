import { useState } from 'react'
import { Car, Navigation, CarFront } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt } from '../services/geo'
import { MODES, mapsUrl, uberUrl, app99Url, walkMinutes } from '../services/trip'
import Modal from './Modal'
// Dois jeitos de chegar: "Chamar Uber" ou "Ir pelo Maps" (sem Uber, só pelo mapa).
export default function TripActions({ place, mode }) {
  const { profile, addTrip } = useApp(); const [ask, setAsk] = useState(null); const m = mode || profile.mapsMode
  const go = via => { addTrip(place, via); const url = via === 'Uber' ? uberUrl(place) : via === '99' ? app99Url() : mapsUrl(place, m); window.open(url, '_blank', 'noopener'); setAsk(null) }
  const start = via => (profile.confirm ? setAsk(via) : go(via))
  return (<>
    <div className="acoes">
      <button className="btn uber" onClick={() => start('Uber')}><Car size={18} aria-hidden="true" />Chamar Uber</button>
      <button className="btn noventa" onClick={() => start('99')}><CarFront size={18} aria-hidden="true" />Abrir 99</button>
      <button className="btn" onClick={() => start('Maps')}><Navigation size={18} aria-hidden="true" />Ir pelo Maps</button>
    </div>
    {ask && (<Modal title={ask === 'Uber' ? 'Abrir o Uber?' : ask === '99' ? 'Abrir a 99?' : 'Abrir o Maps?'} onClose={() => setAsk(null)}>
      <p>Destino: <b>{place.name}</b> — {fmt(place.dist)} em linha reta.</p>
      {ask === '99' ? <p className="demo">O app 99 será aberto. Por enquanto, informe o destino manualmente; a 99 não oferece um link público estável para preencher a corrida automaticamente.</p> : ask === 'Uber'
        ? <p className="demo">{profile.wav ? 'Dica: no Uber, escolha a opção de carro acessível (WAV) se houver na sua cidade. ' : ''}O preço e o tempo aparecem no Uber.</p>
        : <p className="demo">Modo: {MODES[m]}. A pé, leva cerca de {walkMinutes(place.dist)} min (estimativa). Sem custo de corrida.</p>}
      <p className="demo">Você vai sair do Via Livre. Os lugares deste app são demonstrativos.</p>
      <div className="row end"><button className="btn gray" onClick={() => setAsk(null)}>Cancelar</button>
        <button className="btn" onClick={() => go(ask)}>{ask === 'Uber' ? 'Abrir Uber' : ask === '99' ? 'Abrir 99' : 'Abrir Maps'}</button></div></Modal>)}
  </>)
}
