import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TabBar from './TabBar'
import { useApp } from '../context/AppContext'
export default function Layout() {
  const { toast, step } = useApp(); const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const bare = pathname.startsWith('/lugar') || pathname === '/sugerir' || (pathname === '/drone' && step >= 0) // telas sem a barra de abas, como no design
  return (<div className="app">
    <a className="skip" href="#main">Ir para o conteúdo</a>
    <main id="main" tabIndex={-1}><Outlet /></main>
    {!bare && <TabBar />}
    <div className="toast" role="status" aria-live="polite">{toast}</div>
  </div>)
}
