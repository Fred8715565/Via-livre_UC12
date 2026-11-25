import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PLACES, HISTORY0, PROFILE0 } from '../data/places'
import { USER, dist } from '../services/geo'
import { useAuth } from '../auth/AuthContext'
const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
function useLS(key, init, legacyKey = null) {
  const [v, s] = useState(() => {
    try {
      const current = localStorage.getItem(key)
      if (current) return JSON.parse(current)
      // Migra os dados antigos uma única vez para a primeira conta autenticada.
      const legacy = legacyKey ? localStorage.getItem(legacyKey) : null
      if (legacy) {
        const parsed = JSON.parse(legacy)
        localStorage.setItem(key, JSON.stringify(parsed))
        localStorage.removeItem(legacyKey)
        return parsed
      }
      return init
    } catch { return init }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }, [key, v])
  return [v, s]
}
export function AppProvider({ children }) {
  const { user } = useAuth()
  const accountId = user?.id || 'guest'
  const [profile, setProfile] = useLS(`vl_profile2_${accountId}`, PROFILE0, user ? 'vl_profile2' : null)
  const [raw, setRaw] = useLS(`vl_places2_${accountId}`, PLACES, user ? 'vl_places2' : null)
  const [history, setHistory] = useLS(`vl_history3_${accountId}`, HISTORY0, user ? 'vl_history3' : null)
  const [notifs, setNotifs] = useLS(`vl_notifs_${accountId}`, [], user ? 'vl_notifs' : null)
  const [toast, setToast] = useState('')
  const places = useMemo(() => raw.map(p => ({ ...p, dist: dist(USER, p.pos) })), [raw])
  const notify = useCallback(text => {
    setNotifs(n => [{ id: Date.now() + Math.random(), text, read: false, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...n].slice(0, 20))
    setToast(text)
  }, [setNotifs])
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(''), 4500); return () => clearTimeout(i) }, [toast])
  useEffect(() => { document.documentElement.style.fontSize = profile.textSize + '%' }, [profile.textSize])
  const value = {
    profile, setProfile, places, history, notifs, toast, notify,
    addPlace: p => setRaw(r => [...r, { ...p, id: 'u' + Date.now(), emoji: '📍', rating: 0, reviews: 0, user: true, pos: [USER[0] + (Math.random() - 0.5) * 0.006, USER[1] + (Math.random() - 0.5) * 0.006] }]),
    addTrip: (p, via) => {
      setHistory(h => [{ id: 'h' + Date.now(), name: p.name, emoji: p.emoji || '📍', placeId: p.id, via, rating: 0, date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) }, ...h].slice(0, 30))
      notify(`Abrindo ${via === 'Uber' ? 'o Uber' : 'o Maps'} para ${p.name}.`)
    },
    rate: (id, rating) => setHistory(h => h.map(x => (x.id === id ? { ...x, rating } : x))),
    removeTrip: id => setHistory(h => h.filter(x => x.id !== id)),
    markRead: () => setNotifs(n => n.map(x => ({ ...x, read: true }))),
    clearNotifs: () => setNotifs([])
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
