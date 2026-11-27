import { describe, expect, test } from '@jest/globals'
import { PLACES } from '../data/places'
import { USER, dist } from './geo'
import { filterPlaces, nearest, toggle, validPhone, validateSuggestion } from './places'
const list = PLACES.map(p => ({ ...p, dist: dist(USER, p.pos) }))
const ids = l => l.map(p => p.id)
describe('filterPlaces', () => {
  test('sem filtros devolve todos', () => expect(filterPlaces(list)).toHaveLength(6))
  test('um recurso', () => expect(ids(filterPlaces(list, ['Rampa']))).toEqual(['p1', 'p3', 'p5', 'p6']))
  test('vários recursos exigem todos', () => expect(ids(filterPlaces(list, ['Rampa', 'Elevador']))).toEqual(['p1', 'p6']))
  test('busca por nome, sem diferenciar maiúsculas', () => expect(ids(filterPlaces(list, [], 'CAFÉ'))).toEqual(['p2']))
  test('busca também olha os recursos', () => expect(ids(filterPlaces(list, [], 'mesa'))).toEqual(['p2', 'p5']))
  test('filtro + busca', () => expect(ids(filterPlaces(list, ['Rampa'], 'mesa'))).toEqual(['p5']))
  test('sem resultado', () => expect(filterPlaces(list, ['Heliponto'])).toEqual([]))
})
describe('nearest', () => {
  test('o mais perto é o Café (190 m)', () => expect(nearest(list).id).toBe('p2'))
  test('lista vazia', () => expect(nearest([])).toBeNull())
})
describe('toggle', () => {
  test('adiciona e remove', () => { expect(toggle(['a'], 'b')).toEqual(['a', 'b']); expect(toggle(['a', 'b'], 'a')).toEqual(['b']) })
  test('não altera a lista original', () => { const a = ['a']; toggle(a, 'b'); expect(a).toEqual(['a']) })
})
describe('validateSuggestion', () => {
  const ok = { name: 'Padaria Bom Pão', address: 'Rua A, 10', features: ['Rampa'] }
  test('dados completos', () => expect(validateSuggestion(ok)).toEqual([]))
  test('nome curto', () => expect(validateSuggestion({ ...ok, name: 'Pa' })).toEqual(['Informe o nome do lugar (mínimo 3 letras).']))
  test('endereço só com espaços', () => expect(validateSuggestion({ ...ok, address: '  ' })).toEqual(['Informe o endereço.']))
  test('sem recursos', () => expect(validateSuggestion({ ...ok, features: [] })).toEqual(['Marque pelo menos um recurso de acessibilidade.']))
  test('vazio gera os três erros', () => expect(validateSuggestion({})).toHaveLength(3))
})
describe('validPhone', () => {
  test.each(['(27) 99999-0000', '(27) 3333-4444', ''])('aceita "%s"', t => expect(validPhone(t)).toBe(true))
  test.each(['123', '(27) 9999'])('rejeita "%s"', t => expect(validPhone(t)).toBe(false))
})
