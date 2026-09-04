import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useResume } from '../../hooks/useResume'
import { useJobs } from '../../hooks/useJobs'
import { useRecommendedActions } from '../../hooks/useRecommendedActions'
import { api } from '../../services/api'
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
  SearchIcon,
  BellIcon,
  ExternalLinkIcon,
  LightningBoltIcon,
  CheckIcon,
  EyeIcon,
  UploadIcon,
  CurrencyDollarIcon,
  BadgeCheckIcon,
  StarIcon,
  FireIcon,
  AdjustmentsIcon,
  ShieldCheckIcon,
  ChevronRightIcon
} from '@heroicons/react/outline'

const DASHBOARD_SWR_KEY = 'swr_student_dashboard_overview'

const getCachedDashboardOverview = () => {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_SWR_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Category helper for skills
const categorizeSkill = (skillName) => {
  const s = String(skillName || '').toLowerCase().trim()
  if (s.includes('python') || s.includes('java') || s.includes('c++') || s.includes('javascript') || s.includes('typescript') || s.includes('golang') || s.includes('rust') || s.includes('php') || s.includes('c#') || s.includes('ruby')) {
    return { category: 'Language', badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: '</>' }
  }
  if (s.includes('react') || s.includes('next') || s.includes('node') || s.includes('express') || s.includes('vue') || s.includes('angular') || s.includes('django') || s.includes('flask') || s.includes('spring') || s.includes('tailwind') || s.includes('html') || s.includes('css')) {
    return { category: 'Framework', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: '⚙️' }
  }
  if (s.includes('sql') || s.includes('postgres') || s.includes('mongo') || s.includes('redis') || s.includes('mysql') || s.includes('database') || s.includes('dynamodb') || s.includes('oracle')) {
    return { category: 'Database', badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: '🗄️' }
  }
  if (s.includes('docker') || s.includes('k8s') || s.includes('kubernetes') || s.includes('aws') || s.includes('azure') || s.includes('gcp') || s.includes('ci/cd') || s.includes('git') || s.includes('linux') || s.includes('devops')) {
    return { category: 'DevOps & Cloud', badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: '☁️' }
  }
  if (s.includes('nlp') || s.includes('ai') || s.includes('ml') || s.includes('machine learning') || s.includes('deep learning') || s.includes('pytorch') || s.includes('tensorflow') || s.includes('data science') || s.includes('pandas')) {
    return { category: 'AI & Data', badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: '🧠' }
  }
  return { category: 'Core', badgeBg: 'bg-slate-700/40 text-slate-300 border-slate-600/40', icon: '⚡' }
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { resumes, fetchResumes } = useResume()
  const { jobs, total: totalJobs, isLoading: jobsLoading } = useJobs()

  const cachedOverview = getCachedDashboardOverview()

  const [jobCount, setJobCount] = useState(() => cachedOverview?.job_count || totalJobs || jobs?.length || 0)
  const [skillGapCount, setSkillGapCount] = useState(() => cachedOverview?.skill_gap_count || 0)
  const [targetRoleMatch, setTargetRoleMatch] = useState(() => cachedOverview?.target_role_match || 0)
  const [targetRoleTitle, setTargetRoleTitle] = useState(() => cachedOverview?.target_role_title || '')
  const [isProcessing, setIsProcessing] = useState(false)

  const jobsSectionRef = useRef(null)
  const [highlightJobs, setHighlightJobs] = useState(false)
  const [showSkillsModal, setShowSkillsModal] = useState(false)
  const [skillFilterCategory, setSkillFilterCategory] = useState('All')
  const [skillModalSearch, setSkillModalSearch] = useState('')

  // Mentorship & Advisor State
  const [advisorData, setAdvisorData] = useState(() => cachedOverview?.advisor_data || { has_advisor: false, advisor: null, requests: [] })
  const [facultyList, setFacultyList] = useState([])
  const [facultySearch, setFacultySearch] = useState('')
  const [showAdvisorModal, setShowAdvisorModal] = useState(false)
  const [selectedFacultyForRequest, setSelectedFacultyForRequest] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  // Company Placement Nominations State
  const [nominations, setNominations] = useState(() => cachedOverview?.nominations || [])
  const [isRespondingNomination, setIsRespondingNomination] = useState(null)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineTargetNomination, setDeclineTargetNomination] = useState(null)
  const [declineReason, setDeclineReason] = useState('')

  // Dynamic profile completeness
  const { profileDetails } = useRecommendedActions()
  const profilePercentage = profileDetails?.percentage ?? 0

  // Determine active resume
  const latestResume = resumes?.[0]
  const completedResume = resumes?.find((r) => r.status === 'completed') || latestResume

  // Filter and sort top matched tech jobs
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

    if (!completedResume?.skills || completedResume.skills.length === 0) {
      return techOnly.slice(0, 4)
    }

    return [...techOnly].sort((a, b) => {
      const skillsA = (a.required_skills || []).map(s => String(s).toLowerCase())
      const skillsB = (b.required_skills || []).map(s => String(s).toLowerCase())

      const matchA = skillsA.filter(s => userSkills.some(u => u.includes(s) || s.includes(u))).length
      const matchB = skillsB.filter(s => userSkills.some(u => u.includes(s) || s.includes(u))).length

      return matchB - matchA
    }).slice(0, 4)
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

  const fetchDashboardOverview = async () => {
    try {
      const res = await api.get('/analytics/student/summary')
      if (res.data && res.data.status === 'success') {
        if (res.data.job_count !== undefined) setJobCount(res.data.job_count)
        if (res.data.target_role_match !== undefined) setTargetRoleMatch(res.data.target_role_match)
        if (res.data.target_role_title) setTargetRoleTitle(res.data.target_role_title)
        if (res.data.skill_gap_count !== undefined) setSkillGapCount(res.data.skill_gap_count)
        if (res.data.advisor_data) setAdvisorData(res.data.advisor_data)
        if (res.data.nominations) setNominations(res.data.nominations)

        try {
          sessionStorage.setItem(DASHBOARD_SWR_KEY, JSON.stringify(res.data))
        } catch (e) {}
        return
      }
    } catch (err) {
      console.warn('Dashboard summary endpoint notice, using fallback:', err)
    }

    Promise.allSettled([
      fetchDashboardMetrics(),
      fetchAdvisorDetails(),
      fetchNominations()
    ])
  }

  useEffect(() => {
    fetchDashboardOverview()
  }, [completedResume?.id, completedResume?.status])

  useEffect(() => {
    if (totalJobs || jobs?.length) {
      setJobCount(totalJobs || jobs.length)
    }
  }, [totalJobs, jobs?.length])

  const fetchDashboardMetrics = async () => {
    try {
      setJobCount(totalJobs || jobs?.length || 0)

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
        toast.success(`You have declined the invitation for ${declineTargetNomination.company_name}.`)
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
      
      setFacultyList(prev => prev.map(f => f.id === facultyId ? { ...f, request_status: 'pending' } : f))
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to send request')
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  const resumeScoreValue = completedResume
    ? completedResume.status === 'completed' && completedResume.employability_score != null
      ? `${Math.round(completedResume.employability_score)}%`
      : completedResume.status === 'processing'
      ? 'Processing'
      : 'Pending'
    : '0%'

  const extractedSkills = completedResume?.skills || []

  // Filter skills in modal
  const filteredModalSkills = useMemo(() => {
    return extractedSkills.filter(skill => {
      const name = typeof skill === 'string' ? skill : (skill?.name || skill?.skill || '')
      const matchesSearch = name.toLowerCase().includes(skillModalSearch.toLowerCase().trim())
      if (skillFilterCategory === 'All') return matchesSearch
      const cat = categorizeSkill(name).category
      return matchesSearch && cat.toLowerCase() === skillFilterCategory.toLowerCase()
    })
  }, [extractedSkills, skillModalSearch, skillFilterCategory])

  const filteredFacultyList = useMemo(() => {
    if (!facultySearch.trim()) return facultyList
    const q = facultySearch.toLowerCase().trim()
    return facultyList.filter(f => 
      (f.full_name || '').toLowerCase().includes(q) ||
      (f.department || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.college || '').toLowerCase().includes(q)
    )
  }, [facultyList, facultySearch])

  // Stat cards configuration
  const stats = [
    {
      name: 'Resume Score',
      value: resumeScoreValue,
      icon: DocumentIcon,
      iconColor: 'text-[#6366F1]',
      iconBg: 'bg-[#6366F1]/10 border border-[#6366F1]/30',
      description: completedResume?.status === 'completed' ? 'Calculated from AI parsing' : 'Upload or process resume',
      trend: completedResume?.status === 'completed' ? '+14% ATS' : 'Pending',
      trendColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      actionText: 'View Analysis',
      glow: 'group-hover:border-[#6366F1]/50 group-hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.25)]',
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
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/10 border border-[#F59E0B]/30',
      description: extractedSkills.length ? 'Identified from active resume' : 'No skills extracted yet',
      trend: extractedSkills.length ? 'AI Verified' : 'Needs Scan',
      trendColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      actionText: 'Inspect Skills',
      glow: 'group-hover:border-[#F59E0B]/50 group-hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]',
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
          ? 'Calc...'
          : 'Pending'
        : '0%',
      icon: SparklesIcon,
      iconColor: 'text-[#8B5CF6]',
      iconBg: 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/30',
      description: targetRoleTitle || completedResume?.recommended_roles?.[0] || 'Software Engineer',
      trend: targetRoleMatch >= 75 ? 'Strong Match' : targetRoleMatch >= 50 ? 'Moderate' : 'Needs Gaps',
      trendColor: targetRoleMatch >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      actionText: 'Analyze Gaps',
      glow: 'group-hover:border-[#8B5CF6]/50 group-hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.25)]',
      onClick: () => {
        navigate('/skills')
      }
    },
    {
      name: 'Available Jobs',
      value: `${jobCount}`,
      icon: BriefcaseIcon,
      iconColor: 'text-[#10B981]',
      iconBg: 'bg-[#10B981]/10 border border-[#10B981]/30',
      description: 'Active matching openings',
      trend: 'Live Hiring',
      trendColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      actionText: 'Explore Roles',
      glow: 'group-hover:border-[#10B981]/50 group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]',
      onClick: () => {
        if (jobsSectionRef.current) {
          jobsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightJobs(true)
          setTimeout(() => setHighlightJobs(false), 2400)
        } else {
          navigate('/jobs')
        }
      }
    },
  ]

  const activePendingRequest = advisorData.requests?.find(r => r.status === 'pending')

  // AI Suggestions calculated dynamically based on resume and missing skills
  const aiSuggestionsCount = skillGapCount > 0 ? Math.min(skillGapCount, 5) : (completedResume ? 3 : 4)

  // Derived user display properties
  const studentFullName = user?.full_name || ''
  const studentUsername = user?.username || ''
  const studentEmail = user?.email || ''
  const displayName = studentFullName || studentUsername || (studentEmail ? studentEmail.split('@')[0] : 'Student')
  const usernameHandle = studentUsername ? `@${studentUsername}` : (studentEmail ? `@${studentEmail.split('@')[0]}` : '')
  const avatarLetter = (displayName[0] || 'S').toUpperCase()

  return (
    <div className="-m-3 sm:-m-4 md:-m-5 min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans antialiased p-4 sm:p-6 lg:p-8 space-y-7 selection:bg-[#6366F1]/30 selection:text-[#F8FAFC]">
      {/* Login Welcome Modal Popup */}
      <WelcomeActionsModal />

      {/* Top Minimalist SaaS Header / Utility Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center space-x-3.5">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full rounded-full bg-[#111827] flex items-center justify-center font-bold text-base text-white">
                {avatarLetter}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] border-2 border-[#0F172A] rounded-full" title="Online & Active"></span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-extrabold text-white tracking-tight">
                {displayName}
              </span>
              {usernameHandle && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/50 shadow-xs">
                  {usernameHandle}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Candidate
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium flex items-center gap-1.5">
              <span>{user?.department ? `${user.department} • ` : ''}{user?.college || 'Student Career Portal'}</span>
              {user?.username && <span className="text-indigo-400 font-mono">(@{user.username})</span>}
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-2 px-3 py-2 bg-[#111827] hover:bg-[#1E293B] border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors relative shadow-xs"
            title="Notifications"
          >
            <BellIcon className="h-4 w-4 text-indigo-400" />
            <span>Alerts</span>
            {nominations && nominations.some(n => n.status === 'pending') && (
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#111827] hover:bg-[#1E293B] border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin-slow"></div>
            <span>{profilePercentage}% Profile Ready</span>
          </button>
        </div>
      </header>

      {/* Hero Section (Linear & Vercel Glassmorphism Style) */}
      <section className="relative rounded-[24px] p-6 sm:p-8 bg-gradient-to-br from-[#111827] via-[#151D30] to-[#1E293B] border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Ambient Gradient Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-[#6366F1]/15 rounded-full blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-80 h-80 bg-[#8B5CF6]/15 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <SparklesIcon className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                AI-Powered Transition Hub
              </span>
              {usernameHandle && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-sm">
                  <span>👤</span>
                  <span>{usernameHandle}</span>
                </span>
              )}
              <span className="text-xs text-slate-300 font-medium">
                Last synced: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, {displayName} 👋
            </h1>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              Your transition intelligence is active. Track ATS resume scores, resolve target skill gaps, and explore high-matching placement opportunities.
            </p>

            {/* Integrated Profile Readiness Indicator */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-[#10B981]" />
                  Placement Profile Readiness
                </span>
                <span className="font-bold text-[#818CF8]">{profilePercentage}% Complete</span>
              </div>
              <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#10B981] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${profilePercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-1.5">
                <span>
                  {profilePercentage < 100
                    ? (profileDetails?.missingHint ? `Tip: ${profileDetails.missingHint}` : 'Complete remaining profile fields for 3x higher recruiter match.')
                    : '🎉 Profile is 100% optimized for campus drives!'}
                </span>
                {profilePercentage < 100 && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-[#818CF8] hover:text-indigo-300 font-semibold inline-flex items-center gap-0.5 transition-colors"
                  >
                    Finish Profile &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hero Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/resume/upload')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <UploadIcon className="h-4 w-4" />
              <span>{completedResume ? 'Update Resume' : 'Upload Resume'}</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/advanced')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E293B]/80 hover:bg-[#1E293B] text-[#F8FAFC] border border-slate-700/80 text-xs sm:text-sm font-semibold transition-all duration-200 hover:border-slate-600 shadow-sm"
            >
              <TrendingUpIcon className="h-4 w-4 text-[#818CF8]" />
              <span>Career Analytics</span>
            </button>

            {resumes?.length > 0 && (
              <button
                onClick={() => fetchResumes && fetchResumes()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-transparent hover:bg-[#1E293B]/60 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition-colors"
              >
                <RefreshIcon className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin text-[#6366F1]' : ''}`} />
                <span>{isProcessing ? 'Processing AI Data...' : 'Sync AI Cache'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Placement Drives Action Alert Banner (Sleek Dark Amber Banner) */}
      {nominations && nominations.some((n) => n.status === 'pending') && (
        <div className="rounded-[20px] p-4 sm:p-5 bg-gradient-to-r from-[#F59E0B]/15 via-[#F59E0B]/10 to-[#111827] border border-[#F59E0B]/40 shadow-lg shadow-amber-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-[#F59E0B] text-slate-950 rounded-xl shadow-md shadow-amber-500/20 flex-shrink-0 mt-0.5">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                    Campus Placement Drive Invitations
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-extrabold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 rounded-full">
                    {nominations.filter((n) => n.status === 'pending').length} Action Required
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  You have company shortlist invitations awaiting your RSVP. Review CTC packages and confirm attendance under{' '}
                  <span className="font-semibold text-slate-300">Student Career Suite &rarr; Placement Drives</span>.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/placements')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm self-end sm:self-center flex-shrink-0 transition-all"
            >
              <OfficeBuildingIcon className="h-4 w-4" />
              <span>View Placement Drives</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4 Premium Statistics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <div
            key={stat.name}
            onClick={stat.onClick}
            className={`group relative rounded-[20px] p-5 sm:p-6 bg-[#111827] border border-slate-800/90 hover:border-slate-700 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 flex flex-col justify-between ${stat.glow}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[#94A3B8] uppercase">
                  {stat.name}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${stat.trendColor}`}>
                  {stat.trend}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
                  {stat.value}
                </p>
                <div className={`p-2.5 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>

              <p className="text-xs text-[#94A3B8] mt-2 line-clamp-1">
                {stat.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-[#818CF8] group-hover:text-indigo-300 transition-colors">
              <span>{stat.actionText}</span>
              <ArrowRightIcon className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </section>

      {/* Main 12-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: 8 Cols (Resume Workspace + Job Matches) */}
        <div className="lg:col-span-8 space-y-7">
          {/* Resume Workspace Card */}
          <section className="rounded-[20px] p-6 bg-[#111827] border border-slate-800/90 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20">
                  <DocumentIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                    Resume Workspace
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      {completedResume ? 'Active ATS Profile' : 'Needs Resume'}
                    </span>
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    AI multi-factor resume breakdown & core extracted competencies
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/resume')}
                className="text-xs font-semibold text-[#818CF8] hover:text-indigo-300 inline-flex items-center gap-1 self-start sm:self-auto transition-colors"
              >
                <span>Manage Resumes</span>
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {completedResume ? (
              <div className="space-y-5">
                {/* Active Document Header */}
                <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div className="p-3 rounded-xl bg-[#111827] border border-slate-700/80 text-[#818CF8] shadow-sm flex-shrink-0">
                      <DocumentIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#F8FAFC] truncate" title={completedResume.filename}>
                          {completedResume.filename || 'Active_Resume.pdf'}
                        </p>
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                          PDF
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-[#94A3B8]">
                        <span>Uploaded {new Date(completedResume.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{completedResume.file_size ? `${(completedResume.file_size / 1024 / 1024).toFixed(2)} MB` : '1.24 MB'}</span>
                        <span>•</span>
                        <span className="text-[#10B981] font-medium">ATS Parsed</span>
                      </div>
                    </div>
                  </div>

                  {/* ATS Employability Score Badge */}
                  <div className="flex items-center space-x-3 bg-[#111827] px-3.5 py-2 rounded-xl border border-slate-800 self-start sm:self-auto flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">ATS Score</p>
                      <p className="text-lg font-black text-[#10B981] leading-none mt-0.5">
                        {resumeScoreValue}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                      <BadgeCheckIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Target Role & AI Suggestions Pill */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#1E293B]/40 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <SparklesIcon className="h-4 w-4 text-[#8B5CF6] flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#94A3B8]">Target Role Alignment</p>
                        <p className="text-xs font-bold text-[#F8FAFC]">
                          {targetRoleTitle || completedResume.recommended_roles?.[0] || 'Software Engineer'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/skills')}
                      className="text-[11px] font-bold text-[#818CF8] hover:text-indigo-300"
                    >
                      Gap Analysis &rarr;
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#1E293B]/40 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <LightningBoltIcon className="h-4 w-4 text-[#F59E0B] flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#94A3B8]">AI Optimizations</p>
                        <p className="text-xs font-bold text-[#F8FAFC]">
                          {aiSuggestionsCount} high-impact improvements
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/resume/${completedResume.id}`)}
                      className="text-[11px] font-bold text-[#F59E0B] hover:text-amber-300"
                    >
                      Review &rarr;
                    </button>
                  </div>
                </div>

                {/* Extracted Skills Cloud (Linear & Vercel Tag Grid) */}
                <div className="p-4 rounded-xl bg-[#1E293B]/40 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Extracted Skill Profile ({extractedSkills.length})
                      </h4>
                      <p className="text-[11px] text-[#94A3B8]">Matched against industry requirement schemas</p>
                    </div>
                    <button
                      onClick={() => setShowSkillsModal(true)}
                      className="text-xs font-semibold text-[#818CF8] hover:text-indigo-300 transition-colors"
                    >
                      View All ({extractedSkills.length}) &rarr;
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {extractedSkills.length > 0 ? (
                      extractedSkills.slice(0, 8).map((skill, idx) => {
                        const name = typeof skill === 'string' ? skill : (skill?.name || skill?.skill || '')
                        const { badgeBg, icon } = categorizeSkill(name)

                        return (
                          <span
                            key={idx}
                            onClick={() => setShowSkillsModal(true)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border shadow-xs cursor-pointer hover:scale-105 transition-all duration-200 ${badgeBg}`}
                          >
                            <span className="text-[10px] opacity-80">{icon}</span>
                            <span>{name}</span>
                          </span>
                        )
                      })
                    ) : (
                      <p className="text-xs text-[#94A3B8] py-2">No skills extracted from current resume.</p>
                    )}

                    {extractedSkills.length > 8 && (
                      <button
                        onClick={() => setShowSkillsModal(true)}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1E293B] text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        +{extractedSkills.length - 8} more
                      </button>
                    )}
                  </div>
                </div>

                {/* Resume Actions Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => navigate(`/resume/${completedResume.id}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>View ATS Analysis & Scorecard</span>
                  </button>

                  <button
                    onClick={() => navigate('/resume/upload')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                  >
                    <UploadIcon className="h-4 w-4" />
                    <span>Upload New Version</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-[#1E293B]/40 border border-dashed border-slate-800 space-y-3">
                <DocumentIcon className="h-10 w-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-[#F8FAFC]">No active resume detected</h4>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                  Upload your PDF or DOCX resume to generate an instant ATS employability score, extract skills, and unlock curated job matches.
                </p>
                <button
                  onClick={() => navigate('/resume/upload')}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-bold shadow-md"
                >
                  <UploadIcon className="h-4 w-4" />
                  <span>Upload Resume Now</span>
                </button>
              </div>
            )}
          </section>

          {/* Job Matches Section */}
          <section
            ref={jobsSectionRef}
            className={`rounded-[20px] p-6 bg-[#111827] border border-slate-800/90 shadow-md space-y-5 transition-all duration-500 ${
              highlightJobs ? 'ring-2 ring-[#10B981] border-[#10B981] shadow-2xl shadow-emerald-500/10' : ''
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                  <BriefcaseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                    Curated Job Matches
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {jobCount} Openings
                    </span>
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Sorted by AI skill match score against your profile
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/jobs')}
                className="text-xs font-semibold text-[#10B981] hover:text-emerald-300 inline-flex items-center gap-1 self-start sm:self-auto transition-colors"
              >
                <span>View All Jobs ({jobCount})</span>
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Job Cards List */}
            {topMatchedJobs && topMatchedJobs.length > 0 ? (
              <div className="space-y-3.5">
                {topMatchedJobs.map((job, idx) => {
                  const userSkills = (completedResume?.skills || []).map(s => String(s).toLowerCase().trim())
                  const reqSkills = job.required_skills || ['Python', 'SQL', 'Git']
                  const matchCount = reqSkills.filter(s => userSkills.some(u => u.includes(String(s).toLowerCase()))).length
                  const matchScore = reqSkills.length > 0 ? Math.round(Math.min(100, Math.max(60, (matchCount / reqSkills.length) * 100))) : 85

                  // Color gradient generator for company avatar
                  const avatarGradients = [
                    'from-indigo-600 to-blue-600',
                    'from-purple-600 to-pink-600',
                    'from-emerald-600 to-teal-600',
                    'from-amber-600 to-orange-600'
                  ]
                  const grad = avatarGradients[idx % avatarGradients.length]

                  return (
                    <div
                      key={job.id || idx}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="group p-4 rounded-xl bg-[#1E293B]/50 hover:bg-[#1E293B] border border-slate-800/80 hover:border-slate-700 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${grad} text-white font-bold flex items-center justify-center text-sm shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                          {(job.company || 'Tech')[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#818CF8] transition-colors truncate">
                              {job.title}
                            </h4>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                              {matchScore}% Match
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#94A3B8]">
                            <span className="text-slate-300 font-medium">{job.company || 'Industry Tech Partner'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <LocationMarkerIcon className="h-3 w-3 text-slate-500" />
                              {job.location || 'Remote / Hybrid'}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">
                              {job.salary || 'CTC ₹12 - ₹18 LPA'}
                            </span>
                          </div>

                          {/* Skill Tags */}
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {reqSkills.slice(0, 4).map((skill, sIdx) => {
                              const isMatched = userSkills.some(u => u.includes(String(skill).toLowerCase()))
                              return (
                                <span
                                  key={sIdx}
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                                    isMatched
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  {isMatched && '✓ '}{skill}
                                </span>
                              )
                            })}
                            {reqSkills.length > 4 && (
                              <span className="text-[10px] text-slate-500 font-medium self-center">
                                +{reqSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#111827] text-slate-300 border border-slate-700/80">
                          {job.job_type || 'Full Time'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/jobs/${job.id}`)
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#6366F1]/15 hover:bg-[#6366F1] text-[#818CF8] hover:text-white border border-[#6366F1]/30 text-xs font-bold transition-all"
                        >
                          Quick Apply
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-[#1E293B]/40 border border-dashed border-slate-800 space-y-3">
                <BriefcaseIcon className="h-10 w-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-[#F8FAFC]">No job matches found</h4>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                  Browse the complete industry job directory or update your resume skills to see personalized openings.
                </p>
                <button
                  onClick={() => navigate('/jobs')}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  <BriefcaseIcon className="h-4 w-4" />
                  <span>Browse Job Directory</span>
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: 4 Cols (AI Career Coach + Faculty Mentorship + Career Toolkit) */}
        <div className="lg:col-span-4 space-y-7">
          {/* AI Career Coach Card (Notion AI / Copilot Aesthetic) */}
          <section className="relative rounded-[20px] p-6 bg-gradient-to-b from-[#1E293B] via-[#111827] to-[#111827] border border-indigo-500/30 shadow-xl overflow-hidden space-y-4">
            <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-[#6366F1]/20 rounded-full blur-2xl"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-md">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">AI Career Coach</h3>
                  <p className="text-[10px] font-mono text-[#818CF8]">Transition Intelligence</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/40">
                GPT-4 Engine
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Insight 1: Missing Skills */}
              <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <FireIcon className="w-3.5 h-3.5" />
                    High-Priority Gap
                  </span>
                  <span className="text-[10px] text-slate-400">Target Role</span>
                </div>
                <p className="text-xs text-slate-300">
                  {skillGapCount > 0
                    ? `You have ${skillGapCount} high-demand skills missing for ${targetRoleTitle || 'Software Engineer'}.`
                    : 'Add Cloud Deployment (Docker / AWS) to reach 95%+ ATS score.'}
                </p>
              </div>

              {/* Insight 2: Resume Metric Advice */}
              <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Impact Recommendation
                  </span>
                  <span className="text-[10px] text-slate-400">Bullet Points</span>
                </div>
                <p className="text-xs text-slate-300">
                  Quantify project outcomes with numerical metrics (e.g. &ldquo;improved latency by 40%&rdquo;) for better parser ranking.
                </p>
              </div>

              {/* Insight 3: Placement Readiness */}
              <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                    <LightningBoltIcon className="w-3.5 h-3.5" />
                    Campus Shortlist Readiness
                  </span>
                  <span className="text-[10px] text-slate-400">{profilePercentage}%</span>
                </div>
                <p className="text-xs text-slate-300">
                  Students with faculty-endorsed profiles receive 2.4x more interview shortlists from hiring partners.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/skills')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Improve My Resume</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* Faculty Mentorship Card */}
          <section className="rounded-[20px] p-6 bg-[#111827] border border-slate-800/90 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <AcademicCapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">Faculty Mentorship</h3>
                  <p className="text-[10px] text-[#94A3B8]">Department Academic Advisor</p>
                </div>
              </div>

              {advisorData.has_advisor ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Assigned
                </span>
              ) : activePendingRequest ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Pending
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Unassigned
                </span>
              )}
            </div>

            {advisorData.has_advisor && advisorData.advisor?.faculty ? (
              <div className="p-3.5 rounded-xl bg-[#1E293B]/60 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                    {advisorData.advisor.faculty.full_name?.[0] || 'P'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#F8FAFC] truncate">
                      {advisorData.advisor.faculty.full_name}
                    </h4>
                    <p className="text-[11px] text-[#94A3B8] truncate">
                      {advisorData.advisor.faculty.department}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {advisorData.advisor.faculty.email}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-[#10B981] font-medium flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Active Advisor
                  </span>
                  <button
                    onClick={handleOpenAdvisorModal}
                    className="text-[#818CF8] hover:text-indigo-300 font-semibold"
                  >
                    Directory &rarr;
                  </button>
                </div>
              </div>
            ) : activePendingRequest && activePendingRequest.faculty ? (
              <div className="p-3.5 rounded-xl bg-[#1E293B]/60 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-300">
                    Request Pending: {activePendingRequest.faculty.full_name}
                  </p>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  Awaiting faculty approval for resume review and placement endorsement.
                </p>
                <button
                  onClick={handleOpenAdvisorModal}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#111827] hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                >
                  Change Professor
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Connect with department professors to get personalized project reviews, skill verification, and recommendation letters for top tech companies.
                </p>
                <button
                  onClick={handleOpenAdvisorModal}
                  className="w-full py-2 px-3 rounded-xl bg-[#1E293B] hover:bg-slate-700/80 text-[#F8FAFC] border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <UserGroupIcon className="w-4 h-4 text-purple-400" />
                  <span>Find Faculty Advisor</span>
                </button>
              </div>
            )}
          </section>

          {/* Quick Career Acceleration Toolkit */}
          <section className="rounded-[20px] p-6 bg-[#111827] border border-slate-800/90 shadow-md space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Career Acceleration Toolkit
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/skills')}
                className="w-full p-3 rounded-xl bg-[#1E293B]/50 hover:bg-[#1E293B] border border-slate-800/80 hover:border-slate-700 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#8B5CF6]/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <ChartBarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-purple-300 transition-colors">
                      Skill Gap Analysis
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">Target role roadmap</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => navigate('/placements')}
                className="w-full p-3 rounded-xl bg-[#1E293B]/50 hover:bg-[#1E293B] border border-slate-800/80 hover:border-slate-700 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <OfficeBuildingIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-amber-300 transition-colors">
                      Placement Drives
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">Campus hiring portal</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => navigate('/learning')}
                className="w-full p-3 rounded-xl bg-[#1E293B]/50 hover:bg-[#1E293B] border border-slate-800/80 hover:border-slate-700 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#10B981]/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <AcademicCapIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-emerald-300 transition-colors">
                      Learning Paths
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">Curated courses & labs</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Extracted Skills Interactive Modal (Dark 2026 SaaS Style) */}
      {showSkillsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] text-[#F8FAFC] rounded-[24px] max-w-xl w-full p-6 shadow-2xl border border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-[#6366F1]/15 text-[#818CF8] rounded-xl border border-[#6366F1]/30">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#F8FAFC] text-lg">Extracted Core Competencies</h3>
                  <p className="text-xs text-[#94A3B8]">
                    {extractedSkills.length} skills identified from {completedResume?.filename || 'your resume'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSkillsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E293B] transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Pills & Search */}
            <div className="space-y-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter extracted skills..."
                  value={skillModalSearch}
                  onChange={(e) => setSkillModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#1E293B] border border-slate-700/80 rounded-xl text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['All', 'Language', 'Framework', 'Database', 'DevOps & Cloud', 'AI & Data'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSkillFilterCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      skillFilterCategory === cat
                        ? 'bg-[#6366F1] text-white'
                        : 'bg-[#1E293B] text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills Badges Grid */}
            <div className="max-h-72 overflow-y-auto p-1 space-y-2">
              <div className="flex flex-wrap gap-2.5 items-center">
                {filteredModalSkills.length > 0 ? (
                  filteredModalSkills.map((skill, idx) => {
                    const name = typeof skill === 'string' ? skill : (skill?.name || skill?.skill || '')
                    const { badgeBg, icon, category } = categorizeSkill(name)

                    return (
                      <div
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${badgeBg}`}
                      >
                        <span className="text-[11px] opacity-80">{icon}</span>
                        <span>{name}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-60 font-mono ml-1">
                          {category}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center w-full">No skills match current filter.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowSkillsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowSkillsModal(false)
                  navigate('/skills')
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Analyze Target Role Gaps</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Find Faculty Advisor Modal (Dark 2026 SaaS Style) */}
      {showAdvisorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] text-[#F8FAFC] rounded-[24px] max-w-2xl w-full p-6 shadow-2xl border border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-xl border border-purple-500/30">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#F8FAFC] text-lg">Department Faculty Directory</h3>
                  <p className="text-xs text-[#94A3B8]">Request mentorship and career guidance from faculty members.</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAdvisorModal(false); setSelectedFacultyForRequest(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E293B]"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* If requesting a specific faculty */}
            {selectedFacultyForRequest ? (
              <div className="space-y-4 p-4 bg-[#1E293B]/60 rounded-xl border border-slate-700/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                      {selectedFacultyForRequest.full_name?.[0] || 'P'}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#F8FAFC] text-sm">{selectedFacultyForRequest.full_name}</h4>
                      <p className="text-xs text-[#94A3B8]">{selectedFacultyForRequest.department}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFacultyForRequest(null)}
                    className="text-xs text-[#818CF8] hover:underline"
                  >
                    Change Professor
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Introduction & Note to Professor (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Hi Professor, I am targeting a Cloud/Backend Software Engineer position and would appreciate your guidance on my placement preparation."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full text-xs bg-[#111827] border border-slate-700 rounded-xl p-3 text-[#F8FAFC] placeholder-slate-500 focus:ring-1 focus:ring-[#6366F1] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    onClick={() => setSelectedFacultyForRequest(null)}
                    className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700"
                  >
                    Back
                  </button>
                  <button
                    disabled={isSubmittingRequest}
                    onClick={() => handleSendMentorshipRequest(selectedFacultyForRequest.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {isSubmittingRequest ? 'Sending Request...' : 'Send Mentorship Request'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search professors by name, department, or college..."
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-[#1E293B] border border-slate-700 rounded-xl text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                  {filteredFacultyList.length > 0 ? (
                    filteredFacultyList.map((faculty) => (
                      <div
                        key={faculty.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#1E293B]/50 hover:bg-[#1E293B] rounded-xl border border-slate-800 hover:border-slate-700 transition-colors gap-3"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-sm flex-shrink-0 text-sm">
                            {faculty.full_name?.[0] || faculty.username?.[0] || 'P'}
                          </div>
                          <div>
                            <p className="font-bold text-[#F8FAFC] text-sm">{faculty.full_name}</p>
                            <p className="text-xs text-[#94A3B8]">{faculty.department} • {faculty.college || 'Faculty Advisor'}</p>
                            <p className="text-[11px] text-slate-500">{faculty.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {faculty.request_status === 'accepted' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center">
                              <CheckCircleIcon className="h-4 w-4 mr-1 text-emerald-400" />
                              Your Advisor
                            </span>
                          ) : faculty.request_status === 'pending' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1 text-amber-400" />
                              Request Pending
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedFacultyForRequest(faculty)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition-colors"
                            >
                              Request Mentorship
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No faculty advisors found in your department.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => { setShowAdvisorModal(false); setSelectedFacultyForRequest(null); }}
                className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Nomination Modal (Dark 2026 SaaS Style) */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] text-[#F8FAFC] rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Decline {declineTargetNomination?.company_name} Offer
              </h3>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#94A3B8]">
              Are you sure you want to decline this company placement selection? You can provide an optional note for your faculty coordinator (e.g. higher studies, accepted another offer).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason / Note (Optional)
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Planning to pursue Masters, or accepted another offer."
                className="w-full px-3 py-2 text-xs bg-[#1E293B] text-[#F8FAFC] border border-slate-700 rounded-xl focus:ring-1 focus:ring-rose-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isRespondingNomination === declineTargetNomination?.id}
                onClick={handleConfirmDecline}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {isRespondingNomination === declineTargetNomination?.id ? 'Processing...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard