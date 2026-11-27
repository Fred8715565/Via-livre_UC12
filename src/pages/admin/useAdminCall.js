import { useCallback } from 'react'
import { api } from '../../services/api'

// Toda chamada da gestão leva a sessão do painel (X-Admin-Session). Se o servidor disser que ela
// não vale mais (ex.: foi reiniciado), a tela volta a pedir o código do autenticador.
export function useAdminCall(panelToken, onLock) {
  return useCallback(async (path, opts = {}) => {
    try { return await api(path, { ...opts, headers: { ...opts.headers, 'X-Admin-Session': panelToken } }) }
    catch (err) { if (err.code === 'panel_locked') onLock?.(); throw err }
  }, [panelToken, onLock])
}
