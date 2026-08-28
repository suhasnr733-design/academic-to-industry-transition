// frontend/src/components/dashboard/WelcomeActionsModal.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useRecommendedActions } from '../../hooks/useRecommendedActions'
import { Button } from '../common/Button'
import {
  XIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ClipboardCheckIcon,
  BadgeCheckIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UserCircleIcon,
  OfficeBuildingIcon,
  ChartBarIcon
} from '@heroicons/react/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/solid'

export const WelcomeActionsModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const role = user?.role || 'student'
  const isFaculty = role === 'faculty'

  const {
    actions,
    advancedRecommendations,
    completedCount,
    totalCount,
    progressPercent,
    allCoreCompleted
  } = useRecommendedActions()

  useEffect(() => {
    // Check if user just logged in or if it's the first time visiting in this session
    const storageKey = isFaculty ? 'hide_faculty_login_action_popup' : 'hide_login_action_popup'
    const sessionKey = isFaculty ? 'faculty_login_action_popup_shown' : 'login_action_popup_shown'
    
    const hidePermanently = localStorage.getItem(storageKey) === 'true'
    const shownThisSession = sessionStorage.getItem(sessionKey) === 'true'
    const justLoggedIn = sessionStorage.getItem('just_logged_in') === 'true'

    if (!hidePermanently && (!shownThisSession || justLoggedIn)) {
      // Small timeout to allow page animation
      const timer = setTimeout(() => {
        setIsOpen(true)
        sessionStorage.setItem(sessionKey, 'true')
        sessionStorage.removeItem('just_logged_in')
      }, 600)

      return () => clearTimeout(timer)
    }
  }, [isFaculty])

  const handleClose = () => {
    const storageKey = isFaculty ? 'hide_faculty_login_action_popup' : 'hide_login_action_popup'
    if (dontShowAgain) {
      localStorage.setItem(storageKey, 'true')
    }
    setIsOpen(false)
  }

  const handleActionClick = (link) => {
    handleClose()
    navigate(link)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Decorative Banner */}
        <div className={`p-6 text-white relative ${
          isFaculty
            ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700'
            : 'bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600'
        }`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-white/90 text-xs font-semibold uppercase tracking-wider mb-1">
            {isFaculty ? (
              <>
                <AcademicCapIcon className="w-4 h-4 text-purple-200" />
                <span>Faculty Advisor Portal • TransitionAI</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 text-amber-300" />
                <span>Welcome to TransitionAI</span>
              </>
            )}
          </div>

          <h2 className="text-2xl font-bold">
            Hi, {user?.full_name || (isFaculty ? 'Faculty Advisor' : 'Student')} 👋
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {isFaculty
              ? 'Here is your faculty onboarding status & recommended next actions'
              : 'Here is your career readiness status & recommended next actions'}
          </p>

          {/* Progress Header Box */}
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/20">
            <div className="flex justify-between items-center text-xs font-medium mb-1.5">
              <span>Overall Onboarding Progress</span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-white/80 mt-1.5 flex items-center gap-1">
              {allCoreCompleted ? (
                <>
                  <CheckCircleSolid className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Awesome! All core actions completed.</span>
                </>
              ) : (
                <span>{completedCount} of {totalCount} key tasks completed</span>
              )}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <ClipboardCheckIcon className={`w-4 h-4 ${isFaculty ? 'text-purple-600' : 'text-primary-600'}`} />
              Recommended Actions
            </h3>
            <span className="text-xs text-gray-400">Available anytime in top bar</span>
          </div>

          <div className="space-y-2.5">
            {actions.map((action) => (
              <div
                key={action.id}
                onClick={() => handleActionClick(action.link)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  action.isCompleted
                    ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
                    : isFaculty
                    ? 'bg-gray-50/80 border-gray-200 hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-xs'
                    : 'bg-gray-50/80 border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="shrink-0">
                    {action.isCompleted ? (
                      <CheckCircleSolid className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-xs font-bold text-gray-400">
                        •
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${action.isCompleted ? 'text-emerald-950' : 'text-gray-900'}`}>
                        {action.title}
                      </p>
                      {action.isCompleted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </div>

                <div className="ml-3 shrink-0">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      action.isCompleted
                        ? 'bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200/70'
                        : isFaculty
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                    }`}
                  >
                    <span>{action.actionLabel}</span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick links to next steps if ready */}
          {allCoreCompleted && (
            <div className={`mt-4 p-4 rounded-2xl border ${
              isFaculty
                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
            }`}>
              <p className={`text-xs font-bold flex items-center gap-1.5 ${isFaculty ? 'text-purple-900' : 'text-blue-900'}`}>
                <SparklesIcon className={`w-4 h-4 ${isFaculty ? 'text-purple-600' : 'text-blue-600'}`} />
                {isFaculty ? 'Next Recommended Faculty Actions' : 'Next Recommended Career Steps'}
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {advancedRecommendations.slice(0, 2).map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => handleActionClick(rec.link)}
                    className="p-2.5 rounded-xl bg-white border border-gray-200/80 hover:border-purple-400 text-left transition-all text-xs shadow-xs"
                  >
                    <p className="font-bold text-gray-800 line-clamp-1">{rec.title}</p>
                    <span className={`text-[11px] font-medium ${isFaculty ? 'text-purple-600' : 'text-blue-600'}`}>
                      {rec.actionLabel} &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center space-x-2 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className={`rounded h-4 w-4 border-gray-300 cursor-pointer ${
                isFaculty ? 'text-purple-600 focus:ring-purple-500' : 'text-primary-600 focus:ring-primary-500'
              }`}
            />
            <span>Don't show this popup on login</span>
          </label>

          <Button
            size="sm"
            onClick={handleClose}
            className={`w-full sm:w-auto text-white ${
              isFaculty ? 'bg-purple-600 hover:bg-purple-700' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeActionsModal
