import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff, LoaderCircle, Smartphone } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { safeAuthError } from '../services/authRules'

// Seção "Verificação em duas etapas" do Perfil: lista, adiciona e remove autenticadores (TOTP).
// Todos os botões são type="button" porque este componente fica dentro do formulário do Perfil.
export default function MfaSettings() {
  const { mfa, refreshAal } = useAuth()
  const [factors, setFactors] = useState(null)
  const [setup, setSetup] = useState(null) // { factorId, qrCode, secret } enquanto o usuário escaneia o QR
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try { setFactors((await mfa.list()).verified) }
    catch { setFactors([]); setError('Não foi possível carregar seus autenticadores.') }
  }, [mfa])
  useEffect(() => { load() }, [load])

  const start = async () => {
    setBusy(true); setError(''); setNotice(''); setCode('')
    try { setSetup(await mfa.enroll()) }
    catch (err) { setError(safeAuthError(err, 'mfa')) }
    finally { setBusy(false) }
  }

  const confirm = async () => {
    setBusy(true); setError('')
    try {
      await mfa.verify(setup.factorId, code)
      setSetup(null); setCode(''); setNotice('Autenticador ativado! No próximo login pediremos o código do app.')
      await Promise.all([load(), refreshAal()])
    } catch (err) {
      setCode('')
      setError(err.message?.startsWith('Digite ') ? err.message : safeAuthError(err, 'mfa'))
    } finally { setBusy(false) }
  }

  const cancel = async () => {
    const id = setup?.factorId
    setSetup(null); setCode(''); setError('')
    try { if (id) await mfa.cancel(id) } catch { /* fator pendente é limpo na próxima ativação */ }
  }

  const remove = async factorId => {
    setBusy(true); setError(''); setNotice('')
    try {
      await mfa.disable(factorId)
      setRemoving(''); setNotice('Autenticador removido.')
      await Promise.all([load(), refreshAal()])
    } catch (err) { setError(safeAuthError(err, 'mfa')) }
    finally { setBusy(false) }
  }

  const active = (factors?.length ?? 0) > 0

  return <div className="mfa-box">
    <div className="mfa-head">
      {active ? <ShieldCheck size={20} className="mfa-on" /> : <ShieldOff size={20} />}
      <div><b>Verificação em duas etapas</b>
        <small>{factors === null ? 'Carregando…' : active ? 'Ativa: pedimos um código do app autenticador ao entrar.' : 'Inativa: proteja sua conta com um app autenticador.'}</small></div>
    </div>

    {active && factors.map(f => <div className="mfa-factor" key={f.id}>
      <span><Smartphone size={15} aria-hidden="true" /> {f.friendly_name || 'Autenticador'}</span>
      {removing === f.id
        ? <span className="mfa-confirm">Remover?
            <button type="button" className="mfa-link danger" onClick={() => remove(f.id)} disabled={busy}>Sim</button>
            <button type="button" className="mfa-link" onClick={() => setRemoving('')} disabled={busy}>Não</button></span>
        : <button type="button" className="mfa-link danger" onClick={() => setRemoving(f.id)} disabled={busy}>Remover</button>}
    </div>)}

    {setup && <div className="mfa-setup">
      <ol>
        <li>Abra o Google Authenticator, Microsoft Authenticator, Authy ou similar.</li>
        <li>Escaneie o QR Code abaixo.</li>
        <li>Digite o código de 6 dígitos que o app mostrar.</li>
      </ol>
      <img className="mfa-qr" src={setup.qrCode} alt="QR Code para configurar o autenticador" width="168" height="168" />
      <details><summary>Não consigo escanear</summary>
        <p>Digite esta chave no app (tipo “baseado em tempo”):</p><code className="mfa-secret">{setup.secret}</code></details>
      <input className="auth-code-input mfa-code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} aria-label="Código de 6 dígitos do autenticador" value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (code.length === 6) confirm() } }} />
      <div className="mfa-actions">
        <button type="button" className="auth-submit" onClick={confirm} disabled={busy || code.length !== 6}>{busy ? <><LoaderCircle className="spin" size={16} /> Verificando…</> : 'Ativar'}</button>
        <button type="button" className="mfa-link" onClick={cancel} disabled={busy}>Cancelar</button>
      </div>
    </div>}

    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}
    {!setup && factors !== null && <button type="button" className="mfa-add" onClick={start} disabled={busy}>
      {busy ? 'Preparando…' : active ? 'Adicionar outro autenticador (backup)' : 'Ativar autenticador'}</button>}
  </div>
}
