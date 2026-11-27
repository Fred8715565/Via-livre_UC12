import { useEffect, useRef, useState } from 'react'
import { shouldDismiss } from '../services/sheet'
// Janela em formato de painel inferior: o puxador arrasta para baixo para fechar (Esc e Cancelar continuam valendo).
export default function Modal({ title, onClose, children }) {
  const r = useRef(), g = useRef(null); const [dy, setDy] = useState(0)
  useEffect(() => { if (!r.current.open) r.current.showModal() }, [])
  const down = e => { e.currentTarget.setPointerCapture?.(e.pointerId); g.current = { y: e.clientY, last: e.clientY, lt: performance.now(), v: 0, dy: 0 } }
  const move = e => { const s = g.current; if (!s) return; const n = performance.now(); s.v = (e.clientY - s.last) / Math.max(1, n - s.lt); s.last = e.clientY; s.lt = n; s.dy = Math.max(0, e.clientY - s.y); setDy(s.dy) }
  const up = () => { const s = g.current; g.current = null; if (!s) return; if (shouldDismiss(s.dy, performance.now() - s.lt > 120 ? 0 : s.v)) onClose(); else setDy(0) }
  return (<dialog ref={r} className="modal" aria-labelledby="mt" onClose={onClose} onClick={e => e.target === r.current && onClose()}
    style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: g.current ? 'none' : 'transform .2s' }}>
    <div className="grab" aria-hidden="true" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><i className="alca" /></div>
    <h2 id="mt">{title}</h2>{children}</dialog>)
}
