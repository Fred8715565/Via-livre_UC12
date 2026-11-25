import { createClient } from '@supabase/supabase-js'

// As variáveis VITE_ são usadas pelo navegador. Apenas a chave anon/public deve ficar aqui.
// Nunca coloque a chave service_role neste arquivo ou em qualquer variável VITE_.
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY

const REMEMBER_KEY = 'vl_auth_remember'
const browserStorage = () => typeof window !== 'undefined'
  ? { local: window.localStorage, session: window.sessionStorage }
  : null

// Permite que "Lembrar de mim" escolha entre persistir a sessão ou mantê-la só nesta aba.
const sessionStorageAdapter = {
  getItem(key) {
    const stores = browserStorage()
    if (!stores) return null
    const preferred = window.localStorage.getItem(REMEMBER_KEY) === 'true' ? stores.local : stores.session
    const fallback = preferred === stores.local ? stores.session : stores.local
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

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
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
    window.localStorage.setItem(REMEMBER_KEY, String(Boolean(enabled)))
  }
}
