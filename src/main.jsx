import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './styles/app.css'
import App from './App'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './auth/AuthContext'

function AppWithAccountState() {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-loading" role="status">Verificando sua sessão…</div>
  // Monta o armazenamento do aplicativo apenas para a conta autenticada.
  // A troca de usuário desmonta o contexto anterior e evita misturar dados locais.
  return user ? <AppProvider key={user.id}><App /></AppProvider> : <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider><AppWithAccountState /></AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
