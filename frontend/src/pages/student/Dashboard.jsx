// src/pages/student/Dashboard.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useResume } from '../../hooks/useResume'
import { useJobs } from '../../hooks/useJobs'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import { WelcomeActionsModal } from '../../components/dashboard/WelcomeActionsModal'
import toast from 'react-hot-toast'
import {
  DocumentIcon,
  BriefcaseIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  LocationMarkerIcon,
  OfficeBuildingIcon,
  SparklesIcon,
  RefreshIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XIcon,
  MailIcon
} from '@heroicons/react/outline'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { resumes, fetchResumes } = useResume()
  const { jobs, isLoading: jobsLoading } = useJobs()

  const [jobCount, setJobCount] = useState(0)
  const [skillGapCount, setSkillGapCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Mentorship & Advisor State
  const [advisorData, setAdvisorData] = useState({ has_advisor: false, advisor: null, requests: [] })
  const [facultyList, setFacultyList] = useState([])
  const [showAdvisorModal, setShowAdvisorModal] = useState(false)
  const [selectedFacultyForRequest, setSelectedFacultyForRequest] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  // Company Placement Nominations State
  const [nominations, setNominations] = useState([])
  const [isRespondingNomination, setIsRespondingNomination] = useState(null)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineTargetNomination, setDeclineTargetNomination] = useState(null)
  const [declineReason, setDeclineReason] = useState('')

  // 1. Compute dynamic profile completeness
  const profileFields = ['full_name', 'email', 'department', 'year_of_study']
  const filledFields = profileFields.filter((f) => Boolean(user?.[f]))
  const profilePercentage = Math.round((filledFields.length / profileFields.length) * 100)

  // 2. Determine active resume
  const latestResume = resumes?.[0]
  const completedResume = resumes?.find((r) => r.status === 'completed') || latestResume

  // 3. Automatically trigger processing for pending resumes & poll status
  useEffect(() => {
    if (!latestResume) return

    if (latestResume.status === 'pending') {
      api.post(`/resume/${latestResume.id}/process`)
        .catch(() => {})
        .finally(() => {
          setIsProcessing(true)
        })
    }

    if (latestResume.status === 'processing' || latestResume.status === 'pending') {
      setIsProcessing(true)
      const timer = setInterval(() => {
        if (fetchResumes) fetchResumes()
      }, 3000)
      return () => clearInterval(timer)
    } else {
      setIsProcessing(false)
    }
  }, [latestResume?.status, latestResume?.id])

  // 4. Fetch jobs, metrics, advisor & company nominations
  useEffect(() => {
    fetchDashboardMetrics()
    fetchAdvisorDetails()
    fetchNominations()
  }, [completedResume?.id, completedResume?.status])

  const fetchDashboardMetrics = async () => {
    try {
      const jobsRes = await api.get('/jobs')
      const jobsList = jobsRes.data?.jobs || []
      setJobCount(jobsList.length)

      if (completedResume && completedResume.status === 'completed') {
        if (completedResume.skills && completedResume.skills.length > 0) {
          const missing = Math.max(1, 8 - completedResume.skills.length)
          setSkillGapCount(completedResume.skill_gaps?.length || missing)
        } else {
          setSkillGapCount(0)
        }
      } else {
        setSkillGapCount(0)
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err)
    }
  }

  const fetchAdvisorDetails = async () => {
    try {
      const res = await api.get('/mentorship/my-advisor')
      setAdvisorData(res.data)
    } catch (err) {
      console.error('Error fetching advisor details:', err)
    }
  }

  const fetchNominations = async () => {
    try {
      const res = await api.get('/placement/my-nominations')
      setNominations(res.data?.nominations || [])
    } catch (err) {
      console.error('Error fetching placement nominations:', err)
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
          `🎉 Attendance confirmed! You are registered to attend the ${nomination.company_name} placement drive.`,
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
        response_note: declineReason.trim()
      })
      if (res.data?.success) {
        toast.info(`You have declined the invitation for ${declineTargetNomination.company_name}.`)
        setShowDeclineModal(false)
        fetchNominations()
      }
    } catch (err) {
      console.error('Error declining nomination:', err)
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to decline')
    } finally {
      setIsRespondingNomination(null)
    }
  }

  const handleOpenAdvisorModal = async () => {
    try {
      setShowAdvisorModal(true)
      const res = await api.get('/mentorship/faculty-list')
      setFacultyList(res.data?.faculty || [])
    } catch (err) {
      toast.error('Failed to load faculty advisors')
    }
  }

  const handleSendMentorshipRequest = async (facultyId) => {
    try {
      setIsSubmittingRequest(true)
      await api.post('/mentorship/request', {
        faculty_id: facultyId,
        message: requestMessage
      })
      toast.success('Mentorship request sent successfully!')
      setSelectedFacultyForRequest(null)
      setRequestMessage('')
      fetchAdvisorDetails()
      
      // Update local faculty list status
      setFacultyList(prev => prev.map(f => f.id === facultyId ? { ...f, request_status: 'pending' } : f))
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to send request')
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  // 5. Dynamic Stats Calculation
  const resumeScoreValue = completedResume
    ? completedResume.status === 'completed' && completedResume.employability_score != null
      ? `${Math.round(completedResume.employability_score)}%`
      : completedResume.status === 'processing'
      ? 'Processing...'
      : 'Pending'
    : '0%'

  const stats = [
    {
      name: 'Resume Score',
      value: resumeScoreValue,
      icon: DocumentIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: completedResume?.status === 'completed' ? 'Calculated from AI parsing' : 'Upload or process resume'
    },
    {
      name: 'Available Jobs',
      value: `${jobCount}`,
      icon: BriefcaseIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
      description: 'Active matching openings'
    },
    {
      name: 'Skills Extracted',
      value: `${completedResume?.skills?.length || 0}`,
      icon: ChartBarIcon,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      description: completedResume?.skills?.length ? 'Extracted from your resume' : 'No skills extracted yet'
    },
    {
      name: 'Resumes Uploaded',
      value: `${resumes?.length || 0}`,
      icon: AcademicCapIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      description: 'Total active versions'
    },
  ]

  const handleProcessResume = async (e, resumeId) => {
    e.stopPropagation()
    try {
      setIsProcessing(true)
      await api.post(`/resume/${resumeId}/process`)
      if (fetchResumes) fetchResumes()
    } catch (err) {
      console.error('Process resume error:', err)
    }
  }

  const activePendingRequest = advisorData.requests?.find(r => r.status === 'pending')

  return (
    <div className="space-y-8">
      {/* Login Welcome Modal Popup */}
      <WelcomeActionsModal />

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.full_name || 'Student'} 👋
            </h1>
            <p className="mt-2 text-white/85 text-sm sm:text-base">
              Track your employability insights, resume updates, and top industry job matches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {resumes?.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm"
                onClick={() => fetchResumes && fetchResumes()}
              >
                <RefreshIcon className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm"
              onClick={() => navigate('/resume/upload')}
            >
              Upload Resume
            </Button>
          </div>
        </div>
      </div>

      {/* Placement Drive Nominations / Offers Section */}
      {nominations && nominations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-amber-500" />
              Company Placement Drive Invitations & Shortlists
            </h2>
            <span className="text-xs text-gray-500">
              {nominations.filter((n) => n.status === 'pending').length} Action Required
            </span>
          </div>

          <div className="space-y-3">
            {nominations.map((nom) => {
              const isPending = nom.status === 'pending'
              const isConfirmed = nom.status === 'confirmed_attending' || nom.status === 'accepted'
              const isPlaced = nom.status === 'placed'
              const isRejected = nom.status === 'rejected'

              return (
                <div
                  key={nom.id}
                  className={`rounded-2xl p-6 border shadow-md transition-all relative overflow-hidden ${
                    isPending
                      ? 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-amber-300 bg-white'
                      : isPlaced
                      ? 'bg-purple-50/80 border-purple-300 bg-white'
                      : isConfirmed
                      ? 'bg-emerald-50/70 border-emerald-300 bg-white'
                      : 'bg-gray-50 border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3.5 rounded-2xl flex-shrink-0 ${
                          isPending
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                            : isPlaced
                            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                            : isConfirmed
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-gray-400 text-white'
                        }`}
                      >
                        <OfficeBuildingIcon className="h-7 w-7" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
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
                        </div>

                        <h3 className="text-xl font-extrabold text-gray-900 mt-1.5 flex items-center gap-2">
                          {nom.company_name}
                          <span className="text-sm font-normal text-gray-500">
                            • {nom.job_role || 'Software Engineer'}
                          </span>
                        </h3>

                        <p className="text-xs text-gray-600 mt-1">
                          Shortlisted by{' '}
                          <span className="font-semibold text-gray-800">
                            {nom.faculty?.full_name || 'Faculty Advisor'}
                          </span>{' '}
                          ({nom.faculty?.department || 'Faculty'}) on{' '}
                          {new Date(nom.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>

                        {nom.faculty_notes && (
                          <div className="mt-2.5 text-xs text-purple-900 bg-purple-50/80 border border-purple-200/80 rounded-xl p-2.5 max-w-2xl">
                            <span className="font-semibold">Coordinator Note:</span> {nom.faculty_notes}
                          </div>
                        )}

                        {isConfirmed && !isPlaced && (
                          <p className="text-xs text-emerald-700 mt-2 font-medium">
                            ✓ You have confirmed attendance for this placement drive. Please keep your resume updated!
                          </p>
                        )}

                        {nom.student_response_note && !isPending && (
                          <p className="text-xs text-gray-500 mt-1.5 italic">
                            Your response: "{nom.student_response_note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Decision Actions */}
                    {isPending && (
                      <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
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
                      </div>
                    )}

                    {isConfirmed && !isPlaced && (
                      <div className="self-end md:self-center flex-shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                          <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                          Attendance Confirmed
                        </span>
                      </div>
                    )}

                    {isPlaced && (
                      <div className="self-end md:self-center flex-shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-100 text-purple-900 font-bold text-xs border border-purple-300">
                          <SparklesIcon className="h-4 w-4 text-amber-500" />
                          Officially Hired & Placed!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Profile & Mentorship Grid Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completeness Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Profile Readiness</span>
              <span className="text-sm font-bold text-primary-600">{profilePercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${profilePercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {profilePercentage < 100
                ? 'Complete remaining profile information for higher job match relevance.'
                : 'Your profile is fully configured!'}
            </p>
          </div>
          {profilePercentage < 100 && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => navigate('/profile')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Complete Profile &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Academic Advisor & Mentorship Card */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <AcademicCapIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Academic & Career Mentorship</h3>
                <p className="text-xs text-gray-500">Connect with faculty advisors for career guidance and resume reviews.</p>
              </div>
            </div>

            {advisorData.has_advisor ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 self-start sm:self-auto">
                <CheckCircleIcon className="h-4 w-4 mr-1 text-green-600" />
                Assigned Advisor
              </span>
            ) : activePendingRequest ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 self-start sm:self-auto">
                <ClockIcon className="h-4 w-4 mr-1 text-amber-600" />
                Request Pending
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 self-start sm:self-auto">
                No Advisor Assigned
              </span>
            )}
          </div>

          <div className="py-2">
            {advisorData.has_advisor && advisorData.advisor?.faculty ? (
              <div className="flex items-center justify-between p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {advisorData.advisor.faculty.full_name?.[0] || 'P'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {advisorData.advisor.faculty.full_name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {advisorData.advisor.faculty.department} • {advisorData.advisor.faculty.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                  Active Mentorship
                </span>
              </div>
            ) : activePendingRequest && activePendingRequest.faculty ? (
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    Mentorship Request Sent to {activePendingRequest.faculty.full_name}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Waiting for the faculty advisor to review and accept your mentorship request.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleOpenAdvisorModal}
                  className="bg-white text-xs border-amber-200"
                >
                  Change / View
                </Button>
              </div>
            ) : (
              <p className="text-xs text-gray-600 leading-relaxed">
                Connect with a faculty member in your department to get personalized resume endorsements, skill development recommendations, and placement guidance.
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Department Faculty Network</span>
            <Button
              size="sm"
              onClick={handleOpenAdvisorModal}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              <UserGroupIcon className="h-4 w-4 mr-1.5" />
              {advisorData.has_advisor ? 'View Faculty Directory' : 'Find Faculty Advisor'}
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100/80"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Resumes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DocumentIcon className="w-5 h-5 text-primary-600" />
                Recent Resumes
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/resume')}>View All</Button>
            </div>

            {resumes && resumes.length > 0 ? (
              <div className="space-y-3">
                {resumes.slice(0, 3).map((resume) => (
                  <div
                    key={resume.id}
                    onClick={() => navigate(`/resume/${resume.id}`)}
                    className="flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-primary-50/40 rounded-xl cursor-pointer border border-gray-100 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-white shadow-xs">
                        <DocumentIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-xs">
                          {resume.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(resume.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        resume.status === 'completed' ? 'bg-green-100 text-green-800' :
                        resume.status === 'processing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                        resume.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {resume.status}
                      </span>
                      {resume.status === 'pending' && (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={(e) => handleProcessResume(e, resume.id)}
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-gray-500 text-sm">No resumes uploaded yet</p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/resume/upload')}>Upload Resume</Button>
              </div>
            )}
          </div>
          {resumes?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 text-right">
              <button 
                onClick={() => navigate('/resume/upload')} 
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                + Upload another resume
              </button>
            </div>
          )}
        </div>

        {/* Top Matched Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-primary-600" />
                Top Matched Jobs
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>View All</Button>
            </div>

            {jobs && jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-primary-50/40 rounded-xl cursor-pointer border border-gray-100 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-white shadow-xs mt-0.5">
                        <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{job.company || 'Industry Partner'}</span>
                          {job.location && (
                            <>
                              <span>•</span>
                              <span>{job.location}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {job.job_type || 'Full Time'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                <BriefcaseIcon className="h-10 w-10 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm font-medium text-gray-800">Explore career opportunities</p>
                <p className="text-xs text-gray-500 mt-0.5">Discover roles matching your extracted skill profile.</p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/jobs')}>
                  Browse Job Portal
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Tailored to your skills</span>
            <button
              onClick={() => navigate('/skills')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              Analyze Skill Gaps &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Find Faculty Advisor Modal */}
      {showAdvisorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Department Faculty Advisors</h3>
                  <p className="text-xs text-gray-500">Request mentorship to get assigned directly to a faculty member.</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAdvisorModal(false); setSelectedFacultyForRequest(null); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* If requesting a specific faculty */}
            {selectedFacultyForRequest ? (
              <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center">
                      {selectedFacultyForRequest.full_name?.[0] || 'P'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{selectedFacultyForRequest.full_name}</h4>
                      <p className="text-xs text-gray-500">{selectedFacultyForRequest.department}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFacultyForRequest(null)}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    Change Professor
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Introduction / Note to Professor (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Hi Professor, I am working towards a Backend/Cloud engineer role and would value your guidance on my placement preparation."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full text-sm bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFacultyForRequest(null)}
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    isLoading={isSubmittingRequest}
                    onClick={() => handleSendMentorshipRequest(selectedFacultyForRequest.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Send Mentorship Request
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {facultyList.length > 0 ? (
                  facultyList.map((faculty) => (
                    <div
                      key={faculty.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/70 hover:bg-purple-50/40 rounded-xl border border-gray-100 transition-colors gap-3"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
                          {faculty.full_name?.[0] || faculty.username?.[0] || 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{faculty.full_name}</p>
                          <p className="text-xs text-gray-500">{faculty.department} • {faculty.college || 'Faculty Advisor'}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{faculty.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {faculty.request_status === 'accepted' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1 text-green-600" />
                            Your Advisor
                          </span>
                        ) : faculty.request_status === 'pending' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 inline-flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1 text-amber-600" />
                            Request Pending
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setSelectedFacultyForRequest(faculty)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                          >
                            Request Mentorship
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No faculty members found in your department directory yet.
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowAdvisorModal(false); setSelectedFacultyForRequest(null); }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Nomination Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Decline {declineTargetNomination?.company_name} Offer
              </h3>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mt-3">
              Are you sure you want to decline this company placement selection? You can provide an optional note for your faculty coordinator (e.g. higher studies, accepted another offer).
            </p>

            <div className="my-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason / Note (Optional)
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Planning to pursue Masters, or accepted another offer."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeclineModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDecline}
                isLoading={isRespondingNomination === declineTargetNomination?.id}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
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

export default Dashboard