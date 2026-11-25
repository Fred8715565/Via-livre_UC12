import { describe, expect, test } from '@jest/globals'
import { MODES, mapsUrl, uberUrl, walkMinutes } from './trip'
const p = { name: 'Café da Esquina', address: 'Rua das Flores, 45', pos: [-20.26, -40.41] }
const q = (url, k) => new URL(url).searchParams.get(k)
describe('mapsUrl', () => {
  test('abre as rotas do Google Maps até o destino', () => { const u = new URL(mapsUrl(p)); expect(u.origin + u.pathname).toBe('https://www.google.com/maps/dir/'); expect(q(mapsUrl(p), 'api')).toBe('1'); expect(q(mapsUrl(p), 'destination')).toBe('-20.26,-40.41') })
  test('modo padrão é a pé', () => expect(q(mapsUrl(p), 'travelmode')).toBe('walking'))
  test.each(Object.keys(MODES))('aceita o modo %s', m => expect(q(mapsUrl(p, m), 'travelmode')).toBe(m))
  test.each(['voando', 'toString', ''])('modo inválido "%s" volta para a pé', m => expect(q(mapsUrl(p, m), 'travelmode')).toBe('walking'))
})
describe('uberUrl', () => {
  test('link do Uber com o destino preenchido', () => {
    const u = uberUrl(p); expect(new URL(u).origin + new URL(u).pathname).toBe('https://m.uber.com/ul/')
    expect(q(u, 'action')).toBe('setPickup'); expect(q(u, 'pickup')).toBe('my_location')
    expect(q(u, 'dropoff[latitude]')).toBe('-20.26'); expect(q(u, 'dropoff[longitude]')).toBe('-40.41'); expect(q(u, 'dropoff[nickname]')).toBe('Café da Esquina') })
  test('endereço com vírgula e acento', () => expect(q(uberUrl(p), 'dropoff[formatted_address]')).toBe('Rua das Flores, 45'))
  test('sem endereço não quebra', () => expect(q(uberUrl({ ...p, address: undefined }), 'dropoff[formatted_address]')).toBeNull())
})
describe('walkMinutes', () => {
  test.each([[0, 1], [190, 3], [340, 5], [700, 11]])('%i m → %i min', (m, min) => expect(walkMinutes(m)).toBe(min))
})
