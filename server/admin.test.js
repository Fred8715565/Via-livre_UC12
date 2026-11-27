import { describe, expect, test } from '@jest/globals'
import { UUID, computeStats, filterUsers, isBanned, CODE_MAX_AGE_SECONDS, PanelSessions, hasFreshTotp, mapUser, readAal, sortByNewest } from './adminUtils.js'

const NOW = new Date('2026-11-26T12:00:00Z').getTime()
const iso = daysAgo => new Date(NOW - daysAgo * 86_400_000).toISOString()
const raw = (over = {}) => ({ id: '11111111-1111-4111-8111-111111111111', email: 'ana@gmail.com', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { full_name: 'Ana' }, created_at: iso(30), last_sign_in_at: iso(1), email_confirmed_at: iso(30), factors: [], ...over })

describe('mapUser', () => {
  test('expõe só os campos necessários', () => {
    const user = mapUser(raw({ encrypted_password: 'segredo', factors: [{ status: 'verified' }, { status: 'unverified' }] }), NOW)
    expect(user).toEqual({ id: '11111111-1111-4111-8111-111111111111', email: 'ana@gmail.com', phone: null, name: 'Ana', providers: ['email'], role: 'user', mfa: 1, confirmed: true, banned: false, createdAt: iso(30), lastSignInAt: iso(1) })
    expect(JSON.stringify(user)).not.toContain('segredo')
  })

  test('reconhece administrador, celular, provedor Apple e bloqueio', () => {
    const user = mapUser(raw({ email: undefined, phone: '5527999990000', app_metadata: { provider: 'apple', role: 'admin' }, banned_until: new Date(NOW + 86_400_000).toISOString() }), NOW)
    expect(user.role).toBe('admin')
    expect(user.providers).toEqual(['apple'])
    expect(user.banned).toBe(true)
    expect(user.phone).toBe('5527999990000')
  })

  test('mfa fica null quando a API não informa os fatores', () => {
    expect(mapUser(raw({ factors: undefined }), NOW).mfa).toBeNull()
  })

  test('bloqueio vencido não conta como bloqueado', () => {
    expect(isBanned({ banned_until: iso(1) }, NOW)).toBe(false)
    expect(isBanned({}, NOW)).toBe(false)
  })
})

describe('estatísticas e filtros', () => {
  const users = [
    mapUser(raw(), NOW),
    mapUser(raw({ id: '22222222-2222-4222-8222-222222222222', email: 'bia@icloud.com', app_metadata: { providers: ['apple'], role: 'admin' }, created_at: iso(2), last_sign_in_at: iso(10), factors: [{ status: 'verified' }] }), NOW),
    mapUser(raw({ id: '33333333-3333-4333-8333-333333333333', email: undefined, phone: '5527988887777', app_metadata: { providers: ['phone'] }, created_at: iso(1), last_sign_in_at: null, banned_until: new Date(NOW + 1e9).toISOString() }), NOW)
  ]

  test('conta usuários, novos, ativos, 2FA, bloqueados e métodos', () => {
    const s = computeStats(users, NOW)
    expect(s).toMatchObject({ total: 3, new7d: 2, active7d: 1, withMfa: 1, banned: 1, admins: 1 })
    expect(s.byProvider).toEqual({ email: 1, google: 0, apple: 1, phone: 1, other: 0 })
  })

  test('filtra por busca e por tipo', () => {
    expect(filterUsers(users, { q: 'icloud' })).toHaveLength(1)
    expect(filterUsers(users, { q: '98888' })).toHaveLength(1)
    expect(filterUsers(users, { filter: 'admin' })).toHaveLength(1)
    expect(filterUsers(users, { filter: 'banned' })).toHaveLength(1)
    expect(filterUsers(users, { filter: 'nomfa' })).toHaveLength(2)
    expect(filterUsers(users, {})).toHaveLength(3)
  })

  test('ordena do mais novo para o mais antigo', () => {
    expect(sortByNewest(users).map(u => u.email || u.phone)).toEqual(['5527988887777', 'bia@icloud.com', 'ana@gmail.com'])
  })
})

describe('segurança', () => {
  test('lê o nível aal2 do token', () => {
    const token = payload => `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`
    expect(readAal(token({ aal: 'aal2' }))).toBe('aal2')
    expect(readAal(token({ aal: 'aal1' }))).toBe('aal1')
    expect(readAal('lixo')).toBeNull()
    expect(readAal(undefined)).toBeNull()
  })

  test('só aceita IDs no formato UUID', () => {
    expect(UUID.test('11111111-1111-4111-8111-111111111111')).toBe(true)
    expect(UUID.test("1' or '1'='1")).toBe(false)
  })
})

describe('código do autenticador recente (painel)', () => {
  const nowSec = Math.floor(NOW / 1000)
  const token = claims => `h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.s`
  const amr = (method, ago) => ({ method, timestamp: nowSec - ago })

  test('o prazo acompanha o ciclo de 30 segundos do app (com tolerância)', () => {
    expect(CODE_MAX_AGE_SECONDS).toBe(45)
  })

  test('aceita código digitado agora há pouco', () => {
    expect(hasFreshTotp(token({ amr: [amr('totp', 10), amr('password', 300)] }), CODE_MAX_AGE_SECONDS, NOW)).toBe(true)
    expect(hasFreshTotp(token({ amr: [amr('totp', 45)] }), CODE_MAX_AGE_SECONDS, NOW)).toBe(true)
  })

  test('recusa código com mais de um ciclo, mesmo com sessão aal2', () => {
    expect(hasFreshTotp(token({ aal: 'aal2', amr: [amr('totp', 46)] }), CODE_MAX_AGE_SECONDS, NOW)).toBe(false)
    expect(hasFreshTotp(token({ aal: 'aal2', amr: [amr('totp', 3600)] }), CODE_MAX_AGE_SECONDS, NOW)).toBe(false)
  })

  test('recusa sessão sem código de autenticador', () => {
    expect(hasFreshTotp(token({ aal: 'aal1', amr: [amr('password', 5)] }), CODE_MAX_AGE_SECONDS, NOW)).toBe(false)
  })

  test('usa o código mais recente quando há vários', () => {
    expect(hasFreshTotp(token({ amr: [amr('totp', 5000), amr('totp', 20)] }), CODE_MAX_AGE_SECONDS, NOW)).toBe(true)
  })

  test('sem o claim amr não há prova de código recente', () => {
    expect(hasFreshTotp(token({ aal: 'aal2' }), CODE_MAX_AGE_SECONDS, NOW)).toBe(false)
  })

  test('token inválido é recusado', () => {
    expect(hasFreshTotp('lixo', CODE_MAX_AGE_SECONDS, NOW)).toBe(false)
    expect(hasFreshTotp(undefined, CODE_MAX_AGE_SECONDS, NOW)).toBe(false)
  })
})

describe('sessão do painel', () => {
  test('vale só para o admin que digitou o código', () => {
    const sessions = new PanelSessions()
    sessions.create('admin-1', 'tok', NOW)
    expect(sessions.isValid('tok', 'admin-1', NOW + 1000)).toBe(true)
    expect(sessions.isValid('tok', 'admin-2', NOW + 1000)).toBe(false)
    expect(sessions.isValid('outro', 'admin-1', NOW + 1000)).toBe(false)
    expect(sessions.isValid(undefined, 'admin-1', NOW)).toBe(false)
  })

  test('deixa de valer ao sair do painel', () => {
    const sessions = new PanelSessions()
    sessions.create('admin-1', 'tok', NOW)
    sessions.revoke('tok')
    expect(sessions.isValid('tok', 'admin-1', NOW)).toBe(false)
  })

  test('expira pela trava de segurança', () => {
    const sessions = new PanelSessions(1000)
    sessions.create('admin-1', 'tok', NOW)
    expect(sessions.isValid('tok', 'admin-1', NOW + 999)).toBe(true)
    expect(sessions.isValid('tok', 'admin-1', NOW + 1000)).toBe(false)
  })
})
