// Links para ir até um lugar: Uber (app/web) ou Google Maps (sem custo, a pé, transporte público, etc.).
export const MODES = { walking: 'A pé', transit: 'Transporte público', driving: 'Carro', bicycling: 'Bicicleta' }
const WALK_MPS = 1.1 // ~4 km/h, ritmo calmo (estimativa)
export const walkMinutes = m => Math.max(1, Math.round(m / WALK_MPS / 60))
export const mapsUrl = (p, mode = 'walking') => {
  const u = new URL('https://www.google.com/maps/dir/')
  u.searchParams.set('api', '1'); u.searchParams.set('destination', p.pos.join(',')); u.searchParams.set('travelmode', Object.hasOwn(MODES, mode) ? mode : 'walking')
  return u.toString()
}
export const uberUrl = p => {
  const u = new URL('https://m.uber.com/ul/'); const s = (k, v) => u.searchParams.set(k, v)
  s('action', 'setPickup'); s('pickup', 'my_location'); s('dropoff[latitude]', p.pos[0]); s('dropoff[longitude]', p.pos[1]); s('dropoff[nickname]', p.name)
  if (p.address) s('dropoff[formatted_address]', p.address)
  return u.toString()
}
