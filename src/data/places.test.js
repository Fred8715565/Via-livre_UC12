import { describe, expect, test } from '@jest/globals'
import { HISTORY0, PLACES, PROFILE0 } from './places'
import { MODES } from '../services/trip'
import { FEATURES, USER, dist } from '../services/geo'
describe('PLACES', () => {
  test('distâncias iguais às do design', () => expect(PLACES.map(p => dist(USER, p.pos))).toEqual([340, 190, 280, 510, 620, 700]))
  test('ids únicos', () => expect(new Set(PLACES.map(p => p.id)).size).toBe(PLACES.length))
  test('só usa recursos conhecidos e todo lugar tem texto e imagem', () => PLACES.forEach(p => {
    expect(p.features.length).toBeGreaterThan(0); p.features.forEach(f => expect(FEATURES).toContain(f))
    expect(p.about).toBeTruthy(); expect(p.key).toBeTruthy() }))
})
describe('dados iniciais', () => {
  test('histórico aponta para lugares que existem e para Uber ou Maps', () => HISTORY0.forEach(h => { expect(PLACES.some(p => p.id === h.placeId)).toBe(true); expect(['Uber', 'Maps']).toContain(h.via) }))
  test('perfil padrão usa um modo do Maps válido', () => expect(Object.keys(MODES)).toContain(PROFILE0.mapsMode))
})
