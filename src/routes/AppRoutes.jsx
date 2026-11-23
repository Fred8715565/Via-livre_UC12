import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import MapPage from '../pages/MapPage'
import Drone from '../pages/Drone'
import History from '../pages/History'
import Profile from '../pages/Profile'
import Place from '../pages/Place'
import Suggest from '../pages/Suggest'
export default function AppRoutes() {
  return (<Routes><Route element={<Layout />}>
    <Route index element={<Home />} /><Route path="mapa" element={<MapPage />} /><Route path="drone" element={<Drone />} />
    <Route path="historico" element={<History />} /><Route path="perfil" element={<Profile />} /><Route path="lugar/:id" element={<Place />} /><Route path="sugerir" element={<Suggest />} /><Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes>)
}
