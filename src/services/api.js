import { supabase } from './supabase'

// Envia o token da sessão atual; o servidor valida-o antes de responder.
export const api = async (path, opts = {}) => {
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
  const headers = new Headers(opts.headers || {})
  headers.set('Content-Type', 'application/json')
  if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`)

  const response = await fetch('/api' + path, { ...opts, headers })
  if (response.status === 204) return null
  const body = await response.json()
  if (!response.ok) {
    const error = new Error(body?.error || 'Erro na solicitação à API.')
    error.code = body?.code
    throw error
  }
  return body
}
