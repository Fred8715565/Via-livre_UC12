import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import MapPage from '../pages/MapPage'
import Trip from '../pages/Trip'
import History from '../pages/History'
import Profile from '../pages/Profile'
import Place from '../pages/Place'
import Suggest from '../pages/Suggest'
import ProtectedRoute from '../auth/ProtectedRoute'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import VerifyCode from '../pages/auth/VerifyCode'
import ResetPassword from '../pages/auth/ResetPassword'
import PasswordChanged from '../pages/auth/PasswordChanged'

export default function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/cadastro" element={<Register />} />
    <Route path="/recuperar-senha" element={<ForgotPassword />} />
    <Route path="/verificar-codigo" element={<VerifyCode />} />
    <Route path="/redefinir-senha" element={<ResetPassword />} />
    <Route path="/senha-alterada" element={<PasswordChanged />} />
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<Home />} />
      <Route path="mapa" element={<MapPage />} />
      <Route path="ir" element={<Trip />} />
      <Route path="historico" element={<History />} />
      <Route path="perfil" element={<Profile />} />
      <Route path="lugar/:id" element={<Place />} />
      <Route path="sugerir" element={<Suggest />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
}
