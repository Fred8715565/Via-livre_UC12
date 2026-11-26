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
  if (message.includes('rate limit') || message.includes('too many') || message.includes('429') || message.includes('security purposes') || message.includes('over_request_rate_limit') || message.includes('over_email_send_rate_limit') || message.includes('over_sms_send_rate_limit')) {
    return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.'
  }
  // Autenticador (TOTP): o código muda a cada 30 segundos.
  if (context === 'mfa' || message.includes('totp') || message.includes('mfa_')) {
    if (message.includes('aal2') || message.includes('insufficient_aal')) return 'Confirme o código do autenticador para continuar.'
    if (message.includes('factor') && (message.includes('not found') || message.includes('not_found'))) return 'Autenticador não encontrado. Atualize a página e tente novamente.'
    return 'Código do autenticador incorreto. Confira o app (o código muda a cada 30 segundos) e tente de novo.'
  }
  if (context === 'phone') {
    if (message.includes('expired') || message.includes('invalid') || message.includes('otp')) {
      return 'Código inválido ou expirado. Confira o SMS ou solicite um novo código.'
    }
    if (message.includes('provider') || message.includes('sms') || message.includes('phone')) {
      return 'Não foi possível enviar o SMS agora. Confira o número ou tente novamente mais tarde.'
    }
    return 'Não foi possível concluir a operação. Confira os dados e tente novamente.'
  }
  if (message.includes('expired') || message.includes('invalid') || message.includes('otp')) {
    return 'Código inválido ou expirado. Confira o e-mail ou solicite um novo código.'
  }
  if (message.includes('password')) return 'A senha não atende aos requisitos de segurança.'
  return 'Não foi possível concluir a operação. Confira os dados e tente novamente.'
}

// ---------- Celular (SMS) ----------
// Converte "(27) 99999-0000" em "+5527999990000" (E.164). Sem "+", assume Brasil (+55).
export function normalizePhone(input, defaultCountry = '55') {
  const raw = String(input ?? '').trim()
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (raw.startsWith('+')) return `+${digits}`
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  const local = digits.replace(/^0+/, '') // tira o 0 inicial de "027..."
  if (local.startsWith(defaultCountry) && local.length >= 12) return `+${local}`
  return `+${defaultCountry}${local}`
}

export function validatePhone(phone) {
  return typeof phone === 'string' && /^\+[1-9]\d{9,14}$/.test(phone)
}

export function maskPhone(phone) {
  const value = String(phone || '')
  return value.length > 6 ? `${value.slice(0, 3)}••••${value.slice(-4)}` : value
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
