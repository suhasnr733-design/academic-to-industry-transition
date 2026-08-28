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
  const authPaths = [
    '/login',
    '/register',
    '/faculty/login',
    '/faculty/register',
    '/auth/callback',
    '/forgot-password',
    '/forgot_password',
    '/reset-password',
    '/reset_password'
  ]
  const isAuthPage = authPaths.includes(location.pathname) || location.pathname.startsWith('/reset-password/')

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col justify-between relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-primary-400/15 rounded-full blur-3xl -z-0" />
        <div className="pointer-events-none absolute top-1/3 -right-24 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl -z-0" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 w-80 h-80 bg-purple-400/15 rounded-full blur-3xl -z-0" />

        <Navbar onMenuClick={toggleSidebar} />
        <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-6 my-auto relative z-10">
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