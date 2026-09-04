// src/components/layout/Sidebar.jsx

import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
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
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, shortcut: '⌘1' },
      { name: 'Career Analytics', href: '/dashboard/advanced', icon: TrendingUpIcon, shortcut: '⌘2' },
    ]
  },
  {
    title: 'Career Opportunities',
    items: [
      { name: 'Job Matches', href: '/jobs', icon: BriefcaseIcon, badgeKey: 'jobs', shortcut: '⌘J' },
      { name: 'Placement Drives', href: '/placements', icon: OfficeBuildingIcon, badgeKey: 'placement', shortcut: '⌘P' },
      { name: 'Resume Hub', href: '/resume', icon: DocumentTextIcon, shortcut: '⌘R' },
    ]
  },
  {
    title: 'Skill & Learning',
    items: [
      { name: 'Skill Gap Analysis', href: '/skills', icon: ChartBarIcon, shortcut: '⌘S' },
      { name: 'Learning Roadmap', href: '/learning', icon: AcademicCapIcon, shortcut: '⌘L' },
      { name: 'Assessments', href: '/assessment', icon: ClipboardListIcon, shortcut: '⌘A' },
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
  const navigate = useNavigate()
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

  const displayName = user?.full_name || user?.username || 'User'
  const avatarLetter = (displayName[0] || 'U').toUpperCase()
  const usernameHandle = user?.username ? `@${user.username}` : (role === 'faculty' ? 'Faculty Advisor' : role === 'admin' ? 'Administrator' : 'Student Candidate')

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container (Linear / Vercel Dark Theme Aesthetic) */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-[#0F172A] border-r border-slate-800/80 flex flex-col justify-between shadow-2xl transition-all duration-300 select-none',
          isCollapsed ? 'w-64 lg:w-20' : 'w-64',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Close Sidebar"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Categorized Navigation Sections */}
        <div className="p-3 overflow-y-auto flex-1 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section, sIdx) => (
            <div key={section.title} className={cn("space-y-1", sIdx > 0 ? "pt-2 border-t border-slate-800/50" : "")}>
              {/* Section title (hidden when collapsed on desktop) */}
              <div className={cn(
                "text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-3 py-1 transition-all duration-200",
                isCollapsed ? "px-3 lg:hidden" : "px-3"
              )}>
                {section.title}
              </div>

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const active = isItemActive(item.href)

                  // Role-tailored active style
                  const activeClass = role === 'faculty'
                    ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/10 to-transparent text-white font-bold border-purple-500/40 shadow-xs'
                    : role === 'admin'
                    ? 'bg-gradient-to-r from-red-500/20 via-orange-500/10 to-transparent text-white font-bold border-red-500/40 shadow-xs'
                    : 'bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent text-white font-bold border-indigo-500/40 shadow-xs'

                  const iconColor = active
                    ? role === 'faculty'
                      ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      : role === 'admin'
                      ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      : 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                    : 'text-slate-400 group-hover:text-slate-200'

                  const activeIndicatorColor = role === 'faculty'
                    ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                    : role === 'admin'
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'

                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center rounded-xl text-xs transition-all duration-200 group relative border',
                        isCollapsed
                          ? 'justify-between px-3 py-2 lg:w-11 lg:h-11 lg:p-0 lg:mx-auto lg:justify-center'
                          : 'justify-between px-3 py-2',
                        active
                          ? activeClass
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent hover:border-slate-700/40'
                      )}
                      onClick={() => onClose()}
                      title={item.name}
                    >
                      {/* Active Left Indicator Bar */}
                      {active && (
                        <div className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full",
                          activeIndicatorColor
                        )} />
                      )}

                      <div className={cn(
                        "flex items-center min-w-0",
                        isCollapsed ? "lg:justify-center" : ""
                      )}>
                        <item.icon className={cn(
                          "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isCollapsed ? "mr-2.5 lg:mr-0" : "mr-2.5",
                          iconColor
                        )} />
                        
                        {/* Text label */}
                        <span className={cn(
                          "truncate font-medium tracking-tight transition-all duration-200",
                          active ? "font-bold text-white" : "text-slate-300 group-hover:text-white",
                          isCollapsed ? "inline lg:hidden" : "inline"
                        )}>
                          {item.name}
                        </span>
                      </div>

                      {/* Badges (Expanded state) */}
                      <div className={cn(isCollapsed ? "lg:hidden" : "inline-flex items-center gap-1.5")}>
                        {item.badgeKey === 'placement' && pendingPlacementsCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full shadow-xs animate-pulse ml-1.5 flex-shrink-0">
                            {pendingPlacementsCount} Action
                          </span>
                        )}
                        {item.badgeKey === 'jobs' && jobCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full shadow-xs ml-1.5 flex-shrink-0">
                            {jobCount}
                          </span>
                        )}
                      </div>

                      {/* Mini Badge Dots (Collapsed on desktop) */}
                      {isCollapsed && item.badgeKey === 'placement' && pendingPlacementsCount > 0 && (
                        <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0F172A] animate-pulse" />
                      )}
                      {isCollapsed && item.badgeKey === 'jobs' && jobCount > 0 && (
                        <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0F172A]" />
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Profile & Status Card (Linear / Clerk Aesthetic) */}
        <div className={cn(
          "p-2.5 border-t border-slate-800/80 bg-[#111827]/90 transition-all duration-300",
          isCollapsed ? "lg:p-2 lg:flex lg:justify-center" : "p-3"
        )}>
          <div className={cn(
            "flex items-center justify-between gap-2",
            isCollapsed ? "lg:justify-center" : "w-full"
          )}>
            <div 
              onClick={() => navigate('/profile')}
              className={cn(
                "flex items-center space-x-2.5 min-w-0 cursor-pointer group rounded-xl hover:bg-slate-800/60 transition-colors",
                isCollapsed ? "p-1 lg:p-1 lg:justify-center" : "p-1 flex-1"
              )}
              title={displayName}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-md ${
                  role === 'faculty' 
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' 
                    : role === 'admin' 
                    ? 'bg-gradient-to-tr from-red-600 to-orange-600' 
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                }`}>
                  {avatarLetter}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#111827] rounded-full" title="Online" />
              </div>

              <div className={cn(
                "min-w-0 flex-1 transition-all duration-200",
                isCollapsed ? "hidden lg:hidden" : "block"
              )}>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate leading-tight mt-0.5">
                  {usernameHandle}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className={cn(
                "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors",
                isCollapsed ? "hidden lg:hidden" : "block"
              )}
              title="Settings"
            >
              <CogIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar