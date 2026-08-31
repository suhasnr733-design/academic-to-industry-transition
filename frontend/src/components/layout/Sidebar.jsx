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

const studentSections = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Career Analytics', href: '/dashboard/advanced', icon: TrendingUpIcon },
    ]
  },
  {
    title: 'Career Opportunities',
    items: [
      { name: 'Job Matches', href: '/jobs', icon: BriefcaseIcon, badgeKey: 'jobs' },
      { name: 'Placement Drives', href: '/placements', icon: OfficeBuildingIcon, badgeKey: 'placement' },
      { name: 'Resume Hub', href: '/resume', icon: DocumentTextIcon },
    ]
  },
  {
    title: 'Skill & Learning',
    items: [
      { name: 'Skill Gap Analysis', href: '/skills', icon: ChartBarIcon },
      { name: 'Learning Roadmap', href: '/learning', icon: AcademicCapIcon },
      { name: 'Assessments', href: '/assessment', icon: ClipboardListIcon },
    ]
  },
  {
    title: 'Preferences',
    items: [
      { name: 'Profile & Settings', href: '/profile', icon: UserCircleIcon },
    ]
  }
]

const facultySections = [
  {
    title: 'Overview',
    items: [
      { name: 'Faculty Overview', href: '/faculty', icon: HomeIcon },
      { name: 'Cohort Analytics', href: '/faculty?tab=analytics', icon: ChartBarIcon },
    ]
  },
  {
    title: 'Mentorship & Drives',
    items: [
      { name: 'Student Directory', href: '/faculty?tab=students', icon: UserGroupIcon },
      { name: 'Campus Drives', href: '/faculty?tab=drives', icon: OfficeBuildingIcon },
      { name: 'Placement Shortlist', href: '/faculty?tab=shortlist', icon: BriefcaseIcon },
    ]
  },
  {
    title: 'Preferences',
    items: [
      { name: 'Profile Settings', href: '/profile', icon: UserCircleIcon },
      { name: 'Settings', href: '/settings', icon: CogIcon },
    ]
  }
]

const adminSections = [
  {
    title: 'Administration',
    items: [
      { name: 'Admin Dashboard', href: '/admin', icon: HomeIcon },
      { name: 'Faculty Overview', href: '/faculty', icon: UserGroupIcon },
    ]
  },
  {
    title: 'Preferences',
    items: [
      { name: 'Profile Settings', href: '/profile', icon: UserCircleIcon },
      { name: 'Settings', href: '/settings', icon: CogIcon },
    ]
  }
]

export const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { user } = useAuth()
  const [pendingPlacementsCount, setPendingPlacementsCount] = useState(0)
  const [jobCount, setJobCount] = useState(0)

  const role = user?.role || 'student'
  const sections = role === 'admin' 
    ? adminSections 
    : role === 'faculty' 
    ? facultySections 
    : studentSections

  // Fetch pending placement drives and available job count for student badges
  useEffect(() => {
    if (role === 'student' && user) {
      const fetchStudentBadgeData = async () => {
        try {
          const [placementsRes, jobsRes] = await Promise.allSettled([
            api.get('/placement/my-nominations'),
            api.get('/jobs')
          ])

          if (placementsRes.status === 'fulfilled') {
            const noms = placementsRes.value.data?.nominations || []
            const pending = noms.filter(n => n.status === 'pending').length
            setPendingPlacementsCount(pending)
          }

          if (jobsRes.status === 'fulfilled') {
            const list = jobsRes.value.data?.jobs || []
            setJobCount(list.length)
          }
        } catch (e) {
          // ignore background errors
        }
      }

      fetchStudentBadgeData()
      const interval = setInterval(fetchStudentBadgeData, 25000)
      return () => clearInterval(interval)
    }
  }, [role, user])

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

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-slate-200/80 dark:border-gray-800 flex flex-col justify-between shadow-sm transition-all duration-300',
          isCollapsed ? 'w-64 lg:w-20' : 'w-64',
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

        {/* Categorized Navigation Sections */}
        <div className="p-3 overflow-y-auto flex-1 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section title hidden when collapsed on desktop */}
              <div className={cn(
                "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-all duration-200",
                isCollapsed ? "px-3 lg:hidden" : "px-3"
              )}>
                {section.title}
              </div>

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const active = isItemActive(item.href)
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center rounded-xl text-xs font-medium transition-all duration-150 group relative',
                        isCollapsed
                          ? 'justify-between px-3 py-2 lg:justify-center lg:px-0 lg:py-2.5'
                          : 'justify-between px-3 py-2',
                        active
                          ? role === 'faculty'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border-l-2 border-purple-600 shadow-xs'
                            : role === 'admin'
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold border-l-2 border-red-600 shadow-xs'
                            : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold border-l-2 border-primary-600 shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                      )}
                      onClick={() => onClose()}
                      title={item.name}
                    >
                      <div className={cn(
                        "flex items-center min-w-0",
                        isCollapsed ? "lg:justify-center" : ""
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-110",
                          isCollapsed ? "mr-2.5 lg:mr-0" : "mr-2.5",
                          active
                            ? role === 'faculty'
                              ? "text-purple-600 dark:text-purple-400"
                              : role === 'admin'
                              ? "text-red-600 dark:text-red-400"
                              : "text-primary-600 dark:text-primary-400"
                            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                        )} />
                        
                        {/* Text label */}
                        <span className={cn(
                          "truncate transition-all duration-200",
                          isCollapsed ? "inline lg:hidden" : "inline"
                        )}>
                          {item.name}
                        </span>
                      </div>

                      {/* Full Live Badges (when expanded) */}
                      <div className={cn(isCollapsed ? "lg:hidden" : "inline-flex")}>
                        {item.badgeKey === 'placement' && pendingPlacementsCount > 0 && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full shadow-xs animate-pulse ml-2 flex-shrink-0">
                            {pendingPlacementsCount} Action
                          </span>
                        )}
                        {item.badgeKey === 'jobs' && jobCount > 0 && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md ml-2 flex-shrink-0">
                            {jobCount}
                          </span>
                        )}
                      </div>

                      {/* Mini Badge Dots (when collapsed on desktop) */}
                      {isCollapsed && item.badgeKey === 'placement' && pendingPlacementsCount > 0 && (
                        <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                      )}
                      {isCollapsed && item.badgeKey === 'jobs' && jobCount > 0 && (
                        <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Clean Sidebar Footer */}
        <div className={cn(
          "p-3 border-t border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/40 flex items-center transition-all duration-300",
          isCollapsed ? "justify-between lg:justify-center lg:px-0" : "justify-between"
        )}>
          <div className="flex items-center space-x-2 min-w-0" title={role === 'faculty' ? 'Faculty Portal' : role === 'admin' ? 'Admin Console' : 'Student Portal'}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              role === 'faculty' ? 'bg-purple-500 ring-2 ring-purple-200 dark:ring-purple-900' : role === 'admin' ? 'bg-red-500 ring-2 ring-red-200 dark:ring-red-900' : 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900'
            } animate-pulse`} />
            <span className={cn(
              "text-[11px] font-semibold text-gray-600 dark:text-gray-400 truncate",
              isCollapsed ? "inline lg:hidden" : "inline"
            )}>
              {role === 'faculty' ? 'Faculty Portal' : role === 'admin' ? 'Admin Console' : 'Student Portal'}
            </span>
          </div>
          <span className={cn(
            "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-2 flex-shrink-0",
            isCollapsed ? "inline lg:hidden" : "inline"
          )}>
            v1.0
          </span>
        </div>
      </aside>
    </>
  )
}

export default Sidebar