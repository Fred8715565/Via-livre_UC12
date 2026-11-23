import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PLACES, HISTORY0, PROFILE0, STEPS, stepAt } from '../data/places'
import { USER, dist } from '../services/geo'
const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
function useLS(key, init) {
  const [v, s] = useState(() => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : init } catch { return init } })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }, [key, v])
  return [v, s]
}
function feedback(p) {
  if (p.vibration && navigator.vibrate) navigator.vibrate(200)
  if (!p.sound) return
  try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain()
    o.connect(g); g.connect(a.destination); g.gain.value = 0.05; o.frequency.value = 880; o.start(); o.stop(a.currentTime + 0.15) } catch {}
}
export function AppProvider({ children }) {
  const [profile, setProfile] = useLS('vl_profile', PROFILE0)
  const [raw, setRaw] = useLS('vl_places2', PLACES)
  const [history, setHistory] = useLS('vl_history2', HISTORY0)
  const [notifs, setNotifs] = useLS('vl_notifs', [])
  const [toast, setToast] = useState('')
  const [drone, setDrone] = useState({ running: false, t: 0, destId: null })
  const places = useMemo(() => raw.map(p => ({ ...p, dist: dist(USER, p.pos) })), [raw])
  const step = drone.destId == null ? -1 : stepAt(drone.t)
  const notify = useCallback(text => {
    setNotifs(n => [{ id: Date.now() + Math.random(), text, read: false, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...n].slice(0, 20))
    setToast(text)
  }, [setNotifs])
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(''), 4500); return () => clearTimeout(i) }, [toast])
  useEffect(() => { document.documentElement.style.fontSize = profile.textSize + '%' }, [profile.textSize])
  useEffect(() => {
    if (!drone.running) return
    const id = setInterval(() => setDrone(d => (d.running ? { ...d, t: d.t + (profile.slow ? 66 : 100) } : d)), 100)
    return () => clearInterval(id)
  }, [drone.running, profile.slow])
  useEffect(() => {
    if (step < 1) return
    const dest = places.find(p => p.id === drone.destId)
    notify(step === 3 && dest ? `Você chegou ao destino: ${dest.name}.` : STEPS[step].msg); feedback(profile)
    if (step === 3) {
      setDrone(d => ({ ...d, running: false }))
      if (dest) setHistory(h => [{ id: 'h' + Date.now(), name: dest.name, emoji: dest.emoji || '📍', placeId: dest.id, rating: 0, date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) }, ...h])
    }
  }, [step]) // eslint-disable-line
  const value = {
    profile, setProfile, places, history, notifs, toast, notify, drone, step,
    addPlace: p => setRaw(r => [...r, { ...p, id: 'u' + Date.now(), emoji: '📍', rating: 0, reviews: 0, user: true, pos: [USER[0] + (Math.random() - 0.5) * 0.006, USER[1] + (Math.random() - 0.5) * 0.006] }]),
    rate: (id, rating) => setHistory(h => h.map(x => (x.id === id ? { ...x, rating } : x))),
    removeTrip: id => setHistory(h => h.filter(x => x.id !== id)),
    markRead: () => setNotifs(n => n.map(x => ({ ...x, read: true }))),
    clearNotifs: () => setNotifs([]),
    startDrone: id => { setDrone({ running: true, t: 0, destId: id }); notify(STEPS[0].msg); feedback(profile) },
    cancelDrone: () => { setDrone({ running: false, t: 0, destId: null }); notify('Solicitação do drone cancelada.') },
    resetDrone: () => setDrone({ running: false, t: 0, destId: null })
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
