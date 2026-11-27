import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TabBar from './TabBar'
import { useApp } from '../context/AppContext'
export default function Layout() {
  const { toast } = useApp(); const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const bare = pathname.startsWith('/lugar') || pathname === '/sugerir' // telas sem a barra de abas, como no design
  return (<div className={'app' + (pathname === '/ir' ? ' full' : '')}>
    <a className="skip" href="#main">Ir para o conteúdo</a>
    <main id="main" tabIndex={-1}><Outlet /></main>
    <TabBar hideOnMobile={bare} />
    <div className="toast" role="status" aria-live="polite">{toast}</div>
  </div>)
}
