import { validateEmail, validatePassword, passwordsMatch, validateTotpCode } from './authRules.js'
const appOrigin = () => typeof window !== 'undefined' ? window.location.origin : ''

export async function signInWithEmail(client, { email, password, rememberMe = true }) {
  if (!validateEmail(email)) throw new Error('Informe um e-mail válido.')
  if (!password) throw new Error('Informe sua senha.')
  if (typeof window !== 'undefined') window.localStorage.setItem('vl_auth_remember', String(Boolean(rememberMe)))
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  return data
}

export async function signUpWithEmail(client, { name, email, password, confirmation }) {
  if (!String(name || '').trim()) throw new Error('Informe seu nome completo.')
  if (!validateEmail(email)) throw new Error('Informe um e-mail válido.')
  if (!validatePassword(password)) throw new Error('Use no mínimo 8 caracteres, com letras maiúsculas, minúsculas e números.')
  if (!passwordsMatch(password, confirmation)) throw new Error('As senhas não coincidem.')

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name.trim() }, emailRedirectTo: `${appOrigin()}/` }
  })
  if (error) {
    // Não revelar se o e-mail já possui cadastro.
    if (/already registered|already exists|duplicate/i.test(error.message)) {
      throw new Error('Não foi possível criar a conta com esses dados. Confira o e-mail ou tente entrar.')
    }
    throw error
  }
  return data
}

export async function requestPasswordCode(client, email) {
  if (!validateEmail(email)) throw new Error('Informe um e-mail válido.')
  // O template "Reset Password" do Supabase deve usar {{ .Token }} para enviar o OTP de 6 dígitos.
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${appOrigin()}/verificar-codigo`
  })
  if (error) throw error
}

export async function verifyPasswordCode(client, email, token) {
  if (!validateEmail(email)) throw new Error('E-mail inválido. Volte e solicite outro código.')
  if (!/^\d{6}$/.test(token)) throw new Error('Digite o código de 6 dígitos recebido por e-mail.')
  const { data, error } = await client.auth.verifyOtp({ email: email.trim(), token, type: 'recovery' })
  if (error) throw error
  return data
}

export async function updatePassword(client, password, confirmation) {
  if (!validatePassword(password)) throw new Error('Use no mínimo 8 caracteres, com letras maiúsculas, minúsculas e números.')
  if (!passwordsMatch(password, confirmation)) throw new Error('As senhas não coincidem.')
  const { data, error } = await client.auth.updateUser({ password })
  if (error) throw error
  return data
}

// ---------- Autenticador (TOTP) ----------
export async function getAssuranceLevel(client) {
  const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return { currentLevel: data.currentLevel, nextLevel: data.nextLevel }
}

// listFactors() devolve em `totp` só os fatores já confirmados; os pendentes ficam em `all`.
export async function listTotpFactors(client) {
  const { data, error } = await client.auth.mfa.listFactors()
  if (error) throw error
  const verified = data?.totp ?? []
  const pending = (data?.all ?? []).filter(f => f.factor_type === 'totp' && f.status !== 'verified')
  return { verified, pending }
}

// Cria o fator e devolve o QR Code (SVG em data URL) e a chave para digitação manual.
export async function enrollTotp(client) {
  // Remove tentativas anteriores não concluídas; senão o Supabase recusa nomes repetidos.
  const { pending } = await listTotpFactors(client)
  for (const factor of pending) await client.auth.mfa.unenroll({ factorId: factor.id })
  const friendlyName = `Via Livre ${new Date().toLocaleString('pt-BR')}`
  const { data, error } = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName, issuer: 'Via Livre' })
  if (error) throw error
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri }
}

// Usado na ativação (confirma o fator) e no login (sobe a sessão de aal1 para aal2).
export async function verifyTotp(client, factorId, code) {
  if (!validateTotpCode(code)) throw new Error('Digite o código de 6 dígitos do aplicativo autenticador.')
  const { data, error } = await client.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) throw error
  return data
}

export async function cancelTotpEnrollment(client, factorId) {
  const { error } = await client.auth.mfa.unenroll({ factorId })
  if (error) throw error
}

// Só funciona com sessão aal2. O refreshSession derruba o nível aal2 do token imediatamente.
export async function disableTotp(client, factorId) {
  const { error } = await client.auth.mfa.unenroll({ factorId })
  if (error) throw error
  await client.auth.refreshSession()
}
