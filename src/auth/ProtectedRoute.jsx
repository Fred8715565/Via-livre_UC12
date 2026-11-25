import { Navigate, useLocation } from 'react-router-dom'
import { canAccessProtectedRoute } from '../services/authRules'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-loading" role="status">Verificando sua sessão…</div>
  if (!canAccessProtectedRoute(user, loading)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
