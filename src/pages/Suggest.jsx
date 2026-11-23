import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { FEATURES } from '../services/geo'
import { toggle, validateSuggestion } from '../services/places'
export default function Suggest() {
  const { addPlace, notify } = useApp(); const nav = useNavigate()
  const [f, setF] = useState({ name: '', address: '', notes: '' }); const [feats, setFeats] = useState([]); const [err, setErr] = useState('')
  const up = (k, v) => setF(x => ({ ...x, [k]: v }))
  const submit = e => { e.preventDefault()
    const errs = validateSuggestion({ ...f, features: feats }); if (errs.length) return setErr(errs[0])
    addPlace({ name: f.name.trim(), address: f.address.trim(), notes: f.notes.trim(), features: feats })
    notify(`Obrigado! "${f.name.trim()}" foi adicionado como sugestão.`); nav('/mapa') }
  return (<form className="page t-sugerir" onSubmit={submit} noValidate>
    <div className="barra"><button type="button" className="rd" onClick={() => nav(-1)} aria-label="Voltar"><ArrowLeft size={17} /></button><h1>Sugerir lugar</h1><i /></div>
    <p className="sub">Ajude outras pessoas contribuindo com um local que você conhece.</p>
    <label>Nome do local<input value={f.name} onChange={e => up('name', e.target.value)} placeholder="Ex: Padaria Bom Pão" aria-invalid={!!err} /></label>
    <label>Endereço<input value={f.address} onChange={e => up('address', e.target.value)} placeholder="Rua, Número, bairro" /></label>
    <p className="rot" id="rec">Recursos de acessibilidade</p>
    <div className="pills" role="group" aria-labelledby="rec">{FEATURES.map(x => (
      <button type="button" key={x} className={'pill2' + (feats.includes(x) ? ' on' : '')} aria-pressed={feats.includes(x)} onClick={() => setFeats(a => toggle(a, x))}>{x}</button>))}</div>
    <label className="obs">Observações (opcional)<textarea value={f.notes} onChange={e => up('notes', e.target.value)} placeholder="Alguma informação extra" /></label>
    {err && <p className="err" role="alert">{err}</p>}
    <button className="btn">Enviar sugestão</button>
  </form>)
}
