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

export function safeAuthError(error) {
  const message = `${error?.message || ''} ${error?.code || ''}`.toLowerCase()
  if (message.includes('rate limit') || message.includes('too many') || message.includes('429') || message.includes('security purposes') || message.includes('over_request_rate_limit') || message.includes('over_email_send_rate_limit')) {
    return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.'
  }
  if (message.includes('expired') || message.includes('invalid') || message.includes('otp')) {
    return 'Código inválido ou expirado. Confira o e-mail ou solicite um novo código.'
  }
  if (message.includes('password')) return 'A senha não atende aos requisitos de segurança.'
  return 'Não foi possível concluir a operação. Confira os dados e tente novamente.'
}
