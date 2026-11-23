import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import RightPanel from './RightPanel'
import { useApp } from '../context/AppContext'
export default function Layout() {
  const { toast } = useApp(); const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (<div className="app">
    <a className="skip" href="#main">Ir para o conteúdo</a>
    <Sidebar />
    <main id="main" tabIndex={-1}><TopBar /><Outlet /></main>
    <RightPanel />
    <div className="toast" role="status" aria-live="polite">{toast}</div>
  </div>)
}
