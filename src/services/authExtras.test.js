import { afterEach, describe, expect, jest, test } from '@jest/globals'
import {
  isAdminUser, needsMfaChallenge, safeAuthError, validateTotpCode
} from './authRules.js'
import {
  cancelTotpEnrollment, disableTotp, enrollTotp, getAssuranceLevel, listTotpFactors,
  verifyTotp
} from './authService.js'

const makeClient = auth => ({ auth })

afterEach(() => { delete globalThis.window })

describe('autenticador (TOTP)', () => {
  test('valida código de 6 dígitos', () => {
    expect(validateTotpCode('123456')).toBe(true)
    expect(validateTotpCode('12345')).toBe(false)
    expect(validateTotpCode('12345a')).toBe(false)
    expect(validateTotpCode(undefined)).toBe(false)
  })

  test('só pede o código quando a conta tem autenticador e a sessão ainda é aal1', () => {
    expect(needsMfaChallenge({ currentLevel: 'aal1', nextLevel: 'aal2' })).toBe(true)
    expect(needsMfaChallenge({ currentLevel: 'aal2', nextLevel: 'aal2' })).toBe(false)
    expect(needsMfaChallenge({ currentLevel: 'aal1', nextLevel: 'aal1' })).toBe(false)
    expect(needsMfaChallenge(null)).toBe(false)
  })

  test('getAssuranceLevel devolve nível atual e próximo', async () => {
    const getAuthenticatorAssuranceLevel = jest.fn().mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2', extra: 1 }, error: null })
    const aal = await getAssuranceLevel(makeClient({ mfa: { getAuthenticatorAssuranceLevel } }))
    expect(aal).toEqual({ currentLevel: 'aal1', nextLevel: 'aal2' })
  })

  test('listTotpFactors separa fatores confirmados dos pendentes', async () => {
    const listFactors = jest.fn().mockResolvedValue({ data: {
      totp: [{ id: 'a', status: 'verified' }],
      all: [{ id: 'a', factor_type: 'totp', status: 'verified' }, { id: 'b', factor_type: 'totp', status: 'unverified' }]
    }, error: null })
    const { verified, pending } = await listTotpFactors(makeClient({ mfa: { listFactors } }))
    expect(verified).toHaveLength(1)
    expect(pending.map(f => f.id)).toEqual(['b'])
  })

  test('enrollTotp limpa tentativas pendentes e devolve QR Code e chave', async () => {
    const unenroll = jest.fn().mockResolvedValue({ error: null })
    const enroll = jest.fn().mockResolvedValue({ data: { id: 'f1', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'ABC', uri: 'otpauth://totp/x' } }, error: null })
    const listFactors = jest.fn().mockResolvedValue({ data: { totp: [], all: [{ id: 'old', factor_type: 'totp', status: 'unverified' }] }, error: null })
    const result = await enrollTotp(makeClient({ mfa: { listFactors, unenroll, enroll } }))
    expect(unenroll).toHaveBeenCalledWith({ factorId: 'old' })
    expect(enroll.mock.calls[0][0].factorType).toBe('totp')
    expect(enroll.mock.calls[0][0].issuer).toBe('Via Livre')
    expect(result).toEqual({ factorId: 'f1', qrCode: 'data:image/svg+xml;utf-8,<svg/>', secret: 'ABC', uri: 'otpauth://totp/x' })
  })

  test('verifyTotp confirma o código no Supabase', async () => {
    const challengeAndVerify = jest.fn().mockResolvedValue({ data: { access_token: 'aal2' }, error: null })
    const data = await verifyTotp(makeClient({ mfa: { challengeAndVerify } }), 'f1', '123456')
    expect(data.access_token).toBe('aal2')
    expect(challengeAndVerify).toHaveBeenCalledWith({ factorId: 'f1', code: '123456' })
  })

  test('verifyTotp recusa código malformado sem chamar o Supabase', async () => {
    const challengeAndVerify = jest.fn()
    await expect(verifyTotp(makeClient({ mfa: { challengeAndVerify } }), 'f1', '12')).rejects.toThrow('6 dígitos')
    expect(challengeAndVerify).not.toHaveBeenCalled()
  })

  test('código do autenticador errado mostra mensagem segura', () => {
    expect(safeAuthError({ message: 'Invalid TOTP code entered', code: 'mfa_verification_failed' }, 'mfa')).toMatch('autenticador incorreto')
    expect(safeAuthError({ message: 'Invalid TOTP code entered' })).toMatch('autenticador incorreto')
  })

  test('cancelTotpEnrollment remove o fator pendente', async () => {
    const unenroll = jest.fn().mockResolvedValue({ error: null })
    await cancelTotpEnrollment(makeClient({ mfa: { unenroll } }), 'f1')
    expect(unenroll).toHaveBeenCalledWith({ factorId: 'f1' })
  })

  test('disableTotp remove o fator e renova a sessão para voltar a aal1', async () => {
    const unenroll = jest.fn().mockResolvedValue({ error: null })
    const refreshSession = jest.fn().mockResolvedValue({})
    await disableTotp(makeClient({ mfa: { unenroll }, refreshSession }), 'f1')
    expect(unenroll).toHaveBeenCalledWith({ factorId: 'f1' })
    expect(refreshSession).toHaveBeenCalled()
  })
})

describe('painel de gestão (interface)', () => {
  test('só reconhece administrador pelo app_metadata (que o usuário não edita)', () => {
    expect(isAdminUser({ app_metadata: { role: 'admin' } })).toBe(true)
    expect(isAdminUser({ app_metadata: { role: 'user' } })).toBe(false)
    expect(isAdminUser({ user_metadata: { role: 'admin' } })).toBe(false)
    expect(isAdminUser(null)).toBe(false)
  })
})

