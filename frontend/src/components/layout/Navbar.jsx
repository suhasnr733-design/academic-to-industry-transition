import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../../utils/helpers'
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

export const Navbar = ({ onMenuClick, isCollapsed = false, onToggleCollapse }) => {
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
    setShowDropdown(false)
    navigate('/login')
  }

  const role = user?.role || 'student'
  const isStudent = role === 'student' || (!user?.role && isAuthenticated)
  const isFaculty = role === 'faculty'
  const isAdmin = role === 'admin'

  const homeHref = isFaculty ? '/faculty' : isAdmin ? '/admin' : '/dashboard'

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 sticky top-0 z-50">
      <div className="w-full">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Portal Branding (Collapsible with smooth animation on desktop) */}
          <div className={cn(
            "flex items-center h-16 transition-all duration-300",
            isAuthenticated && !isAuthPage
              ? isCollapsed
                ? "lg:w-20 lg:px-4 lg:justify-center lg:border-r lg:border-gray-200/80 dark:lg:border-gray-800 flex-shrink-0"
                : "lg:w-64 lg:px-4 lg:border-r lg:border-gray-200/80 dark:lg:border-gray-800 flex-shrink-0"
              : "px-4 sm:px-6 lg:px-8"
          )}>
            {isAuthenticated && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
                aria-label="Toggle Navigation"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            )}

            <div 
              onClick={isAuthenticated && !isAuthPage && onToggleCollapse ? onToggleCollapse : undefined}
              className={cn(
                "flex items-center space-x-2.5 group select-none",
                isAuthenticated && !isAuthPage ? "cursor-pointer" : ""
              )}
              title={isAuthenticated && !isAuthPage ? (isCollapsed ? "Click logo to expand sidebar" : "Click logo to collapse sidebar") : undefined}
            >
              <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <TransitionLogo className="w-8 h-8 drop-shadow-sm" />
              </div>

              {/* Text label with smooth width and opacity transition */}
              <div className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap",
                isAuthenticated && !isAuthPage && isCollapsed
                  ? "lg:w-0 lg:opacity-0"
                  : "w-auto opacity-100"
              )}>
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-none block tracking-tight">
                  Transition<span className="text-primary-600 dark:text-primary-400 font-extrabold tracking-wider ml-0.5">AI</span>
                </span>
                {isAuthenticated && !isAuthPage && (
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 block leading-tight mt-0.5 uppercase tracking-wider">
                    {isFaculty ? 'Faculty Portal' : isAdmin ? 'Admin Console' : 'Student Portal'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center justify-end space-x-3 sm:space-x-4 flex-1 px-4 sm:px-6 lg:px-8">
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
              <div className="flex items-center space-x-3 text-xs">
                {location.pathname === '/login' || location.pathname === '/faculty/login' ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">New to TransitionAI?</span>
                    <button
                      onClick={() => navigate(location.pathname === '/faculty/login' ? '/faculty/register' : '/register')}
                      className="font-semibold px-3 py-1.5 rounded-lg bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-xs"
                    >
                      Create Account
                    </button>
                  </div>
                ) : location.pathname === '/register' || location.pathname === '/faculty/register' ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">Already registered?</span>
                    <button
                      onClick={() => navigate(location.pathname === '/faculty/register' ? '/faculty/login' : '/login')}
                      className="font-semibold px-3 py-1.5 rounded-lg bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-xs"
                    >
                      Sign In
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">Remember your password?</span>
                    <button
                      onClick={() => {
                        const searchParams = new URLSearchParams(location.search)
                        const isFacultyForgot = searchParams.get('role') === 'faculty' || location.pathname.includes('/faculty')
                        navigate(isFacultyForgot ? '/faculty/login' : '/login')
                      }}
                      className="font-semibold px-3 py-1.5 rounded-lg bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-xs"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar