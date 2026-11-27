// Regras puras de validação: podem ser testadas sem acessar o Supabase.
export function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validatePassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
}

export function passwordsMatch(password, confirmation) {
  return typeof password === 'string' && password.length > 0 && password === confirmation
}

export function canAccessProtectedRoute(user, loading = false) {
  return !loading && Boolean(user)
}

export function safeAuthError(error, context = 'email') {
  const message = `${error?.message || ''} ${error?.code || ''}`.toLowerCase()
  if (message.includes('rate limit') || message.includes('too many') || message.includes('429') || message.includes('security purposes') || message.includes('over_request_rate_limit') || message.includes('over_email_send_rate_limit')) {
    return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.'
  }
  // Autenticador (TOTP): o código muda a cada 30 segundos.
  if (context === 'mfa' || message.includes('totp') || message.includes('mfa_')) {
    if (message.includes('aal2') || message.includes('insufficient_aal')) return 'Confirme o código do autenticador para continuar.'
    if (message.includes('factor') && (message.includes('not found') || message.includes('not_found'))) return 'Autenticador não encontrado. Atualize a página e tente novamente.'
    return 'Código do autenticador incorreto. Confira o app (o código muda a cada 30 segundos) e tente de novo.'
  }
  if (message.includes('expired') || message.includes('invalid') || message.includes('otp')) {
    return 'Código inválido ou expirado. Confira o e-mail ou solicite um novo código.'
  }
  if (message.includes('password')) return 'A senha não atende aos requisitos de segurança.'
  return 'Não foi possível concluir a operação. Confira os dados e tente novamente.'
}

// ---------- Autenticador (TOTP / 2FA) ----------
export function validateTotpCode(code) {
  return /^\d{6}$/.test(String(code ?? ''))
}

// aal1 = só o primeiro login; aal2 = primeiro login + código do autenticador.
export function needsMfaChallenge(aal) {
  return aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2'
}

// ---------- Painel de gestão ----------
// app_metadata só pode ser alterado pelo servidor (service_role); o usuário não consegue se promover.
export function isAdminUser(user) {
  return user?.app_metadata?.role === 'admin'
}
