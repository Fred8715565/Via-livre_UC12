import { describe, expect, test } from '@jest/globals'
import { LIMITS, MAX_PENDING_PER_USER, SuggestionStore, cleanSuggestion } from './suggestions.js'

const NOW = new Date('2026-11-27T12:00:00Z').getTime()
const valid = (over = {}) => ({ name: 'Padaria Bom Pão', address: 'Rua das Flores, 10', notes: '', features: ['Rampa'], ...over })
const ana = { id: 'user-ana', label: 'ana@gmail.com' }

describe('cleanSuggestion', () => {
  test('limpa espaços e remove recursos repetidos', () => {
    const { value } = cleanSuggestion(valid({ name: '  Padaria   Bom Pão ', features: ['Rampa', ' Rampa ', 'Elevador'] }))
    expect(value).toEqual({ name: 'Padaria Bom Pão', address: 'Rua das Flores, 10', notes: '', features: ['Rampa', 'Elevador'] })
  })

  test.each([
    ['nome curto', { name: 'ab' }],
    ['nome longo demais', { name: 'a'.repeat(LIMITS.name + 1) }],
    ['sem endereço', { address: '   ' }],
    ['endereço longo demais', { address: 'x'.repeat(LIMITS.address + 1) }],
    ['observações longas demais', { notes: 'x'.repeat(LIMITS.notes + 1) }],
    ['sem recursos', { features: [] }],
    ['recursos que não são lista', { features: 'Rampa' }],
    ['recurso longo demais', { features: ['x'.repeat(LIMITS.feature + 1)] }],
    ['recursos demais', { features: Array.from({ length: LIMITS.features + 1 }, (_, i) => `Recurso ${i}`) }]
  ])('recusa %s', (_, over) => {
    expect(cleanSuggestion(valid(over)).error).toEqual(expect.any(String))
  })

  test.each([undefined, null, 'texto', 42, [], [valid()]])('recusa corpo inválido: %p', body => {
    expect(cleanSuggestion(body).error).toEqual(expect.any(String))
  })

  test('ignora campos extras enviados pelo navegador (ex.: status, ownerId)', () => {
    const { value } = cleanSuggestion(valid({ status: 'approved', ownerId: 'outro' }))
    expect(Object.keys(value).sort()).toEqual(['address', 'features', 'name', 'notes'])
  })
})

describe('SuggestionStore', () => {
  const store = () => new SuggestionStore()

  test('nova sugestão nasce aguardando análise, com dono e data', () => {
    const { item } = store().add(valid(), ana, NOW)
    expect(item).toMatchObject({ status: 'pending', ownerId: 'user-ana', ownerLabel: 'ana@gmail.com', createdAt: '2026-11-27T12:00:00.000Z', reviewedAt: null })
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  test('limita as sugestões aguardando por usuário', () => {
    const s = store()
    for (let i = 0; i < MAX_PENDING_PER_USER; i++) expect(s.add(valid(), ana).item).toBeTruthy()
    expect(s.add(valid(), ana).error).toEqual(expect.any(String))
    expect(s.add(valid(), { id: 'user-bia' }).item).toBeTruthy() // outro usuário não é afetado
  })

  test('aprovar libera uma vaga; mudar o status registra quem revisou', () => {
    const s = store()
    for (let i = 0; i < MAX_PENDING_PER_USER; i++) s.add(valid(), ana)
    const first = s.list()[0]
    s.setStatus(first.id, 'approved', 'admin@gmail.com', NOW)
    expect(s.list({ status: 'approved' })[0]).toMatchObject({ reviewedBy: 'admin@gmail.com', reviewedAt: '2026-11-27T12:00:00.000Z' })
    expect(s.add(valid(), ana).item).toBeTruthy()
  })

  test('voltar para "aguardando" limpa a revisão', () => {
    const s = store(); const { item } = s.add(valid(), ana)
    s.setStatus(item.id, 'rejected', 'admin@gmail.com')
    s.setStatus(item.id, 'pending', 'admin@gmail.com')
    expect(s.list()[0]).toMatchObject({ status: 'pending', reviewedAt: null, reviewedBy: null })
  })

  test('recusa status inválido e id inexistente', () => {
    const s = store(); const { item } = s.add(valid(), ana)
    expect(s.setStatus(item.id, 'qualquer', 'x')).toBeNull()
    expect(s.setStatus('nao-existe', 'approved', 'x')).toBeNull()
    expect(s.list()[0].status).toBe('pending')
  })

  test('lista filtra por status e busca em nome, endereço, recursos e autor; mais novas primeiro', () => {
    const s = store()
    s.add(valid({ name: 'Café Azul', features: ['Elevador'] }), ana, NOW)
    s.add(valid({ name: 'Mercado Sol', address: 'Av. Brasil, 5' }), { id: 'b', label: 'bia@gmail.com' }, NOW + 1000)
    s.setStatus(s.list()[0].id, 'approved', 'adm')
    expect(s.list().map(i => i.name)).toEqual(['Mercado Sol', 'Café Azul'])
    expect(s.list({ status: 'approved' }).map(i => i.name)).toEqual(['Mercado Sol'])
    expect(s.list({ q: 'elevador' }).map(i => i.name)).toEqual(['Café Azul'])
    expect(s.list({ q: 'brasil' }).map(i => i.name)).toEqual(['Mercado Sol'])
    expect(s.list({ q: 'bia@' }).map(i => i.name)).toEqual(['Mercado Sol'])
  })

  test('contagem por status e exclusão', () => {
    const s = store()
    const a = s.add(valid(), ana).item; s.add(valid(), ana); s.add(valid(), ana)
    s.setStatus(a.id, 'rejected', 'adm')
    expect(s.counts()).toEqual({ all: 3, pending: 2, approved: 0, rejected: 1 })
    expect(s.remove(a.id)).toBe(true)
    expect(s.remove(a.id)).toBe(false)
    expect(s.counts().all).toBe(2)
  })

  test('guarda no máximo N itens, descartando os mais antigos', () => {
    const s = new SuggestionStore(3)
    for (let i = 0; i < 5; i++) s.add(valid({ name: `Lugar ${i}` }), { id: `u${i}` }, NOW + i)
    expect(s.list().map(i => i.name)).toEqual(['Lugar 4', 'Lugar 3', 'Lugar 2'])
  })
})
