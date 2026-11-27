// Regras do painel arrastável (bottom sheet): alturas de encaixe, gesto de arrastar e de dispensar.
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const snapPoints = H => { const min = 150, max = Math.max(H - 110, 260), mid = clamp(Math.round(H * 0.52), min + 60, max - 60); return [min, mid, max] }
// h = altura atual; v = velocidade em px/ms (positivo = arrastando para cima)
export const nearestSnap = (h, pts, v = 0) => {
  if (v >= 0.5) return pts.find(p => p > h + 1) ?? pts[pts.length - 1]
  if (v <= -0.5) return [...pts].reverse().find(p => p < h - 1) ?? pts[0]
  return pts.reduce((b, p) => (Math.abs(p - h) < Math.abs(b - h) ? p : b), pts[0])
}
export const cycleSnap = (h, pts) => pts.find(p => p > h + 1) ?? pts[0]
export const stepSnap = (h, pts, dir) => (dir > 0 ? (pts.find(p => p > h + 1) ?? pts[pts.length - 1]) : ([...pts].reverse().find(p => p < h - 1) ?? pts[0]))
export const shouldDismiss = (dy, v = 0) => dy > 120 || (dy > 30 && v > 0.6) // arrastar o painel para baixo fecha
