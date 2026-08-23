// frontend/src/components/layout/RecommendedActionsDropdown.jsx

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecommendedActions } from '../../hooks/useRecommendedActions'
import {
  CheckCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ClipboardCheckIcon,
  UserCircleIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/solid'

export const RecommendedActionsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const {
    actions,
    advancedRecommendations,
    completedCount,
    totalCount,
    progressPercent,
    allCoreCompleted,
    pendingCount
  } = useRecommendedActions()

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getActionIcon = (id) => {
    switch (id) {
      case 'profile':
        return <UserCircleIcon className="w-5 h-5 text-blue-500" />
      case 'resume':
        return <DocumentTextIcon className="w-5 h-5 text-amber-500" />
      case 'assessment':
        return <AcademicCapIcon className="w-5 h-5 text-emerald-500" />
      default:
        return <SparklesIcon className="w-5 h-5 text-primary-500" />
    }
  }

  const handleActionClick = (link) => {
    setIsOpen(false)
    navigate(link)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Recommended Actions Menu"
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
          allCoreCompleted
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200 hover:shadow-md'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {!allCoreCompleted && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              allCoreCompleted ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
          ></span>
        </span>

        <span className="hidden sm:inline font-semibold">
          {allCoreCompleted ? 'Checklist: 100% Ready' : `Actions (${completedCount}/${totalCount})`}
        </span>
        <span className="sm:hidden font-semibold">
          {allCoreCompleted ? '✓ 100%' : `${completedCount}/${totalCount}`}
        </span>

        {allCoreCompleted ? (
          <CheckCircleSolid className="w-4 h-4 text-emerald-600 ml-0.5" />
        ) : (
          <SparklesIcon className="w-4 h-4 text-blue-600 ml-0.5" />
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 px-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                <ClipboardCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Career Readiness Actions</h3>
                <p className="text-xs text-gray-500">Track your essential profile setup</p>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                allCoreCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-primary-100 text-primary-800'
              }`}
            >
              {progressPercent}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3.5 mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
              <span>{completedCount} of {totalCount} completed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allCoreCompleted
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-primary-500 to-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {allCoreCompleted && (
              <p className="text-xs text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                <CheckCircleSolid className="w-3.5 h-3.5 text-emerald-600" />
                All onboarding steps completed!
              </p>
            )}
          </div>

          {/* Actions List */}
          <div className="space-y-2.5">
            {actions.map((action) => (
              <div
                key={action.id}
                onClick={() => handleActionClick(action.link)}
                className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  action.isCompleted
                    ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/80'
                    : 'bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {action.isCompleted ? (
                      <CheckCircleSolid className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <div className="p-1 rounded-md bg-white shadow-xs">
                        {getActionIcon(action.id)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-xs font-semibold ${
                          action.isCompleted ? 'text-emerald-950' : 'text-gray-900'
                        }`}
                      >
                        {action.title}
                      </p>
                      {action.isCompleted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.5 rounded">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                      {action.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`text-xs font-medium ml-2 shrink-0 flex items-center gap-0.5 ${
                    action.isCompleted
                      ? 'text-emerald-700 hover:text-emerald-800'
                      : 'text-primary-600 hover:text-primary-700 font-semibold'
                  }`}
                >
                  <span>{action.actionLabel}</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Additional Suggested Actions */}
          {allCoreCompleted && (
            <div className="mt-3.5 pt-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-500" /> Next Career Recommendations
              </p>
              <div className="grid grid-cols-2 gap-2">
                {advancedRecommendations.slice(0, 2).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleActionClick(item.link)}
                    className="p-2 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-700 text-left border border-gray-200/60 transition-all text-xs"
                  >
                    <p className="font-semibold text-gray-800 line-clamp-1">{item.title}</p>
                    <span className="text-[10px] text-primary-600 font-medium flex items-center gap-0.5 mt-1">
                      {item.actionLabel} &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-3.5 pt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Keep your profile up to date</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecommendedActionsDropdown
