import { describe, expect, test } from 'vitest'
import { USER, dist, fmt, esc, lerp, offset } from './geo'
describe('dist', () => {
  test('mesmo ponto = 0', () => expect(dist(USER, USER)).toBe(0))
  test('1 grau de latitude ≈ 111,2 km', () => expect(Math.abs(dist([0, 0], [1, 0]) - 111195)).toBeLessThan(5))
  test('é simétrica', () => { const b = [USER[0] + 0.01, USER[1] - 0.02]; expect(dist(USER, b)).toBe(dist(b, USER)) })
})
describe('fmt', () => {
  test.each([[340, '340 m'], [999, '999 m'], [1000, '1,0 km'], [1500, '1,5 km']])('%i → %s', (m, s) => expect(fmt(m)).toBe(s))
})
describe('esc', () => {
  test('escapa HTML', () => expect(esc('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;'))
  test('aceita número', () => expect(esc(5)).toBe('5'))
})
describe('lerp', () => {
  test('extremos', () => { expect(lerp([0, 0], [10, 20], 0)).toEqual([0, 0]); expect(lerp([0, 0], [10, 20], 1)).toEqual([10, 20]) })
  test('meio', () => expect(lerp([0, 0], [10, 20], 0.5)).toEqual([5, 10]))
})
describe('offset', () => {
  test.each([[0, 0], [190, 150], [340, 60], [700, 330]])('andar %i m no rumo %i° dá a mesma distância', (m, deg) => expect(dist(USER, offset(USER, m, deg))).toBe(m))
})
