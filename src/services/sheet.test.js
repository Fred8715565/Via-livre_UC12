import { describe, expect, test } from '@jest/globals'
import { clamp, cycleSnap, nearestSnap, shouldDismiss, snapPoints, stepSnap } from './sheet'
const pts = [150, 442, 740]
describe('snapPoints', () => {
  test('altura de 850 px', () => expect(snapPoints(850)).toEqual(pts))
  test('altura do design (917 px)', () => expect(snapPoints(917)).toEqual([150, 477, 807]))
  test('tela baixa', () => expect(snapPoints(400)).toEqual([150, 210, 290]))
  test('sempre em ordem crescente', () => { for (let H = 480; H <= 1400; H += 20) { const [a, b, c] = snapPoints(H); expect(a).toBeLessThan(b); expect(b).toBeLessThan(c) } })
})
describe('nearestSnap', () => {
  test.each([[160, 150], [290, 150], [300, 442], [550, 442], [700, 740]])('soltar em %i encaixa em %i', (h, r) => expect(nearestSnap(h, pts)).toBe(r))
  test('arremesso para cima vai ao próximo ponto', () => { expect(nearestSnap(442, pts, 0.8)).toBe(740); expect(nearestSnap(300, pts, 0.6)).toBe(442) })
  test('arremesso para baixo vai ao ponto anterior', () => { expect(nearestSnap(442, pts, -0.8)).toBe(150); expect(nearestSnap(500, pts, -0.6)).toBe(442) })
  test('arremesso nos extremos não passa do limite', () => { expect(nearestSnap(740, pts, 2)).toBe(740); expect(nearestSnap(150, pts, -2)).toBe(150) })
  test('velocidade baixa usa o ponto mais próximo', () => expect(nearestSnap(300, pts, 0.2)).toBe(442))
})
describe('cycleSnap e stepSnap', () => {
  test('toque no puxador percorre os pontos e volta ao início', () => { expect(cycleSnap(150, pts)).toBe(442); expect(cycleSnap(442, pts)).toBe(740); expect(cycleSnap(740, pts)).toBe(150) })
  test('setas', () => { expect(stepSnap(150, pts, 1)).toBe(442); expect(stepSnap(740, pts, 1)).toBe(740); expect(stepSnap(442, pts, -1)).toBe(150); expect(stepSnap(150, pts, -1)).toBe(150) })
})
describe('shouldDismiss', () => {
  test.each([[130, 0, true], [20, 3, false], [50, 0.9, true], [50, 0.2, false], [0, 0, false]])('dy=%i v=%f → %s', (dy, v, r) => expect(shouldDismiss(dy, v)).toBe(r))
})
test('clamp', () => { expect(clamp(5, 0, 10)).toBe(5); expect(clamp(-1, 0, 10)).toBe(0); expect(clamp(11, 0, 10)).toBe(10) })
