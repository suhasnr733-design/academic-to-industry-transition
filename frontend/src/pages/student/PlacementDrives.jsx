// frontend/src/pages/student/PlacementDrives.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

  // Hydrate student nominations from sessionStorage
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
    if (activeTab === 'pending' && nom.status !== 'pending') return false
    if (activeTab === 'confirmed' && !(nom.status === 'confirmed_attending' || nom.status === 'accepted')) return false
    if (activeTab === 'placed' && nom.status !== 'placed') return false
    if (activeTab === 'rejected' && nom.status !== 'rejected') return false

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
    <div className="max-w-7xl mx-auto space-y-7 pb-16 px-2 sm:px-4">
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-xl shadow-indigo-500/5">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <SparklesIcon className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Campus Placement Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Company Drives & Invitations
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Track your campus invitations, review coordinator shortlists, RSVP for upcoming corporate recruitment drives, and manage your offers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchNominations}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#1E293B]/70 hover:bg-[#1E293B] border border-gray-700 transition-all active:scale-95"
            >
              <RefreshIcon className={`h-4 w-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh Drives</span>
            </button>
            <button
              onClick={() => navigate('/resume/upload')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <DocumentTextIcon className="h-4 w-4 text-white" />
              <span>Update Resume</span>
            </button>
          </div>
        </div>

        {/* Ambient Glows */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Drives */}
        <div 
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#111827] border transition-all duration-200 hover:border-gray-700 hover:-translate-y-0.5 ${
            activeTab === 'all' ? 'border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-md shadow-indigo-500/5' : 'border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Drives</span>
            <div className="p-2 rounded-xl bg-gray-800 text-gray-300">
              <OfficeBuildingIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{nominations.length}</span>
            <span className="text-xs text-gray-400">Shortlists</span>
          </div>
        </div>

        {/* Action Required */}
        <div 
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#111827] border transition-all duration-200 hover:border-amber-500/40 hover:-translate-y-0.5 ${
            activeTab === 'pending' ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-amber-500/5' : 'border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Action Required</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ClockIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">{pendingList.length}</span>
            <span className="text-xs text-amber-300/80">Pending RSVP</span>
          </div>
        </div>

        {/* Confirmed Attending */}
        <div 
          onClick={() => setActiveTab('confirmed')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#111827] border transition-all duration-200 hover:border-emerald-500/40 hover:-translate-y-0.5 ${
            activeTab === 'confirmed' ? 'border-emerald-500/60 ring-1 ring-emerald-500/30 bg-emerald-500/5' : 'border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Confirmed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircleIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{confirmedList.length}</span>
            <span className="text-xs text-emerald-300/80">Attending</span>
          </div>
        </div>

        {/* Offers & Placed */}
        <div 
          onClick={() => setActiveTab('placed')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#111827] border transition-all duration-200 hover:border-purple-500/40 hover:-translate-y-0.5 ${
            activeTab === 'placed' ? 'border-purple-500/60 ring-1 ring-purple-500/30 bg-purple-500/5' : 'border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Hired & Offers</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <SparklesIcon className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400">{placedList.length}</span>
            <span className="text-xs text-purple-300/80">Offers</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111827] p-3 rounded-2xl border border-gray-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: 'all', label: 'All Drives', count: nominations.length },
            { key: 'pending', label: '⚡ Action Required', count: pendingList.length, highlight: pendingList.length > 0 },
            { key: 'confirmed', label: '✅ Attending', count: confirmedList.length },
            { key: 'placed', label: '🏆 Hired', count: placedList.length },
            { key: 'rejected', label: 'Declined', count: rejectedList.length }
          ].map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border",
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#1E293B]/40 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : tab.highlight 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-gray-800 text-gray-400'
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            disabled={nominations.length === 0}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company or role..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-[#1E293B]/60 border border-gray-700 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-0.5"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Placement Drives List Feed */}
      <div className="space-y-4">
        {isLoading && nominations.length === 0 ? (
          <div className="bg-[#111827] rounded-3xl p-12 text-center border border-gray-800">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-gray-400">Loading placement drive notifications...</p>
          </div>
        ) : filteredNominations.length === 0 ? (
          <div className="bg-[#111827] rounded-3xl p-8 sm:p-12 text-center border border-gray-800 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <OfficeBuildingIcon className="h-8 w-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">
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
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                {nominations.length === 0
                  ? !completedResume
                    ? 'Upload your resume so department faculty and placement coordinators can verify your technical skills and shortlist you for upcoming campus recruitment drives.'
                    : 'Your profile and resume are active. Department coordinators will shortlist and invite you for matching campus hiring drives based on company requisitions.'
                  : 'Try selecting a different filter tab above or clearing your search keywords.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/jobs')}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <BriefcaseIcon className="h-4 w-4" />
                <span>Explore Live Job Openings</span>
              </button>
              <button
                onClick={() => navigate('/resume/upload')}
                className="px-4 py-2 text-xs font-semibold text-gray-300 bg-[#1E293B] hover:bg-gray-800 rounded-xl border border-gray-700 transition-all flex items-center gap-1.5"
              >
                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                <span>{completedResume ? 'Update Resume' : 'Upload Resume'}</span>
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
                  className={`rounded-3xl p-5 sm:p-6 border transition-all duration-200 relative overflow-hidden bg-[#111827] ${
                    isPending
                      ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-md shadow-amber-500/5'
                      : isPlaced
                      ? 'border-purple-500/40 bg-gradient-to-r from-purple-950/20 to-[#111827] shadow-md shadow-purple-500/5'
                      : isConfirmed
                      ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 to-[#111827] shadow-md shadow-emerald-500/5'
                      : 'border-gray-800 opacity-80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      {/* Company Icon Avatar */}
                      <div
                        className={`p-4 rounded-2xl flex-shrink-0 ${
                          isPending
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : isPlaced
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            : isConfirmed
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        <OfficeBuildingIcon className="h-7 w-7" />
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                              isPending
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                                : isPlaced
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : isConfirmed
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
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
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                              💰 ₹{nom.package_lpa} LPA CTC
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                          {nom.company_name}
                          <span className="text-sm font-normal text-gray-400">
                            • {nom.job_role || 'Software Engineer'}
                          </span>
                        </h3>

                        <p className="text-xs text-gray-400">
                          Shortlisted by{' '}
                          <span className="font-semibold text-gray-200">
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
                          <div className="mt-2 text-xs text-purple-200 bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 max-w-2xl">
                            <span className="font-bold text-purple-300">Coordinator Note:</span> {nom.faculty_notes}
                          </div>
                        )}

                        {/* Confirmation State Feedback */}
                        {isConfirmed && !isPlaced && (
                          <div className="mt-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 max-w-2xl flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            <span>
                              You have confirmed attendance for this placement drive. Check your inbox for assessment links and schedule details.
                            </span>
                          </div>
                        )}

                        {/* Placed Celebration Banner */}
                        {isPlaced && (
                          <div className="mt-2 text-xs text-purple-200 bg-purple-950/40 border border-purple-500/40 rounded-xl p-3 max-w-2xl flex items-center gap-2">
                            <SparklesIcon className="h-4 w-4 text-amber-400 flex-shrink-0" />
                            <span className="font-semibold">
                              Congratulations! You have received a formal offer and are placed at {nom.company_name}.
                            </span>
                          </div>
                        )}

                        {nom.student_response_note && !isPending && (
                          <p className="text-xs text-gray-400 italic mt-1">
                            Your response: "{nom.student_response_note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Interactive Action Area */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 self-end lg:self-center flex-shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleOpenDeclineModal(nom)}
                            disabled={isRespondingNomination === nom.id}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            <XIcon className="h-4 w-4" />
                            <span>Decline</span>
                          </button>
                          <button
                            onClick={() => handleAcceptNomination(nom)}
                            disabled={isRespondingNomination === nom.id}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Confirm Attendance</span>
                          </button>
                        </>
                      )}

                      {isConfirmed && !isPlaced && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                            <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                            Attendance Confirmed
                          </span>
                        </div>
                      )}

                      {isPlaced && (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/15 text-purple-300 font-bold text-xs border border-purple-500/30 shadow-sm">
                          <SparklesIcon className="h-4 w-4 text-amber-400" />
                          Officially Hired
                        </span>
                      )}

                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 text-gray-400 font-medium text-xs border border-gray-700">
                          <XIcon className="h-3.5 w-3.5 text-gray-400" />
                          Declined
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

      {/* 5. Campus Drive Preparation Checklist */}
      <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex-shrink-0">
            <LightBulbIcon className="h-6 w-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-bold text-white">
              Campus Drive Preparation Checklist
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Ensure you are 100% prepared for online assessments and in-person interviews during placement season.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Resume Card */}
              <div 
                onClick={() => navigate('/resume')}
                className="cursor-pointer bg-[#1E293B]/50 hover:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
                      <DocumentTextIcon className="h-4 w-4 text-indigo-400" />
                      Update Resume
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                      completedResume ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    )}>
                      {completedResume ? "Ready" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Keep ATS score high and highlight key tech projects.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300 mt-2 flex items-center gap-1">
                  Manage Resume &rarr;
                </span>
              </div>

              {/* Skill Gap Card */}
              <div 
                onClick={() => navigate('/skills')}
                className="cursor-pointer bg-[#1E293B]/50 hover:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-300 transition-colors">
                      <AcademicCapIcon className="h-4 w-4 text-emerald-400" />
                      Review Skill Gaps
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      AI Matrix
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Target high-frequency interview topics & libraries.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 mt-2 flex items-center gap-1">
                  Analyze Gaps &rarr;
                </span>
              </div>

              {/* Assessment Card */}
              <div 
                onClick={() => navigate('/assessment')}
                className="cursor-pointer bg-[#1E293B]/50 hover:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-amber-300 transition-colors">
                      <SparklesIcon className="h-4 w-4 text-amber-400" />
                      Practice Assessments
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      Adaptive Test
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Take adaptive technical practice tests.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-amber-400 group-hover:text-amber-300 mt-2 flex items-center gap-1">
                  Start Test &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decline Invitation Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111827] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ExclamationCircleIcon className="h-5 w-5 text-rose-400" />
                Decline Placement Drive
              </h3>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to decline the invitation for{' '}
              <strong className="text-white">{declineTargetNomination?.company_name}</strong> (
              {declineTargetNomination?.job_role || 'Software Engineer'})?
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Reason / Note for Faculty Coordinator (Optional):
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Accepted other offer, prior commitment, or domain mismatch..."
                rows={3}
                className="w-full text-xs p-3 bg-[#1E293B] border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecline}
                disabled={isRespondingNomination === declineTargetNomination?.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-95"
              >
                Confirm Decline
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default PlacementDrives
