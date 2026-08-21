// frontend/src/components/layout/Layout.jsx

import React from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useAuth } from '../../hooks/useAuth'

export const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const location = useLocation()
  const isAuthPage = ['/login', '/register', '/auth/callback', '/forgot-password'].includes(location.pathname)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50/60 via-slate-50 to-secondary-50/60 flex flex-col justify-between">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-between">
      <div>
        <Navbar onMenuClick={toggleSidebar} />
        
        <div className="flex">
          {isAuthenticated && (
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          )}
          
          <main className={`flex-1 transition-all duration-300 ${isAuthenticated ? 'lg:ml-64' : ''} p-4 md:p-6 lg:p-8`}>
            {children}
          </main>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default Layout