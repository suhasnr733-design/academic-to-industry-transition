// src/components/layout/Sidebar.jsx

import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../utils/helpers'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import {
  HomeIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardListIcon,
  OfficeBuildingIcon,
  UserCircleIcon,
  CogIcon,
  TrendingUpIcon,
  XIcon
} from '@heroicons/react/outline'

const studentNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Career Analytics', href: '/dashboard/advanced', icon: TrendingUpIcon },
  { name: 'Placement Drives', href: '/placements', icon: OfficeBuildingIcon, badgeKey: 'placement' },
  { name: 'Resume', href: '/resume', icon: DocumentTextIcon },
  { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
  { name: 'Skills', href: '/skills', icon: ChartBarIcon },
  { name: 'Learning', href: '/learning', icon: AcademicCapIcon },
  { name: 'Assessments', href: '/assessment', icon: ClipboardListIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

const facultyNavigation = [
  { name: 'Faculty Overview', href: '/faculty', icon: HomeIcon },
  { name: 'Student Directory', href: '/faculty?tab=students', icon: UserGroupIcon },
  { name: 'Cohort Analytics', href: '/faculty?tab=analytics', icon: ChartBarIcon },
  { name: 'Campus Drives', href: '/faculty?tab=drives', icon: OfficeBuildingIcon },
  { name: 'Placement Shortlist', href: '/faculty?tab=shortlist', icon: BriefcaseIcon },
  { name: 'Profile Settings', href: '/profile', icon: UserCircleIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Faculty Overview', href: '/faculty', icon: UserGroupIcon },
  { name: 'Profile Settings', href: '/profile', icon: UserCircleIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [pendingPlacementsCount, setPendingPlacementsCount] = useState(0)

  const role = user?.role || 'student'
  const navigation = role === 'admin' 
    ? adminNavigation 
    : role === 'faculty' 
    ? facultyNavigation 
    : studentNavigation

  // Fetch pending placement drive notifications for student badge
  useEffect(() => {
    if (role === 'student' && user) {
      const fetchPending = async () => {
        try {
          const res = await api.get('/placement/my-nominations')
          const noms = res.data?.nominations || []
          const pending = noms.filter(n => n.status === 'pending').length
          setPendingPlacementsCount(pending)
        } catch (e) {
          // ignore background errors
        }
      }

      fetchPending()
      const interval = setInterval(fetchPending, 25000)
      return () => clearInterval(interval)
    }
  }, [role, user])

  const roleLabel = role === 'faculty' 
    ? 'Faculty' 
    : role === 'admin' 
    ? 'Administrator' 
    : 'Student'

  const roleSubtext = role === 'faculty'
    ? (user?.department ? `${user.department}` : 'Department Mentor')
    : role === 'admin'
    ? 'Platform Admin'
    : (user?.department ? `${user.department} ${user?.year_of_study ? `• Yr ${user.year_of_study}` : ''}` : 'Candidate')

  const roleBadgeColor = role === 'faculty'
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : role === 'admin'
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-primary-50 text-primary-700 border-primary-200'

  const location = useLocation()
  const currentUrl = `${location.pathname}${location.search}`

  const isItemActive = (href) => {
    if (href === '/faculty') {
      return location.pathname === '/faculty' && (!location.search || location.search === '?tab=overview')
    }
    if (href === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    if (href.includes('?')) {
      return currentUrl === href
    }
    return location.pathname === href
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm transform transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button - mobile */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 lg:hidden"
          aria-label="Close Sidebar"
        >
          <XIcon className="h-6 w-6" />
        </button>

        {/* Navigation items */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="px-3 py-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {role === 'faculty' ? 'Faculty Portal' : role === 'admin' ? 'Admin Portal' : 'Student Career Suite'}
          </div>
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const active = isItemActive(item.href)
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    active
                      ? role === 'faculty'
                        ? 'bg-purple-50 text-purple-700 font-semibold shadow-xs'
                        : role === 'admin'
                        ? 'bg-red-50 text-red-700 font-semibold shadow-xs'
                        : 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  onClick={() => onClose()}
                >
                  <div className="flex items-center min-w-0">
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badgeKey === 'placement' && pendingPlacementsCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-extrabold bg-amber-500 text-white rounded-full shadow-sm animate-pulse ml-2 flex-shrink-0">
                      {pendingPlacementsCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0",
              role === 'faculty' 
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' 
                : role === 'admin'
                ? 'bg-gradient-to-tr from-red-600 to-orange-600'
                : 'bg-gradient-to-tr from-primary-600 to-secondary-600'
            )}>
              {user?.full_name?.[0] || user?.username?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.full_name || user?.username || 'User'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider', roleBadgeColor)}>
                  {roleLabel}
                </span>
                <span className="text-xs text-gray-500 truncate" title={roleSubtext}>
                  {roleSubtext}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}