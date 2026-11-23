export default function Stars({ value, onChange }) {
  if (!onChange) return <span className="stars" role="img" aria-label={value ? `Avaliação: ${value} de 5` : 'Sem avaliação'}>{value ? '★'.repeat(value) : <small>Sem avaliação</small>}</span>
  return (<div className="stars big" role="group" aria-label="Sua avaliação">{[1, 2, 3, 4, 5].map(n => (
    <button key={n} type="button" aria-pressed={value === n} aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`} onClick={() => onChange(n)}>{n <= value ? '★' : '☆'}</button>))}</div>)
}
