// frontend/src/components/layout/Layout.jsx

import React from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useAuth } from '../../hooks/useAuth'

export const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

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