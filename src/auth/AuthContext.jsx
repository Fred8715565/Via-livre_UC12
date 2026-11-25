import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, setRememberMe, supabase } from '../services/supabase'
import { signInWithEmail, signUpWithEmail } from '../services/authService'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (!error) setSession(data.session)
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    user: session?.user ?? null,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    signIn: credentials => signInWithEmail(supabase, credentials),
    signUp: details => signUpWithEmail(supabase, details),
    signInWithGoogle: async rememberMe => {
      if (!supabase) throw new Error('Configure o Supabase antes de habilitar o login.')
      setRememberMe(rememberMe)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` }
      })
      if (error) throw error
    },
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }), [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
