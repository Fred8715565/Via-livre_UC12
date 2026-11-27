import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, LoaderCircle, MapPin, RefreshCw, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { useAdminCall } from './useAdminCall'

const FILTERS = [['pending', 'Aguardando'], ['approved', 'Aprovadas'], ['rejected', 'Recusadas'], ['all', 'Todas']]
const STATUS_LABEL = { pending: 'Aguardando', approved: 'Aprovada', rejected: 'Recusada' }
const STATUS_TAG = { pending: 'amber', approved: '', rejected: 'red' }
const EMPTY = { suggestions: [], counts: { all: 0, pending: 0, approved: 0, rejected: 0 } }
const fmt = iso => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

// Lugares que as pessoas sugeriram na tela "Sugerir lugar". A gestão aprova, recusa ou exclui.
export default function AdminSuggestions() {
  const { panelToken, onLock } = useOutletContext()
  const call = useAdminCall(panelToken, onLock)
  const [status, setStatus] = useState('pending')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(q), 350)
    return () => clearTimeout(timer)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ status, ...(search ? { q: search } : {}) })
      setData(await call('/admin/suggestions?' + params))
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [call, status, search])
  useEffect(() => { load() }, [load])

  async function act(item, request, success) {
    setWorkingId(item.id); setError(''); setNotice('')
    try { await request(); setNotice(success); await load() }
    catch (err) { setError(err.message) }
    finally { setWorkingId('') }
  }
  const setItemStatus = (item, next, success) => act(item,
    () => call(`/admin/suggestions/${item.id}/status`, { method: 'POST', body: JSON.stringify({ status: next }) }), success)
  const remove = item => {
    if (window.confirm(`Excluir a sugestão "${item.name}"? Essa ação não pode ser desfeita.`)) {
      act(item, () => call(`/admin/suggestions/${item.id}`, { method: 'DELETE' }), 'Sugestão excluída.')
    }
  }

  return <main className="adm-main">
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}

    <section className="adm-box">
      <div className="adm-toolbar">
        <label className="adm-search"><Search size={16} aria-hidden="true" /><input type="search" placeholder="Buscar por nome, endereço, recurso ou autor" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar sugestões" /></label>
        <button className="adm-btn" type="button" onClick={load} disabled={loading}>{loading ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />} Atualizar</button>
      </div>
      <div className="adm-chips" role="group" aria-label="Filtrar por status">
        {FILTERS.map(([value, label]) => <button key={value} type="button" className={status === value ? 'on' : ''} aria-pressed={status === value} onClick={() => setStatus(value)}>{label} <b>{data.counts[value]}</b></button>)}
      </div>

      {data.suggestions.length === 0
        ? <p className="adm-empty"><MapPin size={22} /> {loading ? 'Carregando…' : 'Nenhuma sugestão nesta lista.'}</p>
        : <ul className="adm-sug-list">{data.suggestions.map(item => <li key={item.id} className={'adm-sug' + (workingId === item.id ? ' busy' : '')}>
          <div className="adm-sug-main">
            <h3>{item.name} <span className={'adm-tag ' + STATUS_TAG[item.status]}>{STATUS_LABEL[item.status]}</span></h3>
            <p>{item.address}</p>
            <div>{item.features.map(f => <span className="adm-tag" key={f}>{f}</span>)}</div>
            {item.notes && <p className="adm-sug-notes">“{item.notes}”</p>}
            <small>Enviada por {item.ownerLabel} em {fmt(item.createdAt)}{item.reviewedAt && <> · {STATUS_LABEL[item.status].toLowerCase()} por {item.reviewedBy} em {fmt(item.reviewedAt)}</>}</small>
          </div>
          <div className="adm-actions">
            {item.status !== 'approved' && <button type="button" title="Aprovar" aria-label={`Aprovar ${item.name}`} onClick={() => setItemStatus(item, 'approved', 'Sugestão aprovada.')} disabled={workingId === item.id}><Check size={16} /></button>}
            {item.status !== 'rejected' && <button type="button" title="Recusar" aria-label={`Recusar ${item.name}`} onClick={() => setItemStatus(item, 'rejected', 'Sugestão recusada.')} disabled={workingId === item.id}><X size={16} /></button>}
            {item.status !== 'pending' && <button type="button" title="Voltar para análise" aria-label={`Voltar ${item.name} para análise`} onClick={() => setItemStatus(item, 'pending', 'Sugestão voltou para análise.')} disabled={workingId === item.id}><RotateCcw size={16} /></button>}
            <button type="button" className="danger" title="Excluir" aria-label={`Excluir ${item.name}`} onClick={() => remove(item)} disabled={workingId === item.id}><Trash2 size={16} /></button>
          </div>
        </li>)}</ul>}
      <p className="adm-muted">As sugestões ficam na memória do servidor: se ele for reiniciado, a lista começa vazia.</p>
    </section>
  </main>
}
