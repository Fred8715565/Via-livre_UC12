import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { USER, fmt } from '../services/geo'
import { MODES, walkMinutes } from '../services/trip'
import { clamp, cycleSnap, nearestSnap, snapPoints, stepSnap } from '../services/sheet'
import LMap from '../components/LMap'
import Modal from '../components/Modal'
import TripActions from '../components/TripActions'
const useVH = () => { const [h, setH] = useState(window.innerHeight); useEffect(() => { const f = () => setH(window.innerHeight); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, []); return Math.max(h, 480) }
const useMedia = q => { const [m, setM] = useState(() => window.matchMedia(q).matches); useEffect(() => { const mq = window.matchMedia(q), f = () => setM(mq.matches); mq.addEventListener?.('change', f); return () => mq.removeEventListener?.('change', f) }, [q]); return m }
export default function Trip() {
  const { places, profile, notify } = useApp(); const [params] = useSearchParams()
  const [destId, setDestId] = useState(params.get('destino') || places[0].id); const [mode, setMode] = useState(profile.mapsMode); const [em, setEm] = useState(false)
  const dest = places.find(p => p.id === destId) || places[0]
  const markers = useMemo(() => [{ pos: USER, label: 'Você', kind: 'user' }, { pos: dest.pos, label: dest.name, kind: 'dest' }], [dest])
  // painel arrastável: 3 alturas de encaixe (recolhido, padrão, expandido)
  const wide = useMedia('(min-width: 1024px)'); const VH = useVH(); const pts = snapPoints(VH); const [idx, setIdx] = useState(1); const [dragH, setDragH] = useState(null); const g = useRef(null)
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
  return (<section className="page t-ir" style={{ height: VH }}>
    <div className="mp sig"><LMap markers={markers} fitKey={destId} bottomPad={wide ? 0 : pts[1]} label="Mapa com você e o destino" />
      <button className="emerg" onClick={() => setEm(true)}><img src="/img/sos.png" alt="" width="24" height="20" />Emergência</button></div>
    <div className={'folha' + (dragH != null ? ' drag' : '')} style={{ height: h }}>
      <div className="grab" role="separator" aria-orientation="horizontal" tabIndex={0} aria-label="Arrastar painel para cima ou para baixo" aria-valuemin={pts[0]} aria-valuemax={pts[2]} aria-valuenow={Math.round(h)} aria-valuetext={estado}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}><i className="alca" aria-hidden="true" /></div>
      <div className="scroll">
        <div className="cab"><span className="ok" aria-hidden="true">🧭</span><div><h2>Como ir até aqui</h2><small>{dest.name}</small></div></div>
        <label className="dest">Destino<select value={destId} onChange={e => setDestId(e.target.value)}>{places.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.dist)}</option>)}</select></label>
        <p className="resumo"><b>{fmt(dest.dist)}</b> em linha reta · a pé ≈ <b>{walkMinutes(dest.dist)} min</b> <small>(estimativa)</small></p>
        <label className="dest">Como ir pelo Maps<select value={mode} onChange={e => setMode(e.target.value)}>{Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <TripActions place={dest} mode={mode} />
        <p className="tip"><b>Sem Uber?</b> Toque em “Ir pelo Maps” para seguir pelo Google Maps, sem pagar corrida.</p>
        {profile.wav && <p className="tip">No Uber, para cadeira de rodas, escolha o carro acessível (WAV) quando houver na sua cidade.</p>}
      </div></div>
    {em && (<Modal title="Confirmar emergência?" onClose={() => setEm(false)}>
      <p>Seus contatos cadastrados seriam avisados (simulação):</p>
      <ul className="contacts"><li><b>{profile.ecName || 'Contato não cadastrado'}</b> — {profile.ecPhone || 'sem telefone'}</li><li>SAMU — 192</li><li>Bombeiros — 193</li></ul>
      <p className="demo">Modo demonstrativo: nenhuma ligação ou mensagem real é enviada. Em emergência real, ligue 192.</p>
      <div className="row end"><button className="btn gray" onClick={() => setEm(false)}>Cancelar</button>
        <button className="btn red" onClick={() => { notify('Emergência confirmada (demonstração): contatos avisados.'); setEm(false) }}>Confirmar emergência</button></div></Modal>)}
  </section>)
}
