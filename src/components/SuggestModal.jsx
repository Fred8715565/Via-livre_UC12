import { useState } from 'react'
import Modal from './Modal'
import { FEATURES } from '../services/geo'
import { useApp } from '../context/AppContext'
export default function SuggestModal({ onClose }) {
  const { addPlace, notify } = useApp()
  const [name, setName] = useState(''); const [feats, setFeats] = useState([]); const [err, setErr] = useState('')
  const submit = e => { e.preventDefault()
    if (name.trim().length < 3) return setErr('Informe o nome do lugar (mínimo 3 letras).')
    if (!feats.length) return setErr('Marque pelo menos um recurso de acessibilidade.')
    addPlace({ name: name.trim(), features: feats }); notify(`Obrigado! "${name.trim()}" foi adicionado como sugestão.`); onClose() }
  return (<Modal title="Sugerir um lugar" onClose={onClose}><form onSubmit={submit} noValidate>
    <label>Nome do lugar<input value={name} onChange={e => setName(e.target.value)} autoFocus aria-invalid={!!err} /></label>
    <fieldset><legend>Recursos de acessibilidade</legend>{FEATURES.map(f => (
      <label key={f} className="check"><input type="checkbox" checked={feats.includes(f)} onChange={() => setFeats(a => a.includes(f) ? a.filter(x => x !== f) : [...a, f])} />{f}</label>))}</fieldset>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="row end"><button type="button" className="btn gray" onClick={onClose}>Cancelar</button><button className="btn teal">Enviar sugestão</button></div></form></Modal>)
}
