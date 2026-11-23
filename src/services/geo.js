export const USER = [-20.2632, -40.4165] // posição demonstrativa (Cariacica, ES)
export const FEATURES = ['Rampa','Elevador','Banheiro adaptado','Vaga PCD','Entrada nivelada','Mesa acessível','Piso nivelado','Balcão baixo']
export function dist(a, b) { const r = Math.PI / 180, dLa = (b[0]-a[0])*r, dLo = (b[1]-a[1])*r
  const x = Math.sin(dLa/2)**2 + Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLo/2)**2
  return Math.round(2*6371000*Math.asin(Math.sqrt(x))) }
export const fmt = m => m < 1000 ? `${m} m` : `${(m/1000).toFixed(1).replace('.', ',')} km`
export const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export const lerp = (a, b, k) => [a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k]
