import { describe, expect, test } from '@jest/globals'
import { CONFIG_MESSAGES, classifyBrowserKey, configProblem } from './keyCheck.js'

const jwt = claims => `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.assinatura`

describe('classifyBrowserKey', () => {
  test('chave publicável nova serve para o navegador', () => expect(classifyBrowserKey('sb_publishable_abc123')).toBe('ok'))
  test('chave secreta nova NÃO serve', () => expect(classifyBrowserKey('sb_secret_abc123')).toBe('secret'))
  test('JWT antigo com papel anon serve', () => expect(classifyBrowserKey(jwt({ role: 'anon' }))).toBe('ok'))
  test('JWT antigo com papel service_role NÃO serve', () => expect(classifyBrowserKey(jwt({ role: 'service_role' }))).toBe('secret'))
  test('ignora espaços em volta', () => expect(classifyBrowserKey('  sb_secret_abc  ')).toBe('secret'))
  test.each([undefined, null, '', '   '])('vazio (%p) = faltando', value => expect(classifyBrowserKey(value)).toBe('missing'))
  test('texto estranho não derruba a tela', () => expect(classifyBrowserKey('a.%%%.c')).toBe('ok'))
})

describe('configProblem', () => {
  test('tudo certo: sem aviso', () => expect(configProblem('https://x.supabase.co', 'sb_publishable_abc')).toBeNull())
  test('chave secreta: avisa com a mensagem certa', () => expect(configProblem('https://x.supabase.co', 'sb_secret_abc')).toBe(CONFIG_MESSAGES.secret))
  test('sem URL ou sem chave: pede para configurar', () => {
    expect(configProblem('', 'sb_publishable_abc')).toBe(CONFIG_MESSAGES.missing)
    expect(configProblem('https://x.supabase.co', '')).toBe(CONFIG_MESSAGES.missing)
  })
  test('a mensagem da chave secreta nunca repete a chave', () => {
    expect(configProblem('https://x.supabase.co', 'sb_secret_SEGREDO123')).not.toContain('SEGREDO123')
  })
})
