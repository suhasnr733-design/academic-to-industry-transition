// frontend/src/components/layout/Layout.jsx

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useAuth } from '../../hooks/useAuth'

export const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

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
  
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar_collapsed', String(next))
      return next
    })
  }

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col relative overflow-x-hidden overflow-y-auto">
        {/* Ambient background glows */}
        <div className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-0" />
        <div className="pointer-events-none fixed top-1/3 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-0" />
        <div className="pointer-events-none fixed -bottom-24 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-0" />

        <Navbar 
          onMenuClick={toggleSidebar} 
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
        <main className="flex-1 flex items-start justify-center px-4 py-6 sm:py-8 relative z-10">
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col justify-between relative selection:bg-indigo-500/30">
      <div>
        <Navbar 
          onMenuClick={toggleSidebar} 
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        
        <div className="flex">
          {isAuthenticated && (
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
              isCollapsed={isCollapsed}
              onToggleCollapse={toggleCollapse}
            />
          )}
          
          <main className={`flex-1 transition-all duration-300 ${
            isAuthenticated ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-64') : ''
          } p-3 sm:p-4 md:p-6 min-h-[calc(100vh-4rem)]`}>
            {children}
          </main>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default Layout