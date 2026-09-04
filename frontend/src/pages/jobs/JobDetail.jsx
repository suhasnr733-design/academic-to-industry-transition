import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { useAuth } from '../../hooks/useAuth'
import { useResume } from '../../hooks/useResume'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { getJobDeadlineStatus } from '../../utils/jobDateUtils'
import { 
  ArrowLeftIcon, 
  LocationMarkerIcon as MapPinIcon, 
  CurrencyDollarIcon as CurrencyRupeeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ShareIcon,
  BookmarkIcon,
  StarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/outline'
import { BookmarkIcon as BookmarkSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/solid'
import toast from 'react-hot-toast'

export const JobDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { resumes } = useResume()
  const { 
    getJobById, 
    isLoading, 
    error,
    toggleJobInterest, 
    isJobInterested, 
    interestedJobs, 
    updateInterestStatus, 
    fetchInterestedJobs 
  } = useJobs()
  const [job, setJob] = React.useState(null)
  const [mentees, setMentees] = React.useState([])
  const [loadingMentees, setLoadingMentees] = React.useState(false)
  const [isSubmittingApp, setIsSubmittingApp] = React.useState(false)

  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin'

  const activeResume = resumes?.find(r => r.status === 'completed') || resumes?.[0]
  const hasActiveResume = Boolean(activeResume && (activeResume.status === 'completed' || (activeResume.skills && activeResume.skills.length > 0)))

  const userSkills = React.useMemo(() => {
    return (activeResume?.skills || []).map(s => String(s).toLowerCase().trim())
  }, [activeResume])

  const calculateFitScore = React.useCallback((jobData) => {
    if (!jobData) return 0
    const titleLower = (jobData.title || '').toLowerCase()
    
    // Non-tech filter
    const nonTech = ['account executive', 'sales', 'marketing', 'recruiter', 'tax', 'nurse', 'cook']
    if (nonTech.some(nt => titleLower.includes(nt))) return 20

    if (!activeResume || !hasActiveResume) return 65

    let score = 0
    const jobSkills = (jobData.required_skills || []).map(s => String(s || '').toLowerCase().trim())
    const eduText = JSON.stringify(activeResume?.education || []).toLowerCase()
    const projText = JSON.stringify(activeResume?.projects || []).toLowerCase()
    const expText = JSON.stringify(activeResume?.experience || {}).toLowerCase()

    let matchedCount = 0
    if (jobSkills.length > 0 && userSkills.length > 0) {
      const matched = jobSkills.filter(req => 
        userSkills.some(uSkill => uSkill.includes(req) || req.includes(uSkill)) ||
        projText.includes(req) || expText.includes(req)
      )
      matchedCount = matched.length
      score += Math.round((matchedCount / jobSkills.length) * 35)
    } else {
      score += 20
    }

    const projects = activeResume.projects || []
    score += projects.length >= 2 ? 20 : projects.length === 1 ? 14 : 8

    if (eduText.includes('engineering') || eduText.includes('b.e') || eduText.includes('b.tech') || eduText.includes('mca') || eduText.includes('computer')) {
      score += 15
    } else {
      score += 8
    }

    score += 15 // Tooling & Experience baseline

    const jobLoc = (jobData.location || '').toLowerCase()
    const userLoc = (activeResume?.location || 'bangalore').toLowerCase()
    score += (!jobLoc || jobLoc.includes('remote') || jobLoc.includes('campus') || jobLoc.includes(userLoc)) ? 10 : 5

    return Math.min(98, Math.max(35, score))
  }, [activeResume, hasActiveResume, userSkills])

  const effectiveMatchScore = React.useMemo(() => {
    if (location.state?.matchScore) return Number(location.state.matchScore)
    if (job?.match_score) return Number(job.match_score)
    if (user?.role === 'student' && job) {
      return calculateFitScore(job)
    }
    return null
  }, [location.state, job, user, calculateFitScore])

  const existingInterest = React.useMemo(() => {
    if (!job || !interestedJobs) return null
    const jobId = job.id && typeof job.id === 'number' ? job.id : null
    const extId = job.external_id || (typeof job.id === 'string' ? job.id : null)
    return interestedJobs.find(
      (i) => (jobId && i.job_id === jobId) || (extId && i.external_job_id === extId) || (i.job_title === job.title && i.company === job.company)
    )
  }, [job, interestedJobs])

  const isAlreadyApplied = Boolean(
    existingInterest && ['applied', 'interviewing', 'shortlisted', 'offer'].includes(existingInterest.status)
  )

  const handleSubmitCampusApplication = async () => {
    if (!user) {
      toast.error('Please log in to submit a campus application')
      return
    }
    if (!job) return
    try {
      setIsSubmittingApp(true)
      if (existingInterest) {
        await updateInterestStatus(existingInterest.id, 'applied', 'Submitted via Campus Job Portal')
      } else {
        const payload = {
          job_id: job.id && typeof job.id === 'number' ? job.id : null,
          external_job_id: job.external_id || (typeof job.id === 'string' ? job.id : null),
          job_title: job.title,
          company: job.company,
          status: 'applied',
          notes: 'Submitted via Campus Job Portal',
          job_data: {
            location: job.location,
            salary_range: job.salary_range,
            job_type: job.job_type,
            required_skills: job.required_skills,
            apply_url: job.apply_url,
            source: job.source || 'internal',
            match_score: job.match_score
          }
        }
        await api.post('/jobs/interested', payload)
        if (fetchInterestedJobs) {
          await fetchInterestedJobs()
        }
      }
      toast.success(`🎉 Application submitted for ${job.title} at ${job.company}!`)
      const externalUrl = job.apply_url || job.source_url
      if (externalUrl) {
        window.open(externalUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      console.error('Error submitting campus application:', err)
      toast.error(err.response?.data?.error || 'Failed to submit campus application')
    } finally {
      setIsSubmittingApp(false)
    }
  }

  React.useEffect(() => {
    const fetchJob = async () => {
      const data = await getJobById(id)
      setJob(data)
    }
    fetchJob()
  }, [id, getJobById])

  React.useEffect(() => {
    const fetchInterestedMentees = async () => {
      if (!isFacultyOrAdmin || !id) return
      try {
        setLoadingMentees(true)
        const res = await api.get(`/jobs/${id}/interested-mentees`)
        setMentees(res.data?.mentees || [])
      } catch (err) {
        console.error('Error fetching interested mentees:', err)
      } finally {
        setLoadingMentees(false)
      }
    }
    fetchInterestedMentees()
  }, [id, isFacultyOrAdmin])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this position at ${job?.company}`,
        url: window.location.href
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-3" />
        <p className="text-sm text-gray-400 font-medium">Retrieving opportunity details...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-lg">
          <BriefcaseIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Opportunity Not Found or Expired</h3>
        <p className="text-sm text-gray-400 mb-6">
          {error || 'This live opportunity or campus placement drive could not be located. It may have expired or been removed.'}
        </p>
        <Button onClick={() => navigate('/jobs')} className="px-6 py-2.5 text-sm font-semibold">
          Explore Active Opportunities
        </Button>
      </div>
    )
  }

  const isSaved = isJobInterested(job)

  const formatSalaryDisplay = (salaryRaw, description = '', title = '', location = '') => {
    let s = String(salaryRaw || '').trim()

    if (!s || s.toLowerCase().includes('competitive')) {
      const descText = String(description || '')
      const descHourlyMatch = descText.match(/(?:salary|pay|rate|compensation)?[:\s]*\$(\d+)\s*(?:-|to)\s*\$?(\d+)\s*(?:\/|\s+per\s+)?(?:hr|hour)/i)
      if (descHourlyMatch) {
        s = `$${descHourlyMatch[1]} - $${descHourlyMatch[2]} / hr`
      } else {
        const descSalaryMatch = descText.match(/(?:salary|pay|compensation)?[:\s]*\$?(\d{2,3}[,\d]*)\s*(?:-|to)\s*\$?(\d{2,3}[,\d]*)/i)
        if (descSalaryMatch) {
          const num1 = descSalaryMatch[1].replace(/,/g, '')
          const num2 = descSalaryMatch[2].replace(/,/g, '')
          if (parseInt(num1, 10) >= 10000 && parseInt(num2, 10) >= 10000) {
            s = `$${descSalaryMatch[1]} - $${descSalaryMatch[2]}`
          }
        }
      }
    }

    if (s && !s.toLowerCase().includes('competitive')) {
      if (s.includes('₹') || s.toLowerCase().includes('lpa') || s.toLowerCase().includes('inr')) {
        return s
      }

      const hourlyMatch = s.match(/\$?(\d+)(?:\s*(?:-|to)\s*\$?(\d+))?\s*(?:\/|\s+per\s+)?(?:hr|hour)/i)
      if (hourlyMatch) {
        const minHourly = parseInt(hourlyMatch[1], 10)
        const maxHourly = hourlyMatch[2] ? parseInt(hourlyMatch[2], 10) : minHourly
        const minINRInCr = ((minHourly * 2000 * 85) / 10000000).toFixed(1)
        const maxINRInCr = ((maxHourly * 2000 * 85) / 10000000).toFixed(1)
        
        if (minHourly === maxHourly) {
          return `$${minHourly}/hr (~₹${minINRInCr} Cr/yr)`
        }
        return `$${minHourly} - $${maxHourly}/hr (~₹${minINRInCr} - ${maxINRInCr} Cr/yr)`
      }

      const annualUSDMatch = s.match(/\$?(\d+[\d,]*)(?:k)?\s*(?:-|to)\s*\$?(\d+[\d,]*)(?:k)?/i)
      if (annualUSDMatch) {
        let minUSD = parseInt(annualUSDMatch[1].replace(/,/g, ''), 10)
        let maxUSD = parseInt(annualUSDMatch[2].replace(/,/g, ''), 10)
        if (minUSD < 1000) minUSD *= 1000
        if (maxUSD < 1000) maxUSD *= 1000

        if (minUSD >= 10000) {
          const minLPA = ((minUSD * 85) / 100000).toFixed(1)
          const maxLPA = ((maxUSD * 85) / 100000).toFixed(1)
          return `$${(minUSD/1000).toFixed(0)}k - $${(maxUSD/1000).toFixed(0)}k / yr (~₹${minLPA} - ${maxLPA} LPA)`
        }
      }

      const singleMatch = s.match(/\$?(\d+[\d,]*)(?:k)?\s*(?:\/|\s+per\s+)?(?:yr|year)?/i)
      if (singleMatch) {
        let val = parseInt(singleMatch[1].replace(/,/g, ''), 10)
        if (val < 1000) val *= 1000
        if (val >= 10000) {
          const lpa = ((val * 85) / 100000).toFixed(1)
          return `$${(val/1000).toFixed(0)}k/yr (~₹${lpa} LPA)`
        }
      }
    }

    const t = (title || '').toLowerCase()
    const loc = (location || '').toLowerCase()
    const isGlobalOrRemote = loc.includes('remote') || loc.includes('global') || loc.includes('london') || loc.includes('us') || loc.includes('uk') || loc.includes('europe') || loc.includes('germany') || loc.includes('munich') || loc.includes('berlin')

    if (t.includes('staff') || t.includes('principal') || t.includes('architect') || t.includes('director') || t.includes('head')) {
      return isGlobalOrRemote ? '₹35,00,000 - ₹65,00,000 / yr (Market Est.)' : '₹25,00,000 - ₹45,00,000 / yr (Market Est.)'
    }
    if (t.includes('senior') || t.includes('sr.') || t.includes('lead') || t.includes('expert')) {
      return isGlobalOrRemote ? '₹22,00,000 - ₹42,00,000 / yr (Market Est.)' : '₹16,00,000 - ₹30,00,000 / yr (Market Est.)'
    }
    if (t.includes('intern') || t.includes('trainee')) {
      return '₹25,000 - ₹60,000 / mo (Stipend Est.)'
    }
    if (t.includes('associate') || t.includes('junior') || t.includes('support') || t.includes('fresher')) {
      return '₹4,50,000 - ₹9,00,000 / yr (Market Est.)'
    }
    if (t.includes('developer') || t.includes('engineer') || t.includes('scientist') || t.includes('devops') || t.includes('cloud') || t.includes('security')) {
      return isGlobalOrRemote ? '₹14,00,000 - ₹28,00,000 / yr (Market Est.)' : '₹9,00,000 - ₹18,00,000 / yr (Market Est.)'
    }

    return '₹6,00,000 - ₹12,00,000 / yr (Market Est.)'
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-gray-400 hover:text-white mb-6 font-medium text-sm transition-colors group"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
        Back to Campus Board & Jobs
      </button>

      <div className="bg-[#111827] rounded-2xl shadow-2xl border border-gray-800/80 overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-800 bg-gradient-to-b from-[#1E293B]/40 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">{job.title}</h1>
                {job.source && (
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full uppercase">
                    {job.source}
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-indigo-400 mt-1">{job.company}</p>
            </div>
            <div className="flex items-center space-x-2">
              {!isFacultyOrAdmin && (
                <button
                  onClick={() => toggleJobInterest(job)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSaved 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-md shadow-amber-500/10' 
                      : 'bg-[#1E293B] text-gray-400 border-gray-700/80 hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10'
                  }`}
                  title={isSaved ? "Saved to Campus Board" : "Save to Campus Board"}
                >
                  {isSaved ? <StarSolidIcon className="h-5 w-5 text-amber-400" /> : <StarIcon className="h-5 w-5" />}
                </button>
              )}
              <Button variant="secondary" size="sm" onClick={handleShare} title="Share Opportunity">
                <ShareIcon className="h-4 w-4 text-gray-300" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-gray-400">
            {job.location && (
              <span className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                {job.location}
              </span>
            )}
            <span className="flex items-center font-semibold text-emerald-400">
              <CurrencyRupeeIcon className="h-4 w-4 mr-1 text-emerald-400" />
              {formatSalaryDisplay(job.salary_range, job.description, job.title, job.location)}
            </span>
            {job.job_type && (
              <span className="flex items-center">
                <BriefcaseIcon className="h-4 w-4 mr-1 text-gray-400" />
                {job.job_type}
              </span>
            )}
            {job.posted_date && (
              <span className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                Posted {new Date(job.posted_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Match Score */}
        {effectiveMatchScore > 0 && (
          <div className="p-6 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border-b border-indigo-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Academic Skill Match</h4>
                <p className="text-xs text-gray-400">Calculated against your parsed resume competencies</p>
              </div>
              <div className="text-2xl font-black text-indigo-400">
                {Math.round(effectiveMatchScore)}%
              </div>
            </div>
            <div className="mt-3 w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-lg shadow-indigo-500/50"
                style={{ width: `${Math.round(effectiveMatchScore)}%` }}
              />
            </div>
          </div>
        )}

        {/* Application Deadline & Hiring Status Banner */}
        {(() => {
          const status = getJobDeadlineStatus(job)

          if (status.type === 'CLOSED') {
            return (
              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-amber-300">
                  <ClockIcon className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{status.label}</p>
                    <p className="text-xs text-amber-400/80">{status.subText}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold">Closed</span>
              </div>
            )
          }

          if (status.type === 'CLOSING_TODAY' || status.type === 'URGENT_1_DAY') {
            return (
              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3 text-rose-300">
                  <ClockIcon className="h-5 w-5 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{status.detailText}</p>
                    <p className="text-xs text-rose-400/80">{status.subText}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold">
                  {status.type === 'CLOSING_TODAY' ? 'Closes Today' : '1 Day Left'}
                </span>
              </div>
            )
          }

          if (status.type === 'CLOSING_SOON') {
            return (
              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-amber-300">
                  <ClockIcon className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{status.detailText}</p>
                    <p className="text-xs text-amber-400/80">{status.subText}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold">
                  {status.label.includes('2 days') ? '2 Days Left' : status.label}
                </span>
              </div>
            )
          }

          if (status.type === 'ACTIVE_DEADLINE') {
            return (
              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-[#1E293B]/70 border border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-300">
                  <ClockIcon className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{status.detailText}</p>
                    <p className="text-xs text-gray-400">{status.subText}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-semibold">
                  Active Deadline
                </span>
              </div>
            )
          }

          return (
            <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">{status.detailText}</p>
                  <p className="text-xs text-emerald-400/80">{status.subText}</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold rounded-md text-xs">
                Active Opening
              </span>
            </div>
          )
        })()}

        {/* Description */}
        <div className="p-6 md:p-8">
          <h4 className="font-bold text-white text-base mb-3">Role Overview & Responsibilities</h4>
          <div className="prose max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
            {job.description || 'No detailed description provided for this campus opportunity.'}
          </div>
        </div>

        {/* Candidate Eligibility & Cohort */}
        {(job.eligibility?.length > 0 || job.raw_data?.eligibility?.length > 0) && (
          <div className="p-6 md:p-8 border-t border-gray-800 bg-[#0F172A]/40">
            <h4 className="font-bold text-white text-sm mb-3">Eligibility & Candidate Cohort</h4>
            <div className="flex flex-wrap gap-2">
              {(job.eligibility || job.raw_data?.eligibility || []).map((elig, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20 rounded-lg text-xs"
                >
                  {elig}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Required Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="p-6 md:p-8 border-t border-gray-800 bg-[#0F172A]/60">
            <h4 className="font-bold text-white text-sm mb-3">Required Technical Competencies</h4>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-[#1E293B] text-gray-200 font-medium border border-gray-700/80 rounded-lg text-xs hover:border-indigo-500/40 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-800 bg-[#0F172A] flex flex-col sm:flex-row gap-3">
          {isFacultyOrAdmin ? (
            <>
              {job.apply_url && (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all text-center text-sm"
                >
                  View Official Company Posting ↗
                </a>
              )}
              <Button 
                variant="secondary"
                className="flex-1 py-3 font-semibold flex items-center justify-center gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-950/40"
                onClick={() => navigate('/faculty?tab=students&scope=mentees')}
              >
                <span>🎓</span> Return to Faculty Portal
              </Button>
            </>
          ) : (
            <>
              {(job.is_closed || job.status === 'closed') ? (
                <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1E293B] border border-gray-700 text-gray-400 font-bold rounded-xl shadow-sm text-sm cursor-not-allowed">
                  <ClockIcon className="h-5 w-5 text-gray-500" />
                  <span>Application Closed</span>
                </div>
              ) : job.apply_url ? (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-center text-sm"
                >
                  Apply on Company Portal ↗
                </a>
              ) : isAlreadyApplied ? (
                <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl shadow-sm text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                  <span>Application Submitted ({existingInterest?.status?.toUpperCase() || 'APPLIED'})</span>
                </div>
              ) : (
                <Button
                  onClick={handleSubmitCampusApplication}
                  disabled={isSubmittingApp}
                  className="flex-1 py-3 text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingApp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <span>Submit Campus Application</span>
                  )}
                </Button>
              )}
              <Button 
                variant={isSaved ? "secondary" : "outline"} 
                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 ${
                  isSaved ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : ''
                }`}
                onClick={() => toggleJobInterest(job)}
              >
                {isSaved ? <StarSolidIcon className="h-5 w-5 text-amber-400" /> : <StarIcon className="h-5 w-5" />}
                {isSaved ? "Saved to Campus Board ⭐" : "Save to Campus Board"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Faculty Advisor Mentee Card */}
      {isFacultyOrAdmin && (
        <div className="mt-8 bg-[#111827] rounded-2xl shadow-xl border border-purple-500/30 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Assigned Mentees Interested
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    {mentees.length}
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Accepted mentees from your cohort who marked interest or applied to {job.company}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/faculty?tab=students&scope=mentees')}
              className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-purple-950/40 text-purple-300 border border-purple-500/30 transition-colors"
            >
              Open Faculty Portal
              <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
            </button>
          </div>

          <div className="p-6">
            {loadingMentees ? (
              <div className="flex items-center justify-center py-8 space-x-3 text-purple-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                <span className="text-xs font-medium">Checking your mentee cohort...</span>
              </div>
            ) : mentees.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {mentees.map((m) => (
                  <div key={m.student_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-950/20 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {m.full_name?.[0] || m.username?.[0] || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{m.full_name || m.username}</p>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                            m.interest_status === 'offer'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : m.interest_status === 'interviewing'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : m.interest_status === 'applied'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {m.interest_status || 'Interested'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.department || 'Student'} {m.year_of_study ? `• Year ${m.year_of_study}` : ''} • {m.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => navigate(`/faculty?scope=mentees&selectedStudent=${m.student_id}&tab=students`)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg transition-all"
                      >
                        Go to Faculty Mentee Page
                        <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-[#0F172A]/50 rounded-xl border border-dashed border-gray-800">
                <UserGroupIcon className="h-9 w-9 text-gray-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-300 text-sm">No Accepted Mentees Interested Yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  When one of your accepted mentees saves this job or applies to {job.company}, they will automatically appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobDetail