import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, setRememberMe, supabase } from '../services/supabase'
import {
  cancelTotpEnrollment, disableTotp, enrollTotp, getAssuranceLevel, listTotpFactors,
  requestPhoneCode, signInWithEmail, signUpWithEmail, verifyPhoneCode, verifyTotp
} from '../services/authService'
import { isAdminUser, needsMfaChallenge } from '../services/authRules'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const SAFE_AAL = { currentLevel: 'aal1', nextLevel: 'aal1' }

// Funções do autenticador (2FA). Ficam fora do componente para manterem a mesma referência entre renders.
const mfaApi = {
  list: () => listTotpFactors(supabase),
  enroll: () => enrollTotp(supabase),
  verify: (factorId, code) => verifyTotp(supabase, factorId, code),
  cancel: factorId => cancelTotpEnrollment(supabase, factorId),
  disable: factorId => disableTotp(supabase, factorId)
}

async function oauth(provider, rememberMe) {
  if (!supabase) throw new Error('Configure o Supabase antes de habilitar o login.')
  setRememberMe(rememberMe)
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/` }
  })
  if (error) throw error
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // Nível de autenticação (aal1 = senha/SMS/social; aal2 = depois do código do autenticador).
  const [aalState, setAalState] = useState({ userId: null, aal: null })

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

  const userId = session?.user?.id ?? null
  const accessToken = session?.access_token ?? null

  // Recalcula o nível sempre que o usuário ou o token mudam (login, refresh, verificação do código).
  // Fica fora do onAuthStateChange de propósito: chamar o Supabase dentro dele pode travar.
  useEffect(() => {
    if (!supabase || !userId) {
      setAalState({ userId: null, aal: null })
      return undefined
    }
    let active = true
    getAssuranceLevel(supabase)
      .then(aal => { if (active) setAalState({ userId, aal }) })
      .catch(() => { if (active) setAalState({ userId, aal: SAFE_AAL }) })
    return () => { active = false }
  }, [userId, accessToken])

  const refreshAal = useCallback(async () => {
    if (!supabase || !userId) return null
    const aal = await getAssuranceLevel(supabase).catch(() => SAFE_AAL)
    setAalState({ userId, aal })
    return aal
  }, [userId])

  const mfaReady = !userId || aalState.userId === userId
  const aal = mfaReady ? aalState.aal : null

  const value = useMemo(() => ({
    user: session?.user ?? null,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    // 2FA / autenticador
    aal,
    mfaReady,
    needsMfa: needsMfaChallenge(aal),
    refreshAal,
    mfa: mfaApi,
    // Painel de gestão
    isAdmin: isAdminUser(session?.user),
    // Entrar
    signIn: credentials => signInWithEmail(supabase, credentials),
    signUp: details => signUpWithEmail(supabase, details),
    signInWithGoogle: rememberMe => oauth('google', rememberMe),
    signInWithApple: rememberMe => oauth('apple', rememberMe),
    requestPhoneCode: phone => requestPhoneCode(supabase, phone),
    verifyPhoneCode: (phone, token, rememberMe) => verifyPhoneCode(supabase, phone, token, rememberMe),
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }), [session, loading, aal, mfaReady, refreshAal])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
