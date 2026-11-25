import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { MOBILITY } from '../data/places'
import { MODES } from '../services/trip'
import { toggle, validPhone } from '../services/places'
import { useAuth } from '../auth/AuthContext'
const Switch = ({ on, set, label }) => <button type="button" role="switch" aria-checked={on} aria-label={label} className={'tg' + (on ? ' on' : '')} onClick={() => set(!on)} />
export default function Profile() {
  const { profile, setProfile, notify } = useApp(); const { user, signOut } = useAuth(); const [d, setD] = useState(profile); const [err, setErr] = useState('')
  const up = (k, v) => setD(x => ({ ...x, [k]: v }))
  const handleSignOut = async () => {
    try { await signOut() }
    catch { setErr('Não foi possível encerrar a sessão. Verifique sua conexão e tente novamente.') }
  }
  const save = e => { e.preventDefault()
    if (!d.name.trim()) return setErr('Informe seu nome.')
    if (!validPhone(d.ecPhone)) return setErr('Telefone inválido. Use DDD + número, por exemplo (27) 99999-0000.')
    setErr(''); setProfile(d); notify('Configurações salvas.') }
  return (<form className="page t-perfil" onSubmit={save} noValidate>
    <header className="topo p"><h1>Perfil e ajustes</h1><img className="senac" src="/img/senac-p.png" alt="Senac" width="33" height="21" /></header>
    <fieldset className="box p1"><legend>Seu perfil de mobilidade</legend><div className="pills">{MOBILITY.map(m => (
      <button type="button" key={m} className={'pill' + (d.mobility.includes(m) ? ' on' : '')} aria-pressed={d.mobility.includes(m)} onClick={() => up('mobility', toggle(d.mobility, m))}>{m}</button>))}</div></fieldset>
    <section className="box b2"><h2>Preferências de viagem</h2>
      {[['confirm', 'Confirmar antes de abrir', 'Avisa antes de sair para o Uber ou o Maps'], ['wav', 'Lembrar do carro acessível', 'Dica para escolher a opção acessível no Uber']].map(([k, t, s]) => (
        <div className="lin" key={k}><span><b>{t}</b><small>{s}</small></span><Switch on={d[k]} set={v => up(k, v)} label={t} /></div>))}
      <div className="lin"><span><b>Como ir pelo Maps</b><small>Modo usado ao abrir o Maps</small></span>
        <select aria-label="Como ir pelo Maps" value={d.mapsMode} onChange={e => up('mapsMode', e.target.value)}>{Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div></section>
    <section className="box b3"><h2>Contato de emergência</h2>
      <label>Nome<input value={d.ecName} onChange={e => up('ecName', e.target.value)} autoComplete="name" /></label>
      <label>Telefone<input type="tel" inputMode="tel" value={d.ecPhone} onChange={e => up('ecPhone', e.target.value)} placeholder="(27) 99999-0000" autoComplete="tel" /></label></section>
    <section className="box"><h2>Conta</h2>
      <div className="auth-account-row"><div><b>{user?.user_metadata?.full_name || profile.name || 'Usuário'}</b><small>{user?.email}</small></div><button type="button" className="auth-logout" onClick={handleSignOut}>Sair da conta</button></div>
      <Link className="lk" to="/historico"><span>Ver histórico completo</span><ChevronRight size={16} aria-hidden="true" /></Link>
      <label>Seu nome<input value={d.name} onChange={e => up('name', e.target.value)} /></label>
      <label>Tamanho do texto<select value={d.textSize} onChange={e => up('textSize', +e.target.value)}><option value={100}>Padrão</option><option value={115}>Grande</option><option value={130}>Muito grande</option></select></label></section>
    {err && <p className="err" role="alert">{err}</p>}
    <button className="btn save">Salvar configurações</button>
  </form>)
}
