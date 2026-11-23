import { describe, expect, test } from 'vitest'
import { PLACES, STEPS, etaMin, sheetTitle, stepAt } from './places'
import { FEATURES, USER, dist } from '../services/geo'
describe('PLACES', () => {
  test('distâncias iguais às do design', () => expect(PLACES.map(p => dist(USER, p.pos))).toEqual([340, 190, 280, 510, 620, 700]))
  test('ids únicos', () => expect(new Set(PLACES.map(p => p.id)).size).toBe(PLACES.length))
  test('só usa recursos conhecidos e todo lugar tem texto e imagem', () => PLACES.forEach(p => {
    expect(p.features.length).toBeGreaterThan(0); p.features.forEach(f => expect(FEATURES).toContain(f))
    expect(p.about).toBeTruthy(); expect(p.key).toBeTruthy() }))
})
describe('trajeto do drone', () => {
  test('quatro etapas na ordem do design', () => expect(STEPS.map(s => s.title)).toEqual(['Sinal enviado', 'Drone decolou', 'Guiando o trajeto', 'Chegada']))
  test.each([[0, 0], [2999, 0], [3000, 1], [7000, 2], [14999, 2], [15000, 3], [99999, 3]])('stepAt(%i) = %i', (t, s) => expect(stepAt(t)).toBe(s))
  test.each([[-1, null], [0, 3], [2, 1], [3, 0]])('etaMin(%i) = %s', (s, m) => expect(etaMin(s)).toBe(m))
  test.each([[-1, 'Nenhum sinal ativo'], [0, 'Drone a caminho'], [2, 'Drone a caminho'], [3, 'Chegou ao destino']])('sheetTitle(%i)', (s, t) => expect(sheetTitle(s)).toBe(t))
})
