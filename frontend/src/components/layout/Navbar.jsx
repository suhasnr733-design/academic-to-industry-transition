import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../common/Button'
import { 
  MenuIcon, 
  XIcon,
  UserCircleIcon,
  LogoutIcon,
  HomeIcon,
  CogIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/outline'
import { RecommendedActionsDropdown } from './RecommendedActionsDropdown'
import { TransitionLogo } from '../common/TransitionLogo'

export const Navbar = ({ onMenuClick }) => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = React.useState(false)

  const authPaths = [
    '/login',
    '/register',
    '/faculty/login',
    '/faculty/register',
    '/forgot-password',
    '/forgot_password',
    '/reset-password',
    '/reset_password',
    '/auth/callback'
  ]
  const isAuthPage = authPaths.includes(location.pathname) || location.pathname.startsWith('/reset-password/')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const role = user?.role || 'student'
  const isStudent = role === 'student' || (!user?.role && isAuthenticated)
  const isFaculty = role === 'faculty'
  const isAdmin = role === 'admin'

  const homeHref = isFaculty ? '/faculty' : isAdmin ? '/admin' : '/dashboard'

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Portal Branding */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Toggle Navigation"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            )}
            <Link to={isAuthenticated ? homeHref : "/"} className="flex items-center space-x-2.5 group">
              <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <TransitionLogo className="w-9 h-9 drop-shadow-sm" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white leading-none block tracking-tight">
                  Transition<span className="text-primary-600 dark:text-primary-400">AI</span>
                </span>
                {isAuthenticated && !isAuthPage && (
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block leading-tight">
                    {isFaculty ? 'Faculty Portal' : isAdmin ? 'Admin Console' : 'Student Portal'}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAuthenticated && !isAuthPage ? (
              <>
                {/* Recommended Actions Top Bar Menu (Students & Faculty) */}
                {(isStudent || isFaculty) && (
                  <RecommendedActionsDropdown />
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-semibold text-sm shadow-sm ${
                      isFaculty 
                        ? 'bg-purple-600' 
                        : isAdmin 
                        ? 'bg-red-600' 
                        : 'bg-primary-600'
                    }`}>
                      {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-gray-900 leading-none">
                        {user?.full_name || user?.username}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium capitalize mt-0.5">
                        {role}
                      </p>
                    </div>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-1.5 border border-gray-100 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.full_name || user?.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          isFaculty ? 'bg-purple-50 text-purple-700' : isAdmin ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-700'
                        }`}>
                          {role}
                        </span>
                      </div>

                      {isFaculty ? (
                        <Link
                          to="/faculty"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          <HomeIcon className="h-4 w-4 mr-2.5 text-purple-600" />
                          Faculty Dashboard
                        </Link>
                      ) : isAdmin ? (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          <HomeIcon className="h-4 w-4 mr-2.5 text-red-600" />
                          Admin Console
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          <HomeIcon className="h-4 w-4 mr-2.5 text-primary-600" />
                          Student Dashboard
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        className={`flex items-center px-4 py-2 text-sm text-gray-700 ${
                          isFaculty
                            ? 'hover:bg-purple-50 hover:text-purple-700'
                            : isAdmin
                            ? 'hover:bg-red-50 hover:text-red-700'
                            : 'hover:bg-primary-50 hover:text-primary-700'
                        }`}
                        onClick={() => setShowDropdown(false)}
                      >
                        <UserCircleIcon
                          className={`h-4 w-4 mr-2.5 ${
                            isFaculty
                              ? 'text-purple-600'
                              : isAdmin
                              ? 'text-red-600'
                              : 'text-primary-600'
                          }`}
                        />
                        Profile Settings
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowDropdown(false)}
                      >
                        <CogIcon className="h-4 w-4 mr-2.5 text-gray-500" />
                        Settings
                      </Link>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogoutIcon className="h-4 w-4 mr-2.5 text-red-500" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1.5 p-1 bg-gray-50/80 dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700">
                <button
                  onClick={() => navigate('/login')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    location.pathname === '/login' || location.pathname === '/register'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Student Portal
                </button>
                <button
                  onClick={() => navigate('/faculty/login')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    location.pathname === '/faculty/login' || location.pathname === '/faculty/register'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Faculty Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar