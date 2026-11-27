
import { createClient } from '@supabase/supabase-js'
import { classifyBrowserKey, configProblem } from './keyCheck'

// Lê as variáveis públicas do arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const REMEMBER_KEY = 'vl_auth_remember'

const browserStorage = () => typeof window !== 'undefined'
  ? { local: window.localStorage, session: window.sessionStorage }
  : null

const sessionStorageAdapter = {
  getItem(key) {
    const stores = browserStorage()
    if (!stores) return null

    const preferred = window.localStorage.getItem(REMEMBER_KEY) === 'true'
      ? stores.local
      : stores.session

    const fallback = preferred === stores.local
      ? stores.session
      : stores.local

    return preferred.getItem(key) ?? fallback.getItem(key)
  },

  setItem(key, value) {
    const stores = browserStorage()
    if (!stores) return

    const persistent = window.localStorage.getItem(REMEMBER_KEY) === 'true'
    const target = persistent ? stores.local : stores.session
    const other = persistent ? stores.session : stores.local

    target.setItem(key, value)
    other.removeItem(key)
  },

  removeItem(key) {
    const stores = browserStorage()
    if (!stores) return

    stores.local.removeItem(key)
    stores.session.removeItem(key)
  }
}

// Aviso exibido nas telas de login quando a configuração não serve (ou null se está tudo certo).
// Chave secreta no navegador é bloqueada pelo Supabase (401) e ficaria pública: nem criamos o cliente com ela.
export const supabaseConfigProblem = configProblem(supabaseUrl, supabaseAnonKey)

// Verifica se as duas variáveis foram carregadas e se a chave pode ficar no navegador
export const isSupabaseConfigured = !supabaseConfigProblem

// Testes temporários
console.log('URL carregada:', Boolean(supabaseUrl))
console.log('Chave pública carregada:', Boolean(supabaseAnonKey))
console.log('Tipo da chave pública:', classifyBrowserKey(supabaseAnonKey))
console.log('Supabase configurado:', isSupabaseConfigured)

// Cria o cliente somente quando a configuração estiver completa
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: sessionStorageAdapter
      }
    })
  : null

export function setRememberMe(enabled) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      REMEMBER_KEY,
      String(Boolean(enabled))
    )
  }
}
