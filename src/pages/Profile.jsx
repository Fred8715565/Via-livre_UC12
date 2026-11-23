import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MOBILITY } from '../data/places'
import PageHead from '../components/PageHead'
import SuggestModal from '../components/SuggestModal'
const Switch = ({ on, set, label }) => <button type="button" role="switch" aria-checked={on} aria-label={label} className={'sw' + (on ? ' on' : '')} onClick={() => set(!on)}><span /></button>
export default function Profile() {
  const { profile, setProfile, notify } = useApp(); const [d, setD] = useState(profile); const [err, setErr] = useState(''); const [open, setOpen] = useState(false)
  const up = (k, v) => setD(x => ({ ...x, [k]: v }))
  const tog = m => up('mobility', d.mobility.includes(m) ? d.mobility.filter(x => x !== m) : [...d.mobility, m])
  const save = e => { e.preventDefault()
    if (!d.name.trim()) return setErr('Informe seu nome.')
    if (d.ecPhone && d.ecPhone.replace(/\D/g, '').length < 10) return setErr('Telefone inválido. Use DDD + número, por exemplo (27) 99999-0000.')
    setErr(''); setProfile(d); notify('Configurações salvas.') }
  return (<form className="page" onSubmit={save} noValidate>
    <PageHead title="Perfil e ajustes" sub="Isso ajuda o drone a escolher a melhor rota para você."><button type="button" className="btn gray" onClick={() => setOpen(true)}>Sugerir um lugar</button></PageHead>
    <fieldset className="plain"><legend>Seu perfil de mobilidade</legend><div className="chips">{MOBILITY.map(m => (
      <button type="button" key={m} className={'chip' + (d.mobility.includes(m) ? ' on' : '')} aria-pressed={d.mobility.includes(m)} onClick={() => tog(m)}>{m}</button>))}</div></fieldset>
    <div className="box"><h2>Preferências do drone-guia</h2>
      {[['sound', 'Som do drone', 'Bipe ao decolar, virar e chegar'], ['vibration', 'Vibração', 'Aviso tátil por etapa'], ['slow', 'Velocidade reduzida', 'Recomendado para andador ou bengala']].map(([k, t, s]) => (
        <div className="pref" key={k}><div><strong>{t}</strong><small>{s}</small></div><Switch on={d[k]} set={v => up(k, v)} label={t} /></div>))}</div>
    <div className="box"><h2>Seus dados e leitura</h2>
      <label>Seu nome<input value={d.name} onChange={e => up('name', e.target.value)} /></label>
      <label>Tamanho do texto<select value={d.textSize} onChange={e => up('textSize', +e.target.value)}><option value={100}>Padrão</option><option value={115}>Grande</option><option value={130}>Muito grande</option></select></label></div>
    <div className="box"><h2>Contato de emergência</h2>
      <label>Nome<input value={d.ecName} onChange={e => up('ecName', e.target.value)} /></label>
      <label>Telefone<input type="tel" inputMode="tel" value={d.ecPhone} onChange={e => up('ecPhone', e.target.value)} placeholder="(27) 99999-0000" /></label></div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="row end"><button className="btn teal">Salvar configurações</button></div>
    {open && <SuggestModal onClose={() => setOpen(false)} />}
  </form>)
}
