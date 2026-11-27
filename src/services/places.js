export const toggle = (list, x) => (list.includes(x) ? list.filter(i => i !== x) : [...list, x])
export const filterPlaces = (places, active = [], q = '') => {
  const s = q.trim().toLowerCase()
  return places.filter(p => active.every(f => p.features.includes(f)) && (!s || (p.name + ' ' + p.features.join(' ')).toLowerCase().includes(s)))
}
export const nearest = places => places.reduce((a, p) => (!a || p.dist < a.dist ? p : a), null)
export const validateSuggestion = ({ name = '', address = '', features = [] }) => {
  const e = []
  if (name.trim().length < 3) e.push('Informe o nome do lugar (mínimo 3 letras).')
  if (!address.trim()) e.push('Informe o endereço.')
  if (!features.length) e.push('Marque pelo menos um recurso de acessibilidade.')
  return e
}
export const validPhone = t => !t || t.replace(/\D/g, '').length >= 10
