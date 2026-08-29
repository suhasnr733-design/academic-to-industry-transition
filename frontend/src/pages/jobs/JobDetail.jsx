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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Retrieving opportunity details...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
          <BriefcaseIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Opportunity Not Found or Expired</h3>
        <p className="text-sm text-slate-600 mb-6">
          {error || 'This live web opportunity or campus placement drive could not be located. It may have expired or been removed by the provider.'}
        </p>
        <Button onClick={() => navigate('/jobs')} className="px-6 py-2.5 text-sm font-semibold">
          Explore Active Campus & Live Opportunities
        </Button>
      </div>
    )
  }

  const isSaved = isJobInterested(job)

  const formatSalaryDisplay = (salaryRaw, description = '', title = '', location = '') => {
    let s = String(salaryRaw || '').trim()

    // 1. If salaryRaw is missing or 'Competitive', scan description for embedded salary
    if (!s || s.toLowerCase().includes('competitive')) {
      const descText = String(description || '')
      
      // Look for patterns like "Salary: 65,000-75,000" or "$90-$150/hr" or "€50,000 - €70,000"
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

    // 2. If a concrete numeric salary exists, convert to LPA / Cr
    if (s && !s.toLowerCase().includes('competitive')) {
      // If already formatted in INR (₹ or LPA)
      if (s.includes('₹') || s.toLowerCase().includes('lpa') || s.toLowerCase().includes('inr')) {
        return s
      }

      // Handle Hourly Rates (e.g. "$90 - $150 / hr" or "$50/hr")
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

      // Handle Annual USD Rates (e.g. "$80,000 - $120,000" or "$80k - $120k" or "65,000-75,000")
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

      // Handle single annual figure (e.g. "$120,000 / year")
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

    // 3. Fallback: Compute Realistic Market Benchmark based on Role & Seniority
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
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium text-sm transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Campus Board & Jobs
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Heading level={2}>{job.title}</Heading>
                {job.source && (
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full uppercase">
                    {job.source}
                  </span>
                )}
              </div>
              <p className="text-xl font-semibold text-primary-600 mt-1">{job.company}</p>
            </div>
            <div className="flex items-center space-x-2">
              {!isFacultyOrAdmin && (
                <button
                  onClick={() => toggleJobInterest(job)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSaved 
                      ? 'bg-amber-50 text-amber-500 border-amber-200 shadow-xs' 
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title={isSaved ? "Saved to Campus Board" : "Save to Campus Board"}
                >
                  {isSaved ? <StarSolidIcon className="h-5 w-5 text-amber-500" /> : <StarIcon className="h-5 w-5" />}
                </button>
              )}
              <Button variant="ghost" size="sm" onClick={handleShare} title="Share Opportunity">
                <ShareIcon className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
            {job.location && (
              <span className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                {job.location}
              </span>
            )}
            <span className="flex items-center font-medium text-emerald-700">
              <CurrencyRupeeIcon className="h-4 w-4 mr-1 text-emerald-600" />
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
          <div className="p-6 bg-gradient-to-r from-primary-50 to-indigo-50 border-b border-primary-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">Academic Skill Match</h4>
                <p className="text-sm text-gray-600">Calculated against your parsed resume competencies</p>
              </div>
              <div className="text-3xl font-extrabold text-primary-700">
                {Math.round(effectiveMatchScore)}%
              </div>
            </div>
            <div className="mt-2 w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full"
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
              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-amber-900">
                  <ClockIcon className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{status.label}</p>
                    <p className="text-xs text-amber-700">{status.subText}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs">Closed</span>
              </div>
            )
          }

          if (status.type === 'CLOSING_TODAY' || status.type === 'URGENT_1_DAY') {
            return (
              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3 text-rose-800">
                  <ClockIcon className="h-6 w-6 text-rose-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{status.detailText}</p>
                    <p className="text-xs text-rose-600">{status.subText}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-xs">
                  {status.type === 'CLOSING_TODAY' ? 'Closes Today' : '1 Day Left'}
                </span>
              </div>
            )
          }

          if (status.type === 'CLOSING_SOON') {
            return (
              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-amber-900">
                  <ClockIcon className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{status.detailText}</p>
                    <p className="text-xs text-amber-700">{status.subText}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs">
                  {status.label.includes('2 days') ? '2 Days Left' : status.label}
                </span>
              </div>
            )
          }

          if (status.type === 'ACTIVE_DEADLINE') {
            return (
              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-slate-800">
                  <ClockIcon className="h-5 w-5 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{status.detailText}</p>
                    <p className="text-xs text-slate-500">{status.subText}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                  Active Deadline
                </span>
              </div>
            )
          }

          // Rolling admissions banner
          return (
            <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-emerald-950">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">{status.detailText}</p>
                  <p className="text-xs text-emerald-700">{status.subText}</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 rounded-md text-xs">
                Active Opening
              </span>
            </div>
          )
        })()}

        {/* Description */}
        <div className="p-6 md:p-8">
          <h4 className="font-bold text-gray-900 text-lg mb-3">Role Overview & Responsibilities</h4>
          <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
            {job.description || 'No detailed description provided for this campus opportunity.'}
          </div>
        </div>

        {/* Candidate Eligibility & Cohort */}
        {(job.eligibility?.length > 0 || job.raw_data?.eligibility?.length > 0) && (
          <div className="p-6 md:p-8 border-t border-gray-100 bg-white">
            <h4 className="font-bold text-gray-900 text-base mb-3">Eligibility & Candidate Cohort</h4>
            <div className="flex flex-wrap gap-2">
              {(job.eligibility || job.raw_data?.eligibility || []).map((elig, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200 rounded-lg text-xs"
                >
                  {elig}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Required Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-gray-900 text-base mb-3">Required Technical Competencies</h4>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-white text-gray-800 font-semibold border border-gray-200 rounded-lg text-xs shadow-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
          {isFacultyOrAdmin ? (
            /* ================= FACULTY ACTION VIEW ================= */
            <>
              {job.apply_url && (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all text-center text-sm"
                >
                  View Official Company Posting ↗
                </a>
              )}
              <Button 
                variant="outline"
                className="flex-1 py-3 font-semibold flex items-center justify-center gap-2 border-purple-200 text-purple-700 bg-white hover:bg-purple-50"
                onClick={() => navigate('/faculty?tab=students&scope=mentees')}
              >
                <span>🎓</span> Return to Faculty Portal
              </Button>
            </>
          ) : (
            /* ================= STUDENT ACTION VIEW ================= */
            <>
              {(job.is_closed || job.status === 'closed') ? (
                <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 border border-slate-300 text-slate-600 font-bold rounded-xl shadow-xs text-sm cursor-not-allowed">
                  <ClockIcon className="h-5 w-5 text-slate-400" />
                  <span>Application Closed</span>
                </div>
              ) : job.apply_url ? (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-all text-center text-sm"
                >
                  Apply on Company Portal ↗
                </a>
              ) : isAlreadyApplied ? (
                <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-xl shadow-xs text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                  <span>Application Submitted ({existingInterest?.status?.toUpperCase() || 'APPLIED'})</span>
                </div>
              ) : (
                <Button
                  onClick={handleSubmitCampusApplication}
                  disabled={isSubmittingApp}
                  className="flex-1 py-3 text-base font-bold bg-primary-600 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2"
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
                  isSaved ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : ''
                }`}
                onClick={() => toggleJobInterest(job)}
              >
                {isSaved ? <StarSolidIcon className="h-5 w-5 text-amber-500" /> : <StarIcon className="h-5 w-5" />}
                {isSaved ? "Saved to Campus Board ⭐" : "Save to Campus Board"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Faculty Advisor Mentee Card */}
      {isFacultyOrAdmin && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-primary-900 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <AcademicCapIcon className="h-6 w-6 text-purple-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Assigned Mentees Interested
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-400/30 text-purple-100 border border-purple-300/30">
                    {mentees.length}
                  </span>
                </h3>
                <p className="text-xs text-purple-200">
                  Accepted mentees from your cohort who marked interest or applied to {job.company}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/faculty?tab=students&scope=mentees')}
              className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              Open Faculty Portal
              <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
            </button>
          </div>

          <div className="p-6">
            {loadingMentees ? (
              <div className="flex items-center justify-center py-8 space-x-3 text-purple-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                <span className="text-sm font-medium">Checking your mentee cohort...</span>
              </div>
            ) : mentees.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {mentees.map((m) => (
                  <div key={m.student_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/40 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {m.full_name?.[0] || m.username?.[0] || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{m.full_name || m.username}</p>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                            m.interest_status === 'offer'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.interest_status === 'interviewing'
                              ? 'bg-blue-100 text-blue-800'
                              : m.interest_status === 'applied'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {m.interest_status || 'Interested'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.department || 'Student'} {m.year_of_study ? `• Year ${m.year_of_study}` : ''} • {m.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => navigate(`/faculty?scope=mentees&selectedStudent=${m.student_id}&tab=students`)}
                        className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-100/70 hover:bg-purple-200 rounded-lg transition-all shadow-xs"
                      >
                        Go to Faculty Mentee Page
                        <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                <UserGroupIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 text-sm">No Accepted Mentees Interested Yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  When one of your accepted mentees saves this job or applies to {job.company}, they will automatically appear here with direct links to their profile.
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