import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { STEPS } from '../data/places'
import { USER, fmt, lerp } from '../services/geo'
import PageHead from '../components/PageHead'
import LMap from '../components/LMap'
import Modal from '../components/Modal'
export default function Drone() {
  const { places, profile, drone, step, startDrone, cancelDrone, notify } = useApp(); const [params] = useSearchParams()
  const [destId, setDestId] = useState(params.get('destino') || drone.destId || places[0].id); const [em, setEm] = useState(false)
  const dest = places.find(p => p.id === destId) || places[0]; const running = drone.running
  const base = [USER[0] - 0.003, USER[1] - 0.003]; const t = drone.t
  const pos = step === 0 ? base : step === 1 ? lerp(base, USER, (t - 3000) / 4000) : step === 2 ? lerp(USER, dest.pos, (t - 7000) / 8000) : dest.pos
  const markers = useMemo(() => [{ pos: USER, label: 'Você', kind: 'user' }, { pos: dest.pos, label: `${dest.name} — acessível`, kind: 'dest' }, ...(step >= 0 ? [{ pos, kind: 'drone' }] : [])], [dest, step, t]) // eslint-disable-line
  const pct = step < 0 ? 0 : Math.min(100, Math.round((t / 15000) * 100))
  return (<section className="page">
    <PageHead title="Chamar drone-guia" sub={`Destino: ${dest.name} - ${fmt(dest.dist)}, entrada acessível`}>
      <button className="btn red" onClick={() => setEm(true)}>Emergência</button>
      {running ? <button className="btn gray" onClick={cancelDrone}>Cancelar pedido</button>
        : <button className="btn teal" onClick={() => startDrone(destId)}><Star size={16} aria-hidden="true" /> Chamar drone-guia</button>}
    </PageHead>
    <label className="dest">Destino<select value={destId} disabled={running} onChange={e => setDestId(e.target.value)}>{places.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.dist)}</option>)}</select></label>
    {step >= 0 && (<div className="status" role="status" aria-live="polite"><span className="ico" aria-hidden="true">🛸</span>
      <div><strong>{STEPS[step].title}</strong><br /><span>{STEPS[step].live}</span></div>
      {running ? <span className="dots" aria-hidden="true"><i /><i /><i /><i /></span> : <Link className="link" to="/historico">Avaliar trajeto</Link>}
      <div className="bar" role="progressbar" aria-label="Progresso do trajeto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div style={{ width: pct + '%' }} /></div></div>)}
    <LMap markers={markers} fitKey={destId} label="Mapa com você, o destino e o drone-guia" />
    <p className="demo"><b>Drone demonstrativo:</b> não há conexão com um drone físico real. Tudo aqui é uma simulação.{profile.slow && ' Velocidade reduzida ativada.'}</p>
    {em && (<Modal title="Confirmar emergência?" onClose={() => setEm(false)}>
      <p>Seus contatos cadastrados seriam avisados (simulação):</p>
      <ul className="contacts"><li><b>{profile.ecName || 'Contato não cadastrado'}</b> — {profile.ecPhone || 'sem telefone'}</li><li>SAMU — 192</li><li>Bombeiros — 193</li></ul>
      <p className="demo">Modo demonstrativo: nenhuma ligação ou mensagem real é enviada. Em emergência real, ligue 192.</p>
      <div className="row end"><button className="btn gray" onClick={() => setEm(false)}>Cancelar</button>
        <button className="btn red" onClick={() => { notify('Emergência confirmada (demonstração): contatos avisados.'); setEm(false) }}>Confirmar emergência</button></div></Modal>)}
  </section>)
}
