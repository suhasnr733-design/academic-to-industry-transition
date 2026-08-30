import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useResume } from '../../hooks/useResume'
import { useJobs } from '../../hooks/useJobs'
import { useRecommendedActions } from '../../hooks/useRecommendedActions'
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
  TrendingUpIcon,
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
  const [targetRoleMatch, setTargetRoleMatch] = useState(0)
  const [targetRoleTitle, setTargetRoleTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const jobsSectionRef = React.useRef(null)
  const [highlightJobs, setHighlightJobs] = useState(false)
  const [showSkillsModal, setShowSkillsModal] = useState(false)

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

  // 1. Compute dynamic profile completeness (Synchronized with Career Readiness Actions)
  const { profileDetails } = useRecommendedActions()
  const profilePercentage = profileDetails?.percentage ?? 0

  // 2. Determine active resume
  const latestResume = resumes?.[0]
  const completedResume = resumes?.find((r) => r.status === 'completed') || latestResume

  // Filter and sort top matched tech jobs for dashboard
  const topMatchedJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return []

    const userSkills = (completedResume?.skills || []).map(s => String(s).toLowerCase().trim())
    const nonTechList = [
      'account executive', 'account manager', 'sales', 'marketing', 'business development',
      'bdr', 'sdr', 'recruiter', 'talent acquisition', 'human resources', 'customer success',
      'customer support', 'client success', 'operations manager', 'copywriter', 'content writer',
      'tax preparer', 'tax accountant', 'tax manager', 'cpa', 'accounting', 'bookkeeper',
      'gardener', 'landscaping', 'chiropract', 'housekeeping', 'cashier', 'store associate',
      'now hiring', 'delivery driver', 'warehouse worker', 'nurse', 'nursing', 'medical', 'cook'
    ]

    const techOnly = jobs.filter(j => {
      const title = (j.title || '').toLowerCase()
      return !nonTechList.some(nt => title.includes(nt))
    })

    // If no resume uploaded, fallback to displaying top active tech openings
    if (!completedResume?.skills || completedResume.skills.length === 0) {
      return techOnly.slice(0, 3)
    }

    return [...techOnly].sort((a, b) => {
      const skillsA = (a.required_skills || []).map(s => String(s).toLowerCase())
      const skillsB = (b.required_skills || []).map(s => String(s).toLowerCase())

      const matchA = skillsA.filter(s => userSkills.some(u => u.includes(s) || s.includes(u))).length
      const matchB = skillsB.filter(s => userSkills.some(u => u.includes(s) || s.includes(u))).length

      return matchB - matchA
    }).slice(0, 3)
  }, [jobs, completedResume?.skills])

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
        try {
          const gapRes = await api.get('/prediction/skill-gap/latest')
          if (gapRes.data && gapRes.data.match_percentage !== undefined) {
            setTargetRoleMatch(Math.round(gapRes.data.match_percentage))
            setTargetRoleTitle(gapRes.data.target_role || completedResume.recommended_roles?.[0] || 'Software Engineer')
            setSkillGapCount(gapRes.data.missing_skills?.length || 0)
            return
          }
        } catch (gapErr) {
          console.warn('Skill gap endpoint fetch notice:', gapErr)
        }

        // Dynamic fallback based on verified skills count and recommended role
        const userSkills = completedResume.skills || []
        const calculatedScore = userSkills.length > 0 ? Math.min(45 + userSkills.length * 6, 92) : 0
        setTargetRoleMatch(calculatedScore)
        setTargetRoleTitle(completedResume.recommended_roles?.[0] || 'Software Engineer')
        setSkillGapCount(completedResume.skill_gaps?.length || 0)
      } else {
        setTargetRoleMatch(0)
        setTargetRoleTitle('')
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

  // 5. Dynamic Stats Calculation & Click Handlers
  const resumeScoreValue = completedResume
    ? completedResume.status === 'completed' && completedResume.employability_score != null
      ? `${Math.round(completedResume.employability_score)}%`
      : completedResume.status === 'processing'
      ? 'Processing...'
      : 'Pending'
    : '0%'

  const extractedSkills = completedResume?.skills || []

  const stats = [
    {
      name: 'Resume Score',
      value: resumeScoreValue,
      icon: DocumentIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: completedResume?.status === 'completed' ? 'Calculated from AI parsing' : 'Upload or process resume',
      actionText: 'View Analysis',
      onClick: () => {
        if (completedResume?.id) {
          navigate(`/resume/${completedResume.id}`)
        } else {
          navigate('/resume/upload')
        }
      }
    },
    {
      name: 'Skills Extracted',
      value: `${extractedSkills.length}`,
      icon: ChartBarIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      description: extractedSkills.length ? 'Extracted from active resume' : 'No skills extracted yet',
      actionText: 'View Skills',
      onClick: () => {
        if (extractedSkills.length > 0) {
          setShowSkillsModal(true)
        } else {
          toast('Upload or process a resume to view extracted skills')
        }
      }
    },
    {
      name: 'Target Role Match',
      value: completedResume
        ? completedResume.status === 'completed'
          ? `${targetRoleMatch}%`
          : completedResume.status === 'processing'
          ? 'Calculating...'
          : 'Pending'
        : '0%',
      icon: SparklesIcon,
      color: targetRoleMatch >= 75 ? 'text-emerald-600' : targetRoleMatch >= 50 ? 'text-purple-600' : 'text-amber-600',
      bg: targetRoleMatch >= 75 ? 'bg-emerald-50' : targetRoleMatch >= 50 ? 'bg-purple-50' : 'bg-amber-50',
      description: targetRoleTitle || completedResume?.recommended_roles?.[0] || (completedResume ? 'Software Engineer' : 'Upload resume to calculate'),
      actionText: 'Analyze Gaps',
      onClick: () => {
        navigate('/skills')
      }
    },
    {
      name: 'Available Jobs',
      value: `${jobCount}`,
      icon: BriefcaseIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      description: 'Active matching openings',
      actionText: 'Scroll to Jobs',
      onClick: () => {
        if (jobsSectionRef.current) {
          jobsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightJobs(true)
          setTimeout(() => setHighlightJobs(false), 2200)
        } else {
          navigate('/jobs')
        }
      }
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm font-semibold flex items-center gap-1.5 shadow-2xs"
              onClick={() => navigate('/dashboard/advanced')}
            >
              <TrendingUpIcon className="h-4 w-4" />
              Career Analytics
            </Button>
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
              {completedResume ? 'Update Resume' : 'Upload Resume'}
            </Button>
          </div>
        </div>
      </div>

      {/* Company Placement Drives Notification Banner (Under Student Career Suite) */}
      {nominations && nominations.some((n) => n.status === 'pending') && (
        <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/10 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20 flex-shrink-0">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">
                    Campus Placement Drive Invitations
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                    {nominations.filter((n) => n.status === 'pending').length} Action Required
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  You have company shortlist invitations awaiting your RSVP. Review CTC packages and confirm attendance under{' '}
                  <span className="font-semibold text-gray-800">Student Career Suite &rarr; Placement Drives</span>.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/placements')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm self-end sm:self-center flex-shrink-0"
            >
              <OfficeBuildingIcon className="h-4 w-4" />
              View Placement Drives
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Button>
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
                ? (profileDetails?.missingHint
                    ? `Complete your profile — ${profileDetails.missingHint} for higher relevance.`
                    : 'Complete remaining profile information for higher job match relevance.')
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
              className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <UserGroupIcon className="h-4 w-4 mr-1.5" />
              {advisorData.has_advisor ? 'View Faculty Directory' : 'Find Faculty Advisor'}
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            onClick={stat.onClick}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md hover:border-primary-300 hover:translate-y-[-2px] transition-all cursor-pointer border border-gray-100/80 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 group-hover:text-primary-600 transition-colors">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform flex-shrink-0`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 pt-2.5 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-primary-600 group-hover:text-primary-700">
              <span>{stat.actionText}</span>
              <ArrowRightIcon className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Resume & Core Competencies Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <DocumentIcon className="w-5 h-5 text-primary-600" />
                Active Resume & Core Skills
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/resume')}>
                Manage &rarr;
              </Button>
            </div>

            {completedResume ? (
              <div className="space-y-4">
                {/* Resume Header Info */}
                <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex items-start justify-between">
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded-lg bg-white shadow-xs text-primary-600 flex-shrink-0 mt-0.5">
                      <DocumentIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate" title={completedResume.filename}>
                        {completedResume.filename}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>Uploaded {new Date(completedResume.created_at).toLocaleDateString()}</span>
                        {completedResume.file_size && (
                          <>
                            <span>•</span>
                            <span>{(completedResume.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full flex-shrink-0 ml-2">
                    Active
                  </span>
                </div>

                {/* Target Role & Readiness */}
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-purple-900">
                    <SparklesIcon className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span>Target Career Alignment:</span>
                    <strong className="font-semibold">{completedResume.recommended_roles?.[0] || 'Software Engineer'}</strong>
                  </div>
                  <button
                    onClick={() => navigate('/skills')}
                    className="font-bold text-purple-700 hover:text-purple-900 underline"
                  >
                    View Gap Analysis
                  </button>
                </div>

                {/* Extracted Skills Sleek Card (Custom Styled per Reference) */}
                <div className="bg-[#11141c] text-white rounded-2xl p-5 shadow-lg border border-[#1e2536] space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white tracking-tight">Extracted Skills</h4>
                      <p className="text-xs text-gray-400 mt-0.5">AI extracted from your active resume</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#0f243d] text-[#38bdf8] border border-[#1e3e6b] rounded-full text-xs font-bold">
                      {extractedSkills.length} Skills
                    </span>
                  </div>

                  {/* Skill Badges with Specific Pastel Themes & Icons */}
                  <div className="flex flex-wrap gap-2.5 pt-1 items-center">
                    {extractedSkills.length > 0 ? (
                      extractedSkills.map((skill, idx) => {
                        const name = typeof skill === 'string' ? skill : (skill?.name || skill?.skill || '')
                        const s = name.toLowerCase().trim()
                        
                        let badgeStyle = {
                          bg: 'bg-[#dbeafe] text-[#2563eb]',
                          icon: '</>'
                        }
                        
                        if (s.includes('python') || s.includes('java') || s.includes('c++') || s.includes('javascript') || s.includes('typescript') || s.includes('golang') || s.includes('rust') || s.includes('php')) {
                          badgeStyle = { bg: 'bg-[#dbeafe] text-[#2563eb]', icon: '</>' }
                        } else if (s.includes('flask') || s.includes('django') || s.includes('react') || s.includes('node') || s.includes('express') || s.includes('vue') || s.includes('spring') || s.includes('html') || s.includes('css')) {
                          badgeStyle = { bg: 'bg-[#dcfce7] text-[#16a34a]', icon: '⚙️' }
                        } else if (s === 'sql' || s.includes('mysql') || s.includes('sqlite')) {
                          badgeStyle = { bg: 'bg-[#fef3c7] text-[#d97706]', icon: '🗄️' }
                        } else if (s.includes('postgres') || s.includes('mongo') || s.includes('redis') || s.includes('database')) {
                          badgeStyle = { bg: 'bg-[#e0e7ff] text-[#4f46e5]', icon: '🗄️' }
                        } else if (s.includes('git') || s.includes('github') || s.includes('gitlab')) {
                          badgeStyle = { bg: 'bg-[#f3f4f6] text-[#4b5563]', icon: 'ᛘ' }
                        } else if (s.includes('docker') || s.includes('k8s') || s.includes('kubernetes') || s.includes('aws') || s.includes('azure') || s.includes('linux') || s.includes('devops')) {
                          badgeStyle = { bg: 'bg-[#e0f2fe] text-[#0284c7]', icon: '📦' }
                        } else if (s.includes('nlp') || s.includes('ai') || s.includes('ml') || s.includes('deep learning') || s.includes('machine learning') || s.includes('data science')) {
                          badgeStyle = { bg: 'bg-[#f3e8ff] text-[#9333ea]', icon: '🧠' }
                        } else {
                          const fallbacks = [
                            { bg: 'bg-[#dbeafe] text-[#2563eb]', icon: '</>' },
                            { bg: 'bg-[#dcfce7] text-[#16a34a]', icon: '⚙️' },
                            { bg: 'bg-[#fef3c7] text-[#d97706]', icon: '🗄️' },
                            { bg: 'bg-[#e0e7ff] text-[#4f46e5]', icon: '🗄️' },
                            { bg: 'bg-[#e0f2fe] text-[#0284c7]', icon: '📦' },
                            { bg: 'bg-[#f3e8ff] text-[#9333ea]', icon: '🧠' }
                          ]
                          const h = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
                          badgeStyle = fallbacks[h % fallbacks.length]
                        }

                        return (
                          <span
                            key={idx}
                            onClick={() => setShowSkillsModal(true)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform ${badgeStyle.bg}`}
                          >
                            <span className="text-[11px] opacity-90">{badgeStyle.icon}</span>
                            <span>{name}</span>
                          </span>
                        )
                      })
                    ) : (
                      <p className="text-xs text-gray-400 py-2">No skills extracted yet.</p>
                    )}
                  </div>

                  {/* View All Skills Link */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setShowSkillsModal(true)}
                      className="text-[#3b82f6] hover:text-[#60a5fa] text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      View All Skills &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-gray-500 text-sm">No active resume on profile</p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/resume/upload')}>
                  Upload Resume
                </Button>
              </div>
            )}
          </div>

          {completedResume && (
            <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="xs"
                onClick={() => navigate(`/resume/${completedResume.id}`)}
              >
                View Full Analysis
              </Button>
              <Button
                variant="primary"
                size="xs"
                onClick={() => navigate('/resume/upload')}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <RefreshIcon className="h-3.5 w-3.5 mr-1" />
                Update Resume
              </Button>
            </div>
          )}
        </div>

        {/* Top Matched Jobs (Target of Available Jobs scroll) */}
        <div 
          ref={jobsSectionRef}
          className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between transition-all duration-500 ${
            highlightJobs ? 'ring-4 ring-emerald-400/60 ring-offset-2 border-emerald-400' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-emerald-600" />
                Top Matched Openings
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
                View All ({jobCount}) &rarr;
              </Button>
            </div>

            {topMatchedJobs && topMatchedJobs.length > 0 ? (
              <div className="space-y-3">
                {topMatchedJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-emerald-50/40 rounded-xl cursor-pointer border border-gray-100 hover:border-emerald-200 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-white shadow-xs text-emerald-600 mt-0.5">
                        <BriefcaseIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{job.title}</p>
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
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
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

          <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Curated based on your skill profile</span>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              Explore All Jobs &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Extracted Skills Interactive Modal */}
      {showSkillsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Extracted Competencies</h3>
                  <p className="text-xs text-gray-500">
                    {extractedSkills.length} skills identified from {completedResume?.filename || 'your resume'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSkillsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-gray-600">
                These core skills are automatically matched with industry requisitions and target job roles:
              </p>
              
              <div className="flex flex-wrap gap-2.5 max-h-64 overflow-y-auto p-1 items-center">
                {extractedSkills.map((skill, idx) => {
                  const name = typeof skill === 'string' ? skill : (skill?.name || skill?.skill || '')
                  const s = name.toLowerCase().trim()
                  
                  let badgeStyle = { bg: 'bg-[#dbeafe] text-[#2563eb]', icon: '</>' }
                  if (s.includes('python') || s.includes('java') || s.includes('c++') || s.includes('javascript') || s.includes('typescript') || s.includes('golang') || s.includes('rust') || s.includes('php')) {
                    badgeStyle = { bg: 'bg-[#dbeafe] text-[#2563eb]', icon: '</>' }
                  } else if (s.includes('flask') || s.includes('django') || s.includes('react') || s.includes('node') || s.includes('express') || s.includes('vue') || s.includes('spring') || s.includes('html') || s.includes('css')) {
                    badgeStyle = { bg: 'bg-[#dcfce7] text-[#16a34a]', icon: '⚙️' }
                  } else if (s === 'sql' || s.includes('mysql') || s.includes('sqlite')) {
                    badgeStyle = { bg: 'bg-[#fef3c7] text-[#d97706]', icon: '🗄️' }
                  } else if (s.includes('postgres') || s.includes('mongo') || s.includes('redis') || s.includes('database')) {
                    badgeStyle = { bg: 'bg-[#e0e7ff] text-[#4f46e5]', icon: '🗄️' }
                  } else if (s.includes('git') || s.includes('github') || s.includes('gitlab')) {
                    badgeStyle = { bg: 'bg-[#f3f4f6] text-[#4b5563]', icon: 'ᛘ' }
                  } else if (s.includes('docker') || s.includes('k8s') || s.includes('kubernetes') || s.includes('aws') || s.includes('azure') || s.includes('linux') || s.includes('devops')) {
                    badgeStyle = { bg: 'bg-[#e0f2fe] text-[#0284c7]', icon: '📦' }
                  } else if (s.includes('nlp') || s.includes('ai') || s.includes('ml') || s.includes('deep learning') || s.includes('machine learning') || s.includes('data science')) {
                    badgeStyle = { bg: 'bg-[#f3e8ff] text-[#9333ea]', icon: '🧠' }
                  }

                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${badgeStyle.bg}`}
                    >
                      <span className="text-[11px] opacity-90">{badgeStyle.icon}</span>
                      <span>{name}</span>
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSkillsModal(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowSkillsModal(false)
                  navigate('/skills')
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Analyze Skill Gaps &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}

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