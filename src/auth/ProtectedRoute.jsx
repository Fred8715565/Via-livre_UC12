import { Navigate, useLocation } from 'react-router-dom'
import { canAccessProtectedRoute } from '../services/authRules'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading, mfaReady, needsMfa } = useAuth()
  const location = useLocation()
  if (loading || (user && !mfaReady)) return <div className="auth-loading" role="status">Verificando sua sessão…</div>
  if (!canAccessProtectedRoute(user, loading)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  // Conta com autenticador ativo, mas o código ainda não foi digitado nesta sessão.
  if (needsMfa) return <Navigate to="/verificar-2fa" replace state={{ from: location.pathname }} />
  return children
}
