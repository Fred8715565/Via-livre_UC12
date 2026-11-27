import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { STEPS, etaMin, sheetTitle } from '../data/places'
import { USER, fmt, lerp } from '../services/geo'
import { clamp, cycleSnap, nearestSnap, snapPoints, stepSnap } from '../services/sheet'
import LMap from '../components/LMap'
import Modal from '../components/Modal'
const useVH = () => { const [h, setH] = useState(window.innerHeight); useEffect(() => { const f = () => setH(window.innerHeight); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, []); return Math.max(h, 480) }
export default function Drone() {
  const { places, profile, drone, step, startDrone, cancelDrone, resetDrone, notify } = useApp(); const [params] = useSearchParams()
  const [destId, setDestId] = useState(params.get('destino') || drone.destId || places[0].id); const [em, setEm] = useState(false)
  const dest = places.find(p => p.id === destId) || places[0]; const running = drone.running
  const base = [USER[0] - 0.003, USER[1] - 0.003]; const t = drone.t
  const pos = step === 0 ? base : step === 1 ? lerp(base, USER, (t - 3000) / 4000) : step === 2 ? lerp(USER, dest.pos, (t - 7000) / 8000) : dest.pos
  const markers = useMemo(() => [{ pos: USER, label: 'Você', kind: 'user' }, { pos: dest.pos, label: `${dest.name} — acessível`, kind: 'dest' }, ...(step >= 0 ? [{ pos, kind: 'drone' }] : [])], [dest, step, t]) // eslint-disable-line
  // painel arrastável: 3 alturas de encaixe (recolhido, padrão, expandido)
  const VH = useVH(); const pts = snapPoints(VH); const [idx, setIdx] = useState(1); const [dragH, setDragH] = useState(null); const g = useRef(null)
  const h = dragH ?? pts[idx]
  const goto = v => { setIdx(Math.max(0, pts.indexOf(v))); setDragH(null) }
  const down = e => { e.currentTarget.setPointerCapture?.(e.pointerId); const n = performance.now(); g.current = { y: e.clientY, h, last: e.clientY, lt: n, v: 0, moved: 0, cur: h }; setDragH(h) }
  const move = e => { const s = g.current; if (!s) return; const n = performance.now()
    s.v = (s.last - e.clientY) / Math.max(1, n - s.lt); s.last = e.clientY; s.lt = n; s.moved = Math.max(s.moved, Math.abs(s.y - e.clientY))
    s.cur = clamp(s.h + s.y - e.clientY, pts[0] - 24, pts[2]); setDragH(s.cur) }
  const up = () => { const s = g.current; g.current = null; if (!s) return
    goto(s.moved < 4 ? cycleSnap(s.h, pts) : nearestSnap(s.cur, pts, performance.now() - s.lt > 120 ? 0 : s.v)) }
  const key = e => { const d = { ArrowUp: 1, ArrowDown: -1 }[e.key]
    if (d) goto(stepSnap(h, pts, d)); else if (e.key === 'Home') goto(pts[0]); else if (e.key === 'End') goto(pts[2]); else if (e.key === 'Enter' || e.key === ' ') goto(cycleSnap(h, pts)); else return
    e.preventDefault() }
  const estado = h <= pts[0] ? 'Painel recolhido' : h >= pts[2] ? 'Painel expandido' : 'Painel na altura padrão'
  return (<section className="page t-sinal" style={{ height: VH }}>
    <div className="mp sig"><LMap markers={markers} fitKey={destId} bottomPad={pts[1]} label="Mapa com você, o destino e o drone-guia" />
      <button className="emerg" onClick={() => setEm(true)}><img src="/img/sos.png" alt="" width="24" height="20" />Emergência</button></div>
    <div className={'folha' + (dragH != null ? ' drag' : '')} style={{ height: h }}>
      <div className="grab" role="separator" aria-orientation="horizontal" tabIndex={0} aria-label="Arrastar painel do drone para cima ou para baixo" aria-valuemin={pts[0]} aria-valuemax={pts[2]} aria-valuenow={Math.round(h)} aria-valuetext={estado}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}><i className="alca" aria-hidden="true" /></div>
      <div className="scroll">
        <div className="cab" role="status" aria-live="polite">{step === 3 ? <img src="/img/ok.png" alt="" width="50" height="49" /> : <span className="ok" aria-hidden="true">🚁</span>}
          <div><h2>{sheetTitle(step)}</h2><small>{dest.name} — entrada acessível</small></div>
          {step >= 0 && <b className="min">{etaMin(step)}<small>min</small></b>}</div>
        {step < 0 ? (<><label className="dest">Destino<select value={destId} onChange={e => setDestId(e.target.value)}>{places.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.dist)}</option>)}</select></label>
            <button className="btn" onClick={() => startDrone(destId)}>✦ Chamar drone até aqui</button></>)
          : (<><ol className="tl">{STEPS.map((s, i) => <li key={s.title} className={i < step ? 'feito' : i === step ? 'atual' : 'futuro'}>{s.title}</li>)}</ol>
            {running ? <button className="cancelar" onClick={cancelDrone}>Cancelar sinal</button>
              : <div className="fim"><Link className="btn" to="/historico" onClick={resetDrone}>Avaliar trajeto</Link><button className="cancelar" onClick={resetDrone}>Fechar</button></div>}</>)}
        <p className="demo"><b>Drone demonstrativo:</b> não há conexão com um drone físico real; tudo aqui é uma simulação.{profile.slow && ' Velocidade reduzida ativada.'}</p>
      </div></div>
    {em && (<Modal title="Confirmar emergência?" onClose={() => setEm(false)}>
      <p>Seus contatos cadastrados seriam avisados (simulação):</p>
      <ul className="contacts"><li><b>{profile.ecName || 'Contato não cadastrado'}</b> — {profile.ecPhone || 'sem telefone'}</li><li>SAMU — 192</li><li>Bombeiros — 193</li></ul>
      <p className="demo">Modo demonstrativo: nenhuma ligação ou mensagem real é enviada. Em emergência real, ligue 192.</p>
      <div className="row end"><button className="btn gray" onClick={() => setEm(false)}>Cancelar</button>
        <button className="btn red" onClick={() => { notify('Emergência confirmada (demonstração): contatos avisados.'); setEm(false) }}>Confirmar emergência</button></div></Modal>)}
  </section>)
}
