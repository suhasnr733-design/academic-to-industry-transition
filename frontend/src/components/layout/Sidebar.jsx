// src/components/layout/Sidebar.jsx

import React, { useState, useEffect, useRef } from 'react'
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
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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
  const [hoveredItem, setHoveredItem] = useState(null)

  const role = user?.role || 'student'
  const sections = role === 'admin' 
    ? adminSections 
    : role === 'faculty' 
    ? facultySections 
    : studentSections

  const lastFetchTimeRef = useRef(0)
  const rateLimitBackoffUntilRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Clear hovered item if sidebar expands
  useEffect(() => {
    if (!isCollapsed) {
      setHoveredItem(null)
    }
  }, [isCollapsed])

  // Fetch pending placement drives and available job count for student badges
  useEffect(() => {
    if (role === 'student' && user?.id) {
      const fetchStudentBadgeData = async (force = false) => {
        const now = Date.now()
        // Respect 429 backoff if active
        if (now < rateLimitBackoffUntilRef.current) {
          return
        }
        // Deduplicate rapid requests (min 60s cooldown unless forced)
        if (!force && now - lastFetchTimeRef.current < 60000) {
          return
        }
        lastFetchTimeRef.current = now

        try {
          const reqConfig = { headers: { 'X-Silent-Error': 'true' } }
          const [placementsRes, jobsRes] = await Promise.allSettled([
            api.get('/placement/my-nominations', reqConfig),
            api.get('/jobs', { ...reqConfig, params: { per_page: 50 } })
          ])

          if (!isMountedRef.current) return

          if (placementsRes.status === 'fulfilled') {
            const noms = placementsRes.value.data?.nominations || []
            const pending = noms.filter(n => n.status === 'pending').length
            setPendingPlacementsCount(pending)
          } else if (placementsRes.reason?.response?.status === 429) {
            // Trigger 3-minute backoff on 429 to avoid retry storm
            rateLimitBackoffUntilRef.current = Date.now() + 180000
          }

          if (jobsRes.status === 'fulfilled') {
            const total = jobsRes.value.data?.total ?? jobsRes.value.data?.jobs?.length ?? 0
            setJobCount(total)
          } else if (jobsRes.reason?.response?.status === 429) {
            // Trigger 3-minute backoff on 429 to avoid retry storm
            rateLimitBackoffUntilRef.current = Date.now() + 180000
          }
        } catch (e) {
          // ignore background errors
        }
      }

      fetchStudentBadgeData(false)
      const interval = setInterval(() => fetchStudentBadgeData(true), 120000)
      return () => clearInterval(interval)
    }
  }, [role, user?.id])

  const location = useLocation()
  const currentUrl = `${location.pathname}${location.search}`

  const isItemActive = (href) => {
    if (href === '/faculty') {
      return location.pathname === '/faculty' && (!location.search || location.search === '?tab=overview')
    }
    if (href === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    if (href === '/skills') {
      return location.pathname === '/skills' || location.pathname.startsWith('/skills/')
    }
    if (href === '/resume') {
      return location.pathname === '/resume' || location.pathname.startsWith('/resume/')
    }
    if (href === '/jobs') {
      return location.pathname === '/jobs' || location.pathname.startsWith('/jobs/')
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
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-slate-200/80 dark:border-gray-800 flex flex-col justify-between shadow-xs transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none overflow-x-hidden select-none',
          isCollapsed ? 'w-60 lg:w-20' : 'w-60',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button - mobile */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1.5 text-gray-400 hover:text-gray-600 lg:hidden rounded-lg hover:bg-gray-100"
          aria-label="Close Sidebar"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Categorized Navigation Sections */}
        <div className="p-3 overflow-y-auto flex-1 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section title smoothly transitions height & opacity when collapsed */}
              <div 
                aria-hidden={isCollapsed ? 'true' : undefined}
                className={cn(
                  "text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out motion-reduce:transition-none",
                  isCollapsed 
                    ? "max-h-8 opacity-100 py-1 lg:max-h-0 lg:opacity-0 lg:py-0 lg:pointer-events-none" 
                    : "max-h-8 opacity-100 py-1"
                )}
              >
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
                        'flex items-center text-[13.5px] font-medium transition-all duration-300 ease-in-out motion-reduce:transition-none group relative rounded-xl',
                        isCollapsed
                          ? 'h-10 sm:h-[42px] px-3 lg:px-0 lg:justify-center lg:w-10 lg:mx-auto'
                          : 'h-10 sm:h-[42px] px-3 w-full justify-between',
                        active
                          ? role === 'faculty'
                            ? isCollapsed
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border-2 border-purple-600 shadow-2xs'
                              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border-l-[3px] border-purple-600 shadow-2xs'
                            : role === 'admin'
                            ? isCollapsed
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold border-2 border-red-600 shadow-2xs'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold border-l-[3px] border-red-600 shadow-2xs'
                            : isCollapsed
                            ? 'bg-primary-50/70 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 font-semibold border-2 border-primary-600 shadow-2xs'
                            : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold border-l-[3px] border-primary-600 shadow-2xs'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                      )}
                      onClick={() => onClose()}
                      onMouseEnter={(e) => {
                        if (isCollapsed) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredItem({
                            name: item.name,
                            badgeKey: item.badgeKey,
                            top: rect.top + rect.height / 2
                          })
                        }
                      }}
                      onMouseLeave={() => setHoveredItem(null)}
                      onFocus={(e) => {
                        if (isCollapsed) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredItem({
                            name: item.name,
                            badgeKey: item.badgeKey,
                            top: rect.top + rect.height / 2
                          })
                        }
                      }}
                      onBlur={() => setHoveredItem(null)}
                      aria-label={item.name}
                      title={!isCollapsed ? item.name : undefined}
                    >
                      <div className={cn(
                        "flex items-center min-w-0 flex-1 overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none",
                        isCollapsed ? "lg:justify-center lg:flex-none" : ""
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-200 ease-in-out group-hover:scale-105",
                          isCollapsed ? "mr-3 lg:mr-0" : "mr-3",
                          active
                            ? role === 'faculty'
                              ? "text-purple-600 dark:text-purple-400"
                              : role === 'admin'
                              ? "text-red-600 dark:text-red-400"
                              : "text-primary-600 dark:text-primary-400"
                            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                        )} />
                        
                        {/* Smoothly animated text label */}
                        <span 
                          aria-hidden={isCollapsed ? 'true' : undefined}
                          className={cn(
                            "truncate whitespace-nowrap transition-all duration-300 ease-in-out motion-reduce:transition-none",
                            isCollapsed 
                              ? "max-w-[160px] opacity-100 translate-x-0 lg:max-w-0 lg:opacity-0 lg:translate-x-2 lg:pointer-events-none" 
                              : "max-w-[160px] opacity-100 translate-x-0"
                          )}
                        >
                          {item.name}
                        </span>
                      </div>

                      {/* Full Live Badges (when expanded) */}
                      <div className={cn(
                        "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out motion-reduce:transition-none flex items-center flex-shrink-0",
                        isCollapsed 
                          ? "max-w-[80px] opacity-100 scale-100 ml-2 lg:max-w-0 lg:opacity-0 lg:scale-90 lg:ml-0 lg:pointer-events-none" 
                          : "max-w-[80px] opacity-100 scale-100 ml-2"
                      )}>
                        {item.badgeKey === 'placement' && pendingPlacementsCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold bg-amber-500 text-white rounded-full shadow-2xs animate-pulse">
                            {pendingPlacementsCount} Action
                          </span>
                        )}
                        {item.badgeKey === 'jobs' && jobCount > 0 && (
                          <span 
                            title={`${jobCount} available job listings`}
                            aria-label={`${jobCount} available jobs`}
                            className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md"
                          >
                            {jobCount}
                          </span>
                        )}
                      </div>

                      {/* Mini Indicator Dots (when collapsed on desktop) */}
                      {item.badgeKey === 'placement' && pendingPlacementsCount > 0 && (
                        <span 
                          className={cn(
                            "hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-gray-900 animate-pulse transition-all duration-300 ease-in-out",
                            isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
                          )} 
                        />
                      )}
                      {item.badgeKey === 'jobs' && jobCount > 0 && (
                        <span 
                          className={cn(
                            "hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900 transition-all duration-300 ease-in-out",
                            isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
                          )} 
                        />
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Floating Tooltip for Collapsed Desktop Navigation */}
        {isCollapsed && hoveredItem && (
          <div
            role="tooltip"
            className="hidden lg:flex items-center fixed z-50 px-2.5 py-1.5 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-xl border border-gray-700/60 whitespace-nowrap pointer-events-none -translate-y-1/2 transition-opacity duration-150 animate-fadeIn"
            style={{
              left: '88px',
              top: `${hoveredItem.top}px`
            }}
          >
            <span>{hoveredItem.name}</span>
            {hoveredItem.badgeKey === 'jobs' && jobCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded">
                {jobCount}
              </span>
            )}
            {hoveredItem.badgeKey === 'placement' && pendingPlacementsCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded">
                {pendingPlacementsCount} Action
              </span>
            )}
            {/* Tooltip arrow pointing left towards the icon */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45 border-l border-b border-gray-700/60" />
          </div>
        )}

        {/* Clearly discoverable desktop collapse/expand control */}
        <div className="p-2 border-t border-slate-100 dark:border-gray-800 hidden lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "flex items-center w-full p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer",
              isCollapsed ? "justify-center" : "justify-between"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              {isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              ) : (
                <>
                  <ChevronLeftIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300 truncate">Collapse sidebar</span>
                </>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                Toggle
              </span>
            )}
          </button>
        </div>

        {/* Clean Sidebar Footer */}
        <div className={cn(
          "h-12 px-3.5 border-t border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/40 flex items-center transition-all duration-300 ease-in-out motion-reduce:transition-none overflow-hidden",
          isCollapsed ? "justify-between lg:justify-center lg:px-0" : "justify-between"
        )}>
          <div 
            className={cn(
              "flex items-center min-w-0 transition-all duration-300 ease-in-out",
              isCollapsed ? "lg:justify-center" : "space-x-2"
            )} 
            title={role === 'faculty' ? 'Faculty Portal' : role === 'admin' ? 'Admin Console' : 'Student Portal'}
          >
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              role === 'faculty' ? 'bg-purple-500 ring-2 ring-purple-200 dark:ring-purple-900' : role === 'admin' ? 'bg-red-500 ring-2 ring-red-200 dark:ring-red-900' : 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900'
            } animate-pulse`} />
            
            <div 
              aria-hidden={isCollapsed ? 'true' : undefined}
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out motion-reduce:transition-none flex items-center justify-between min-w-0",
                isCollapsed ? "max-w-[160px] opacity-100 ml-2 lg:max-w-0 lg:opacity-0 lg:ml-0 lg:pointer-events-none" : "max-w-[160px] opacity-100 ml-2"
              )}
            >
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 truncate">
                {role === 'faculty' ? 'Faculty Portal' : role === 'admin' ? 'Admin Console' : 'Student Portal'}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-2 flex-shrink-0">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar