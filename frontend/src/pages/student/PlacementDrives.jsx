// frontend/src/pages/student/PlacementDrives.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useResume } from '../../hooks/useResume'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import { cn } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  OfficeBuildingIcon,
  SparklesIcon,
  CheckCircleIcon,
  XIcon,
  RefreshIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ClockIcon,
  ExclamationCircleIcon,
  SearchIcon,
  ExternalLinkIcon,
  LightBulbIcon,
  InformationCircleIcon
} from '@heroicons/react/outline'

export const PlacementDrives = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { resumes } = useResume()

  // Optimization 3: Hydrate student nominations from sessionStorage (0.00s render)
  const [nominations, setNominations] = useState(() => {
    try {
      const cached = sessionStorage.getItem('swr_student_placement_drives')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('swr_student_placement_drives')
      return !cached
    } catch {
      return true
    }
  })
  const [isRespondingNomination, setIsRespondingNomination] = useState(null)
  
  // Tabs & Filter State
  const [activeTab, setActiveTab] = useState('all') // 'all', 'pending', 'confirmed', 'placed', 'rejected'
  const [searchQuery, setSearchQuery] = useState('')

  // Decline Modal State
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineTargetNomination, setDeclineTargetNomination] = useState(null)
  const [declineReason, setDeclineReason] = useState('')

  const activeResume = resumes?.[0]
  const completedResume = resumes?.find((r) => r.status === 'completed') || activeResume

  useEffect(() => {
    fetchNominations()
  }, [])

  const fetchNominations = async () => {
    if (!nominations || nominations.length === 0) {
      setIsLoading(true)
    }
    try {
      const res = await api.get('/placement/my-nominations')
      const freshNoms = res.data?.nominations || []
      setNominations(freshNoms)

      // Optimization 3: Persist fresh drives in sessionStorage
      try {
        sessionStorage.setItem('swr_student_placement_drives', JSON.stringify(freshNoms))
      } catch {}
    } catch (err) {
      console.error('Error fetching placement nominations:', err)
      toast.error('Failed to load placement drives')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptNomination = async (nomination) => {
    try {
      setIsRespondingNomination(nomination.id)
      const res = await api.put(`/placement/nominations/${nomination.id}/respond`, {
        action: 'accept',
        response_note: 'Confirmed attendance for placement drive'
      })
      if (res.data?.success) {
        toast.success(
          `🎉 Attendance confirmed! You are registered for the ${nomination.company_name} placement drive.`,
          { duration: 6000 }
        )
        fetchNominations()
      }
    } catch (err) {
      console.error('Error confirming attendance:', err)
      toast.error(
        err.response?.data?.message || err.response?.data?.error || 'Failed to confirm attendance'
      )
    } finally {
      setIsRespondingNomination(null)
    }
  }

  const handleOpenDeclineModal = (nomination) => {
    setDeclineTargetNomination(nomination)
    setDeclineReason('')
    setShowDeclineModal(true)
  }

  const handleConfirmDecline = async () => {
    if (!declineTargetNomination) return
    try {
      setIsRespondingNomination(declineTargetNomination.id)
      const res = await api.put(`/placement/nominations/${declineTargetNomination.id}/respond`, {
        action: 'reject',
        response_note: declineReason.trim() || 'Declined drive invitation'
      })
      if (res.data?.success) {
        toast.info(`You have declined the invitation for ${declineTargetNomination.company_name}.`)
        setShowDeclineModal(false)
        fetchNominations()
      }
    } catch (err) {
      console.error('Error declining nomination:', err)
      toast.error(
        err.response?.data?.message || err.response?.data?.error || 'Failed to decline nomination'
      )
    } finally {
      setIsRespondingNomination(null)
    }
  }

  // Derived Counts
  const pendingList = nominations.filter((n) => n.status === 'pending')
  const confirmedList = nominations.filter((n) => n.status === 'confirmed_attending' || n.status === 'accepted')
  const placedList = nominations.filter((n) => n.status === 'placed')
  const rejectedList = nominations.filter((n) => n.status === 'rejected')

  // Filtered List
  const filteredNominations = nominations.filter((nom) => {
    // Tab filter
    if (activeTab === 'pending' && nom.status !== 'pending') return false
    if (activeTab === 'confirmed' && !(nom.status === 'confirmed_attending' || nom.status === 'accepted')) return false
    if (activeTab === 'placed' && nom.status !== 'placed') return false
    if (activeTab === 'rejected' && nom.status !== 'rejected') return false

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchCompany = nom.company_name?.toLowerCase().includes(q)
      const matchRole = nom.job_role?.toLowerCase().includes(q)
      const matchFaculty = nom.faculty?.full_name?.toLowerCase().includes(q)
      if (!matchCompany && !matchRole && !matchFaculty) return false
    }

    return true
  })

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20">
              <SparklesIcon className="h-4 w-4 text-amber-300" />
              <span>Student Career Suite • Placement Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Company Placement Drives & Invitations
            </h1>
            <p className="text-white/85 text-sm sm:text-base leading-relaxed">
              Manage your company campus invitations, coordinator shortlists, RSVP for upcoming recruitment drives, and track your hiring milestones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/25 backdrop-blur-sm shadow-sm"
              onClick={fetchNominations}
              disabled={isLoading}
            >
              <RefreshIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Drives
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-primary-700 hover:bg-gray-50 border-white shadow-sm font-bold"
              onClick={() => navigate('/resume/upload')}
            >
              <DocumentTextIcon className="h-4 w-4 mr-2 text-primary-600" />
              Update Resume
            </Button>
          </div>
        </div>

        {/* Ambient Decorative Background Circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-12 w-48 h-48 bg-secondary-400/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Drives */}
        <div 
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
            activeTab === 'all' ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-sm' : 'border-gray-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Drives</span>
            <div className="p-2.5 rounded-xl bg-gray-100 text-gray-700">
              <OfficeBuildingIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{nominations.length}</span>
            <span className="text-xs text-gray-500 ml-2">Shortlists</span>
          </div>
        </div>

        {/* Pending Action Required */}
        <div 
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
            activeTab === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm' : 'border-gray-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Action Required</span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <ClockIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{pendingList.length}</span>
            <span className="text-xs text-amber-700/80 ml-2 font-medium">Pending RSVP</span>
          </div>
        </div>

        {/* Confirmed Attending */}
        <div 
          onClick={() => setActiveTab('confirmed')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
            activeTab === 'confirmed' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' : 'border-gray-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Confirmed</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{confirmedList.length}</span>
            <span className="text-xs text-emerald-700/80 ml-2 font-medium">Attending Drives</span>
          </div>
        </div>

        {/* Officially Placed */}
        <div 
          onClick={() => setActiveTab('placed')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
            activeTab === 'placed' ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-sm' : 'border-gray-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Offers & Hired</span>
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <SparklesIcon className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-600">{placedList.length}</span>
            <span className="text-xs text-purple-700/80 ml-2 font-medium">Placed Offers</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'all'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <span>All Drives</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}>
              {nominations.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-400'
            )}
          >
            <span>⚡ Action Required</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === 'pending'
                ? 'bg-white text-amber-800 font-extrabold'
                : pendingList.length > 0
                ? 'bg-amber-500 text-white font-extrabold animate-pulse'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}>
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-400'
            )}
          >
            <span>✅ Attending</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === 'confirmed' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}>
              {confirmedList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('placed')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'placed'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-800 dark:hover:text-purple-400'
            )}
          >
            <span>🏆 Hired</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === 'placed' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}>
              {placedList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'rejected'
                ? 'bg-gray-700 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <span>Declined</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === 'rejected' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}>
              {rejectedList.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            disabled={nominations.length === 0}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={nominations.length === 0 ? "Search enabled when invitations arrive..." : "Search by company or role..."}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Placement Drives List Section */}
      <div className="space-y-4">
        {isLoading && nominations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <RefreshIcon className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Loading placement drive notifications...</p>
          </div>
        ) : filteredNominations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <OfficeBuildingIcon className="h-8 w-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {searchQuery
                  ? 'No drives match your search query'
                  : activeTab === 'pending'
                  ? 'No pending drive invitations requiring RSVP'
                  : activeTab === 'confirmed'
                  ? 'No confirmed drives yet'
                  : activeTab === 'placed'
                  ? 'No hired / placement records yet'
                  : !completedResume
                  ? 'Resume Required for Campus Drive Shortlisting'
                  : 'No placement drive invitations yet'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {nominations.length === 0
                  ? !completedResume
                    ? 'Upload your resume so department faculty and placement coordinators can verify your technical skills and shortlist you for upcoming campus recruitment drives.'
                    : 'Your profile and resume are active. Department coordinators will shortlist and invite you for matching campus hiring drives based on company requisitions.'
                  : 'Try selecting a different filter tab above or clearing your search keywords.'}
              </p>
            </div>

            {nominations.length === 0 && (
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Button
                  size="sm"
                  onClick={() => navigate('/jobs')}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <BriefcaseIcon className="h-4 w-4" />
                  Explore 20 Live Job Openings &rarr;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/resume/upload')}
                  className="text-xs flex items-center gap-1.5"
                >
                  <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                  {completedResume ? 'Update Resume' : 'Upload Resume'}
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-center gap-1">
              <span>Have questions about campus drive eligibility?</span>
              <button 
                onClick={() => navigate('/dashboard')}
                className="font-bold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5"
              >
                Connect with your Faculty Advisor &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNominations.map((nom) => {
              const isPending = nom.status === 'pending'
              const isConfirmed = nom.status === 'confirmed_attending' || nom.status === 'accepted'
              const isPlaced = nom.status === 'placed'
              const isRejected = nom.status === 'rejected'

              return (
                <div
                  key={nom.id}
                  className={`rounded-2xl p-6 border shadow-sm transition-all duration-200 relative overflow-hidden bg-white ${
                    isPending
                      ? 'border-amber-300 ring-1 ring-amber-300/50 hover:shadow-md'
                      : isPlaced
                      ? 'border-purple-300 bg-gradient-to-r from-purple-50/50 to-white hover:shadow-md'
                      : isConfirmed
                      ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/40 to-white hover:shadow-md'
                      : 'border-gray-200 hover:shadow-md opacity-85'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      {/* Company Icon Avatar */}
                      <div
                        className={`p-4 rounded-2xl flex-shrink-0 shadow-sm ${
                          isPending
                            ? 'bg-amber-500 text-white shadow-amber-500/20'
                            : isPlaced
                            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/25'
                            : isConfirmed
                            ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                            : 'bg-gray-400 text-white'
                        }`}
                      >
                        <OfficeBuildingIcon className="h-7 w-7" />
                      </div>

                      {/* Info & Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : isPlaced
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : isConfirmed
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-gray-200 text-gray-700 border border-gray-300'
                            }`}
                          >
                            {isPending
                              ? '⚡ Drive Invitation (RSVP Required)'
                              : isPlaced
                              ? '🏆 Officially Hired & Placed'
                              : isConfirmed
                              ? '✅ Registered & Attending Drive'
                              : 'Drive Invitation Declined'}
                          </span>

                          {nom.package_lpa && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              💰 ₹{nom.package_lpa} LPA CTC
                            </span>
                          )}

                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <ClockIcon className="h-3.5 w-3.5 text-amber-600" />
                              RSVP Pending
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                          {nom.company_name}
                          <span className="text-sm font-normal text-gray-500">
                            • {nom.job_role || 'Software Engineer'}
                          </span>
                        </h3>

                        <p className="text-xs text-gray-600">
                          Shortlisted by{' '}
                          <span className="font-semibold text-gray-800">
                            {nom.faculty?.full_name || 'Department Faculty'}
                          </span>{' '}
                          ({nom.faculty?.department || 'Coordinator'}) on{' '}
                          {new Date(nom.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>

                        {/* Coordinator Note */}
                        {nom.faculty_notes && (
                          <div className="mt-2 text-xs text-purple-950 bg-purple-50/90 border border-purple-200/80 rounded-xl p-3 max-w-2xl">
                            <span className="font-bold text-purple-900">Coordinator Note:</span> {nom.faculty_notes}
                          </div>
                        )}

                        {/* Confirmation State Feedback */}
                        {isConfirmed && !isPlaced && (
                          <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 max-w-2xl flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span>
                              You have confirmed attendance for this placement drive. Please keep your resume updated and check your inbox for test links & schedule details!
                            </span>
                          </div>
                        )}

                        {/* Placed Celebration Banner */}
                        {isPlaced && (
                          <div className="mt-2 text-xs text-purple-900 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-xl p-3 max-w-2xl flex items-center gap-2">
                            <SparklesIcon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <span className="font-semibold">
                              Congratulations! You have been marked as hired for {nom.company_name}.
                            </span>
                          </div>
                        )}

                        {/* Student Response Note */}
                        {nom.student_response_note && !isPending && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Your response note: "{nom.student_response_note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Interactive Action Area */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 self-end lg:self-center flex-shrink-0">
                      {isPending && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeclineModal(nom)}
                            disabled={isRespondingNomination === nom.id}
                            className="text-xs border-gray-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 flex items-center gap-1.5"
                          >
                            <XIcon className="h-4 w-4" />
                            Decline Invitation
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptNomination(nom)}
                            isLoading={isRespondingNomination === nom.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Confirm Attendance
                          </Button>
                        </>
                      )}

                      {isConfirmed && !isPlaced && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                            Attendance Confirmed
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/resume/upload')}
                            className="text-xs flex items-center gap-1"
                          >
                            <DocumentTextIcon className="h-3.5 w-3.5 text-gray-500" />
                            Resume Ready
                          </Button>
                        </div>
                      )}

                      {isPlaced && (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100 text-purple-900 font-bold text-xs border border-purple-300 shadow-sm">
                          <SparklesIcon className="h-4 w-4 text-amber-500" />
                          Officially Hired & Placed!
                        </span>
                      )}

                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-xs border border-gray-200">
                          <XIcon className="h-3.5 w-3.5 text-gray-500" />
                          Declined by Candidate
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Placement Preparation Tips & Roadmap */}
      <div className="bg-gradient-to-tr from-slate-50 to-blue-50/50 rounded-2xl p-6 border border-blue-100/80 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20 flex-shrink-0">
            <LightBulbIcon className="h-6 w-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-bold text-gray-900">
              Campus Drive Preparation Checklist
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ensure you are 100% prepared for online assessments and in-person interviews during placement season.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Resume Card */}
              <div 
                onClick={() => navigate('/resume')}
                className="cursor-pointer bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700 hover:border-primary-400 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-primary-600 transition-colors">
                      <DocumentTextIcon className="h-4 w-4 text-primary-600" />
                      Update Latest Resume
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                      completedResume ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {completedResume ? "Ready" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Keep ATS score high and highlight key tech projects.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-primary-600 group-hover:text-primary-700 mt-2 flex items-center gap-1">
                  Manage Resume &rarr;
                </span>
              </div>

              {/* Skill Gap Card */}
              <div 
                onClick={() => navigate('/skills')}
                className="cursor-pointer bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-emerald-600 transition-colors">
                      <AcademicCapIcon className="h-4 w-4 text-emerald-600" />
                      Review Skill Gaps
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      AI Benchmark
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Target high-frequency interview topics & libraries.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 group-hover:text-emerald-700 mt-2 flex items-center gap-1">
                  Analyze Gaps &rarr;
                </span>
              </div>

              {/* Assessment Card */}
              <div 
                onClick={() => navigate('/assessment')}
                className="cursor-pointer bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-amber-600 transition-colors">
                      <SparklesIcon className="h-4 w-4 text-amber-500" />
                      Practice Assessments
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Adaptive Test
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Take adaptive multiple-choice technical practice tests.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-amber-600 group-hover:text-amber-700 mt-2 flex items-center gap-1">
                  Start Test &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decline Invitation Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ExclamationCircleIcon className="h-5 w-5 text-rose-500" />
                Decline Placement Drive
              </h3>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to decline the invitation for{' '}
              <strong className="text-gray-900">{declineTargetNomination?.company_name}</strong> (
              {declineTargetNomination?.job_role || 'Software Engineer'})?
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Reason / Note for Faculty Coordinator (Optional):
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Prior commitment, accepted other offer, or target domain mismatch..."
                rows={3}
                className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeclineModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDecline}
                isLoading={isRespondingNomination === declineTargetNomination?.id}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlacementDrives
