import { useEffect, useRef } from 'react'
export default function Modal({ title, onClose, children }) {
  const r = useRef()
  useEffect(() => { if (!r.current.open) r.current.showModal() }, [])
  return (<dialog ref={r} className="modal" aria-labelledby="mt" onClose={onClose} onClick={e => e.target === r.current && onClose()}>
    <h2 id="mt">{title}</h2>{children}</dialog>)
}
