import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { STEPS, etaMin, sheetTitle } from '../data/places'
import { USER, fmt, lerp } from '../services/geo'
import LMap from '../components/LMap'
import Modal from '../components/Modal'
export default function Drone() {
  const { places, profile, drone, step, startDrone, cancelDrone, resetDrone, notify } = useApp(); const [params] = useSearchParams()
  const [destId, setDestId] = useState(params.get('destino') || drone.destId || places[0].id); const [em, setEm] = useState(false)
  const dest = places.find(p => p.id === destId) || places[0]; const running = drone.running
  const base = [USER[0] - 0.003, USER[1] - 0.003]; const t = drone.t
  const pos = step === 0 ? base : step === 1 ? lerp(base, USER, (t - 3000) / 4000) : step === 2 ? lerp(USER, dest.pos, (t - 7000) / 8000) : dest.pos
  const markers = useMemo(() => [{ pos: USER, label: 'Você', kind: 'user' }, { pos: dest.pos, label: `${dest.name} — acessível`, kind: 'dest' }, ...(step >= 0 ? [{ pos, kind: 'drone' }] : [])], [dest, step, t]) // eslint-disable-line
  return (<section className="page t-sinal">
    <div className="mp sig"><LMap markers={markers} fitKey={destId} label="Mapa com você, o destino e o drone-guia" />
      <button className="emerg" onClick={() => setEm(true)}><img src="/img/sos.png" alt="" width="24" height="20" />Emergência</button></div>
    <div className="folha" role="status" aria-live="polite"><i className="alca" aria-hidden="true" />
      <div className="cab">{step === 3 ? <img src="/img/ok.png" alt="" width="50" height="49" /> : <span className="ok" aria-hidden="true">🚁</span>}
        <div><h2>{sheetTitle(step)}</h2><small>{dest.name} — entrada acessível</small></div>
        {step >= 0 && <b className="min">{etaMin(step)}<small>min</small></b>}</div>
      {step < 0 ? (<><label className="dest">Destino<select value={destId} onChange={e => setDestId(e.target.value)}>{places.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.dist)}</option>)}</select></label>
          <button className="btn" onClick={() => startDrone(destId)}>✦ Chamar drone até aqui</button></>)
        : (<><ol className="tl">{STEPS.map((s, i) => <li key={s.title} className={i < step ? 'feito' : i === step ? 'atual' : 'futuro'}>{s.title}</li>)}</ol>
          {running ? <button className="cancelar" onClick={cancelDrone}>Cancelar sinal</button>
            : <div className="fim"><Link className="btn" to="/historico" onClick={resetDrone}>Avaliar trajeto</Link><button className="cancelar" onClick={resetDrone}>Fechar</button></div>}</>)}
      <p className="demo"><b>Drone demonstrativo:</b> não há conexão com um drone físico real; tudo aqui é uma simulação.{profile.slow && ' Velocidade reduzida ativada.'}</p></div>
    {em && (<Modal title="Confirmar emergência?" onClose={() => setEm(false)}>
      <p>Seus contatos cadastrados seriam avisados (simulação):</p>
      <ul className="contacts"><li><b>{profile.ecName || 'Contato não cadastrado'}</b> — {profile.ecPhone || 'sem telefone'}</li><li>SAMU — 192</li><li>Bombeiros — 193</li></ul>
      <p className="demo">Modo demonstrativo: nenhuma ligação ou mensagem real é enviada. Em emergência real, ligue 192.</p>
      <div className="row end"><button className="btn gray" onClick={() => setEm(false)}>Cancelar</button>
        <button className="btn red" onClick={() => { notify('Emergência confirmada (demonstração): contatos avisados.'); setEm(false) }}>Confirmar emergência</button></div></Modal>)}
  </section>)
}
