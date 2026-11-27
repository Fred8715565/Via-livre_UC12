import { afterEach, describe, expect, jest, test } from '@jest/globals'
import {
  canAccessProtectedRoute,
  passwordsMatch,
  safeAuthError,
  validateEmail,
  validatePassword
} from './authRules.js'
import {
  requestPasswordCode,
  signUpWithEmail,
  updatePassword,
  verifyPasswordCode
} from './authService.js'

const makeClient = auth => ({ auth })

afterEach(() => {
  delete globalThis.window
  jest.restoreAllMocks()
})

describe('validações de autenticação', () => {
  test('aceita e rejeita formatos de e-mail', () => {
    expect(validateEmail('aluno@gmail.com')).toBe(true)
    expect(validateEmail('email-invalido')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })

  test('exige senha com 8 caracteres, maiúscula, minúscula e número', () => {
    expect(validatePassword('Senha123')).toBe(true)
    expect(validatePassword('senha123')).toBe(false)
    expect(validatePassword('SENHA123')).toBe(false)
    expect(validatePassword('Senha')).toBe(false)
  })

  test('confirmação só é válida quando as senhas coincidem', () => {
    expect(passwordsMatch('Senha123', 'Senha123')).toBe(true)
    expect(passwordsMatch('Senha123', 'Senha321')).toBe(false)
    expect(passwordsMatch('', '')).toBe(false)
  })

  test('bloqueia rotas protegidas quando não existe usuário ou a sessão está carregando', () => {
    expect(canAccessProtectedRoute(null)).toBe(false)
    expect(canAccessProtectedRoute({ id: 'u1' })).toBe(true)
    expect(canAccessProtectedRoute({ id: 'u1' }, true)).toBe(false)
  })
})

describe('cadastro', () => {
  test('envia cadastro válido ao serviço de autenticação', async () => {
    const signUp = jest.fn().mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null })
    const result = await signUpWithEmail(makeClient({ signUp }), {
      name: 'Pessoa Teste', email: 'pessoa@gmail.com', password: 'Senha123', confirmation: 'Senha123'
    })
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'pessoa@gmail.com', password: 'Senha123' }))
    expect(result.user.id).toBe('u1')
  })

  test('não permite cadastro duplicado e não revela a existência do e-mail', async () => {
    const signUp = jest.fn().mockResolvedValue({ data: null, error: new Error('User already registered') })
    await expect(signUpWithEmail(makeClient({ signUp }), {
      name: 'Pessoa Teste', email: 'pessoa@gmail.com', password: 'Senha123', confirmation: 'Senha123'
    })).rejects.toThrow('Não foi possível criar a conta com esses dados.')
  })

  test('valida confirmação de senha antes de chamar o serviço', async () => {
    const signUp = jest.fn()
    await expect(signUpWithEmail(makeClient({ signUp }), {
      name: 'Pessoa Teste', email: 'pessoa@gmail.com', password: 'Senha123', confirmation: 'Outra123'
    })).rejects.toThrow('As senhas não coincidem.')
    expect(signUp).not.toHaveBeenCalled()
  })
})

describe('recuperação por código', () => {
  test('solicita um código de recuperação para o e-mail', async () => {
    globalThis.window = { location: { origin: 'http://localhost:5173' } }
    const resetPasswordForEmail = jest.fn().mockResolvedValue({ error: null })
    await requestPasswordCode(makeClient({ resetPasswordForEmail }), 'pessoa@gmail.com')
    expect(resetPasswordForEmail).toHaveBeenCalledWith('pessoa@gmail.com', {
      redirectTo: 'http://localhost:5173/verificar-codigo'
    })
  })

  test('aceita código OTP correto do tipo recovery', async () => {
    const verifyOtp = jest.fn().mockResolvedValue({ data: { session: { access_token: 'token' } }, error: null })
    const result = await verifyPasswordCode(makeClient({ verifyOtp }), 'pessoa@gmail.com', '123456')
    expect(verifyOtp).toHaveBeenCalledWith({ email: 'pessoa@gmail.com', token: '123456', type: 'recovery' })
    expect(result.session.access_token).toBe('token')
  })

  test('rejeita código incorreto', async () => {
    const verifyOtp = jest.fn().mockResolvedValue({ data: null, error: new Error('Token is invalid') })
    await expect(verifyPasswordCode(makeClient({ verifyOtp }), 'pessoa@gmail.com', '000000')).rejects.toThrow('Token is invalid')
  })

  test('rejeita código expirado', async () => {
    const verifyOtp = jest.fn().mockResolvedValue({ data: null, error: new Error('Token has expired') })
    await expect(verifyPasswordCode(makeClient({ verifyOtp }), 'pessoa@gmail.com', '123456')).rejects.toThrow('Token has expired')
  })

  test('trata limite de tentativas ou requisições', () => {
    expect(safeAuthError(new Error('429 Too many requests: rate limit exceeded')))
      .toBe('Muitas tentativas. Aguarde um pouco antes de tentar novamente.')
  })
})

describe('alteração de senha', () => {
  test('atualiza a senha após validação', async () => {
    const updateUser = jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const result = await updatePassword(makeClient({ updateUser }), 'NovaSenha123', 'NovaSenha123')
    expect(updateUser).toHaveBeenCalledWith({ password: 'NovaSenha123' })
    expect(result.user.id).toBe('u1')
  })

  test('não altera a senha se a confirmação estiver diferente', async () => {
    const updateUser = jest.fn()
    await expect(updatePassword(makeClient({ updateUser }), 'NovaSenha123', 'SenhaErrada1')).rejects.toThrow('As senhas não coincidem.')
    expect(updateUser).not.toHaveBeenCalled()
  })
})
