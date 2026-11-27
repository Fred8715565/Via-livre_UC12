import { randomUUID } from 'node:crypto'

// Sugestões de lugares enviadas pelos usuários (tela "Sugerir lugar") e revisadas na gestão (/admin/lugares).
// Ficam em memória, como os demais dados deste servidor de demonstração: reiniciar o servidor apaga a lista.
// Em produção, troque este arquivo por uma tabela do banco mantendo as mesmas funções.

export const STATUSES = ['pending', 'approved', 'rejected']
export const LIMITS = { name: 80, address: 160, notes: 300, feature: 40, features: 12 }
export const MAX_PENDING_PER_USER = 20
export const MAX_STORED = 1000

// Nunca confie no navegador: o servidor valida e limpa tudo de novo.
const text = value => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '')

export function cleanSuggestion(input) {
  const body = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const name = text(body.name)
  const address = text(body.address)
  const notes = text(body.notes)
  const features = [...new Set((Array.isArray(body.features) ? body.features : []).map(text).filter(Boolean))]

  if (name.length < 3 || name.length > LIMITS.name) return { error: `Informe o nome do lugar (de 3 a ${LIMITS.name} letras).` }
  if (!address || address.length > LIMITS.address) return { error: `Informe o endereço (até ${LIMITS.address} letras).` }
  if (notes.length > LIMITS.notes) return { error: `As observações podem ter até ${LIMITS.notes} letras.` }
  if (!features.length) return { error: 'Marque pelo menos um recurso de acessibilidade.' }
  if (features.length > LIMITS.features || features.some(item => item.length > LIMITS.feature)) {
    return { error: 'Lista de recursos de acessibilidade inválida.' }
  }
  return { value: { name, address, notes, features } }
}

export class SuggestionStore {
  constructor(max = MAX_STORED) {
    this.items = []
    this.max = max
  }

  add(value, owner, now = Date.now()) {
    const pending = this.items.filter(item => item.ownerId === owner.id && item.status === 'pending').length
    if (pending >= MAX_PENDING_PER_USER) {
      return { error: 'Você já tem muitas sugestões aguardando análise. Espere a revisão antes de enviar outras.' }
    }
    const item = {
      id: randomUUID(), ...value, status: 'pending',
      ownerId: owner.id, ownerLabel: owner.label || owner.id,
      createdAt: new Date(now).toISOString(), reviewedAt: null, reviewedBy: null
    }
    this.items.unshift(item)
    if (this.items.length > this.max) this.items.length = this.max
    return { item }
  }

  list({ status = 'all', q = '' } = {}) {
    const term = String(q || '').trim().toLowerCase()
    return this.items.filter(item => {
      if (status !== 'all' && item.status !== status) return false
      if (!term) return true
      return [item.name, item.address, item.notes, item.ownerLabel, ...item.features].some(v => String(v || '').toLowerCase().includes(term))
    })
  }

  counts() {
    const counts = { all: this.items.length, pending: 0, approved: 0, rejected: 0 }
    for (const item of this.items) counts[item.status] += 1
    return counts
  }

  setStatus(id, status, reviewer, now = Date.now()) {
    if (!STATUSES.includes(status)) return null
    const item = this.items.find(entry => entry.id === id)
    if (!item) return null
    item.status = status
    item.reviewedAt = status === 'pending' ? null : new Date(now).toISOString()
    item.reviewedBy = status === 'pending' ? null : reviewer || null
    return item
  }

  remove(id) {
    const index = this.items.findIndex(entry => entry.id === id)
    if (index < 0) return false
    this.items.splice(index, 1)
    return true
  }
}

export const suggestionStore = new SuggestionStore()
