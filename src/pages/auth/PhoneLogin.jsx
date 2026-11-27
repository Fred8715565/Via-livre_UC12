import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Smartphone, MessageSquareText, LoaderCircle } from 'lucide-react'
import AuthShell from './AuthShell'
import { useAuth } from '../../auth/AuthContext'
import { maskPhone, safeAuthError } from '../../services/authRules'

// Duas etapas: 1) informar o celular e receber o SMS; 2) digitar o código de 6 dígitos.
export default function PhoneLogin() {
  const { user, requestPhoneCode, verifyPhoneCode, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState('phone')
  const [phoneInput, setPhoneInput] = useState('')
  const [phone, setPhone] = useState('') // número já no formato internacional (+5527...)
  const [code, setCode] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [seconds, setSeconds] = useState(0)
  const destination = location.state?.from || '/'

  useEffect(() => { if (user) navigate(destination, { replace: true }) }, [user, navigate, destination])

  useEffect(() => {
    if (seconds <= 0) return undefined
    const timer = window.setTimeout(() => setSeconds(value => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])

  const friendly = err => err.message?.startsWith('Informe ') || err.message?.startsWith('Digite ') || err.message?.startsWith('Número ')
    ? err.message : safeAuthError(err, 'phone')

  async function sendCode(event) {
    event?.preventDefault(); setError(''); setNotice(''); setBusy(true)
    try {
      const normalized = await requestPhoneCode(phoneInput || phone)
      setPhone(normalized); setStep('code'); setCode(''); setSeconds(60)
      setNotice('Enviamos um SMS com o código de 6 dígitos.')
    } catch (err) { setError(friendly(err)) }
    finally { setBusy(false) }
  }

  async function verify(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true)
    try { await verifyPhoneCode(phone, code, rememberMe); navigate(destination, { replace: true }) }
    catch (err) { setError(friendly(err)) }
    finally { setBusy(false) }
  }

  if (step === 'code') {
    return <AuthShell title="Digite o código" subtitle="Informe os 6 números enviados por SMS.">
      <form className="auth-form" onSubmit={verify}>
        <div className="auth-email-note"><MessageSquareText size={19} /><span>Código enviado para <b>{maskPhone(phone)}</b></span></div>
        <label className="auth-label" htmlFor="phone-code">Código do SMS</label>
        <input className="auth-code-input" id="phone-code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus />
        <label className="auth-check"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /><span>Lembrar de mim</span></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-success" role="status">{notice}</p>}
        <button className="auth-submit" type="submit" disabled={busy || !isConfigured || code.length !== 6}>{busy ? <><LoaderCircle className="spin" size={18} /> Verificando...</> : 'Entrar'}</button>
        <button className="auth-resend" type="button" onClick={sendCode} disabled={busy || seconds > 0}>{seconds > 0 ? `Reenviar código em ${seconds}s` : 'Reenviar código'}</button>
        <button className="auth-back" type="button" onClick={() => { setStep('phone'); setError(''); setNotice('') }}>Usar outro número</button>
      </form>
    </AuthShell>
  }

  return <AuthShell title="Entrar com celular" subtitle="Enviaremos um código por SMS. Se for seu primeiro acesso, criamos sua conta."
    footer={<>Prefere outro jeito? <Link to="/login">Voltar ao login</Link></>}>
    <form className="auth-form" onSubmit={sendCode}>
      <label className="auth-label" htmlFor="phone-number">Celular com DDD</label>
      <div className="auth-input-wrap"><Smartphone size={18} /><input id="phone-number" type="tel" inputMode="tel" autoComplete="tel" placeholder="(27) 99999-0000" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} required autoFocus /></div>
      <p className="auth-hint">Para números de outros países, comece com + e o código do país (ex.: +1 333 444 5555).</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={busy || !isConfigured || !phoneInput.trim()}>{busy ? <><LoaderCircle className="spin" size={18} /> Enviando...</> : 'Enviar código por SMS'}</button>
    </form>
  </AuthShell>
}
