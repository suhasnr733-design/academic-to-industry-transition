// src/components/layout/Sidebar.jsx

import React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/helpers'
import {
  HomeIcon,
  DocumentIcon,
  BriefcaseIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CogIcon,
  XIcon
} from '@heroicons/react/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Resume', href: '/resume', icon: DocumentIcon },
  { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
  { name: 'Skills', href: '/skills', icon: ChartBarIcon },
  { name: 'Learning', href: '/learning', icon: AcademicCapIcon },
  { name: 'Faculty', href: '/faculty', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

export const Sidebar = ({ isOpen, onClose }) => {
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
          'fixed top-16 left-0 z-40 w-64 h-full bg-white shadow-lg transform transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button - mobile */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 lg:hidden"
        >
          <XIcon className="h-6 w-6" />
        </button>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200',
                  isActive && 'bg-primary-50 text-primary-600 font-medium'
                )
              }
              onClick={() => onClose()}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
              U
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">User Name</p>
              <p className="text-xs text-gray-500">Student</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}