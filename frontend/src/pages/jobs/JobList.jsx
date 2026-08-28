import React, { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { 
  BriefcaseIcon, 
  LocationMarkerIcon as MapPinIcon, 
  CurrencyDollarIcon as CurrencyRupeeIcon,
  SearchIcon,
  ExternalLinkIcon,
  GlobeIcon,
  SparklesIcon,
  AcademicCapIcon,
  LightningBoltIcon,
  StarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  AdjustmentsIcon,
  TagIcon,
  CheckIcon,
  XIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/solid'

const CAMPUS_PRESET_TAGS = [
  'Software Engineer', 'Data Scientist', 'Python', 'Java', 'SQL', 
  'AWS', 'Docker', 'Machine Learning', 'Bangalore', 'Hyderabad'
]

const LIVE_PRESET_TAGS = [
  'Remote', 'Frontend', 'Backend', 'Full Stack', 'DevOps', 
  'React', 'Node.js', 'Python', 'Bangalore', 'Internship'
]

const INDUSTRY_BRIDGE_TOOLS = [
  // 1. Version Control & Collaboration
  'git', 'github', 'gitlab', 'bitbucket', 'jira', 'agile', 'scrum',
  // 2. Cloud, Containers & OS
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'ubuntu', 'terraform',
  // 3. API Design, Frameworks & Architecture
  'rest api', 'restful', 'graphql', 'fastapi', 'swagger', 'postman', 'microservices', 'grpc',
  // 4. CI/CD, DevOps & Automation
  'ci/cd', 'github actions', 'jenkins', 'gitlab ci', 'devops', 'ansible',
  // 5. Testing & Quality Assurance
  'unit testing', 'jest', 'pytest', 'junit', 'selenium', 'cypress', 'mocha',
  // 6. Production DBs, Caching & Queues
  'redis', 'kafka', 'rabbitmq', 'nginx', 'postgresql', 'mongodb'
]

export const JobList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { resumes } = useResume()
  const activeResume = resumes?.find(r => r.status === 'completed') || resumes?.[0]
  const hasActiveResume = Boolean(activeResume && (activeResume.status === 'completed' || (activeResume.skills && activeResume.skills.length > 0)))

  const userSkills = useMemo(() => {
    return (activeResume?.skills || []).map(s => String(s).toLowerCase().trim())
  }, [activeResume])

  // 6-Pillar Resume-Driven Fit Score Calculation for B.E. Engineering Students
  const calculateMatchScore = (job) => {
    const titleLower = (job.title || '').toLowerCase()
    const descLower = (job.description || '').toLowerCase()

    // 0. Gatekeeper: Non-tech and divergent jobs get low score (20%)
    const nonTechList = [
      'account executive', 'account manager', 'sales', 'marketing', 'business development',
      'bdr', 'sdr', 'recruiter', 'talent acquisition', 'human resources', 'customer success',
      'customer support', 'client success', 'operations manager', 'copywriter', 'content writer',
      'tax preparer', 'tax accountant', 'tax manager', 'cpa', 'accounting', 'bookkeeper',
      'gardener', 'landscaping', 'chiropract', 'housekeeping', 'cashier', 'store associate',
      'now hiring', 'delivery driver', 'warehouse worker', 'nurse', 'nursing', 'medical', 'cook'
    ]
    if (nonTechList.some(nt => titleLower.includes(nt))) {
      return 20
    }

    // Tech role indicator check
    const techIndicators = [
      'developer', 'engineer', 'architect', 'scientist', 'analyst', 'programmer',
      'devops', 'sre', 'dba', 'qa', 'sdet', 'cloud', 'data', 'software', 'frontend',
      'backend', 'fullstack', 'full stack', 'mobile', 'android', 'ios', 'system',
      'network', 'security', 'machine learning', 'artificial intelligence', 'nlp', 'vision',
      'intern', 'trainee', 'technical', 'technology', 'web', 'ui/ux', 'coder', 'lead', 'head of engineering'
    ]
    const isTechTitle = techIndicators.some(ti => titleLower.includes(ti))

    // If not a tech title, strictly classify as low non-tech match
    if (!isTechTitle) {
      return 20
    }

    if (!activeResume || !hasActiveResume) {
      return 60
    }

    let score = 0
    const jobSkills = (job.required_skills || []).map(s => String(s).toLowerCase().trim())
    const eduText = JSON.stringify(activeResume.education || []).toLowerCase()
    const projText = JSON.stringify(activeResume.projects || []).toLowerCase()
    const expText = JSON.stringify(activeResume.experience || {}).toLowerCase()

    // -------------------------------------------------------------
    // Pillar 1: Technical Core Skills Match (35 Points)
    // -------------------------------------------------------------
    let matchedCount = 0
    if (jobSkills.length > 0 && userSkills.length > 0) {
      const matched = jobSkills.filter(req => 
        userSkills.some(uSkill => uSkill.includes(req) || req.includes(uSkill)) ||
        projText.includes(req) || expText.includes(req)
      )
      matchedCount = matched.length
      const ratio = matchedCount / jobSkills.length
      score += Math.round(ratio * 35)
    } else {
      // Check title keywords against user skills
      const titleMatches = userSkills.filter(u => titleLower.includes(u))
      if (titleMatches.length > 0) {
        score += 28
      } else {
        score += 15
      }
    }

    // -------------------------------------------------------------
    // Pillar 2: Hands-on Projects & Code Portfolio (20 Points)
    // -------------------------------------------------------------
    const projects = activeResume.projects || []
    if (projects.length >= 2) {
      score += 20
    } else if (projects.length === 1) {
      score += 14
    } else {
      score += 8
    }

    // -------------------------------------------------------------
    // Pillar 3: Academic Degree & Major Alignment (15 Points)
    // -------------------------------------------------------------
    if (eduText.includes('b.e') || eduText.includes('b.tech') || eduText.includes('bachelor') || eduText.includes('engineering') || eduText.includes('mca')) {
      score += 10
    } else {
      score += 5
    }
    if (eduText.includes('computer') || eduText.includes('information') || eduText.includes('cse') || eduText.includes('ise') || eduText.includes('ece') || eduText.includes('data')) {
      score += 5
    }

    // -------------------------------------------------------------
    // Pillar 4: Industry Bridge Tooling Readiness (10 Points)
    // -------------------------------------------------------------
    const matchedTools = INDUSTRY_BRIDGE_TOOLS.filter(tool => 
      userSkills.some(s => s.includes(tool)) || projText.includes(tool) || expText.includes(tool)
    )
    if (matchedTools.length >= 3) {
      score += 10
    } else if (matchedTools.length >= 1) {
      score += 7
    } else {
      score += 4
    }

    // -------------------------------------------------------------
    // Pillar 5: Internship & Industry Experience (10 Points)
    // -------------------------------------------------------------
    if (expText.includes('intern') || expText.includes('trainee') || expText.includes('developer') || expText.includes('engineer') || expText.includes('freelance')) {
      score += 10
    } else {
      score += 5 // Fresher baseline
    }

    // -------------------------------------------------------------
    // Pillar 6: Location & Work Mode Alignment (10 Points)
    // -------------------------------------------------------------
    const jobLoc = (job.location || '').toLowerCase()
    const userLoc = (activeResume.location || 'bangalore').toLowerCase()
    if (!jobLoc || jobLoc.includes('remote') || jobLoc.includes('campus') || jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) {
      score += 10
    } else {
      score += 5
    }

    // If job has required skills and user matched 0 of them, clamp score so it never falsely reaches 90%+
    if (jobSkills.length > 0 && matchedCount === 0) {
      return Math.min(score, 50)
    }

    // Clamp normalized score between 35% and 98%
    return Math.min(98, Math.max(35, score))
  }

  const { 
    jobs, 
    interestedJobs,
    isLoading, 
    domains, 
    total, 
    isLiveMode, 
    setIsLiveMode, 
    fetchJobs, 
    fetchLiveJobs,
    toggleJobInterest,
    updateInterestStatus,
    isJobInterested
  } = useJobs()

  const [campusTab, setCampusTab] = useState('all') // 'all' | 'interested'
  const [customAddedTags, setCustomAddedTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [customInput, setCustomInput] = useState('')

  const [filters, setFilters] = useState({
    domain: searchParams.get('domain') || '',
    location: searchParams.get('location') || '',
    search: searchParams.get('search') || '',
  })

  // Dynamic quick-add presets based on current tab mode
  const activePresetTags = useMemo(() => {
    const base = isLiveMode ? LIVE_PRESET_TAGS : CAMPUS_PRESET_TAGS
    const customOnly = customAddedTags.filter(t => !base.some(b => b.toLowerCase() === t.toLowerCase()))
    return [...base, ...customOnly]
  }, [isLiveMode, customAddedTags])

  const handleToggleTag = (tag) => {
    const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())
    const updated = isSelected
      ? selectedTags.filter(t => t.toLowerCase() !== tag.toLowerCase())
      : [...selectedTags, tag]

    setSelectedTags(updated)

    if (isLiveMode) {
      fetchLiveJobs({ search: updated.join(' ') })
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    const updated = selectedTags.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase())
    setSelectedTags(updated)

    if (isLiveMode) {
      fetchLiveJobs({ search: updated.join(' ') })
    }
  }

  const handleAddCustomTag = (e) => {
    if (e) e.preventDefault()
    const clean = (customInput || '').trim()
    if (!clean) return

    let updated = selectedTags
    if (!selectedTags.some(t => t.toLowerCase() === clean.toLowerCase())) {
      updated = [...selectedTags, clean]
      setSelectedTags(updated)
      if (isLiveMode) {
        fetchLiveJobs({ search: updated.join(' ') })
      }
    }

    if (!customAddedTags.some(t => t.toLowerCase() === clean.toLowerCase())) {
      setCustomAddedTags(prev => [...prev, clean])
    }

    setCustomInput('')
  }

  const clearFilters = () => {
    setSelectedTags([])
    setCustomInput('')
    setFilters({ domain: '', location: '', search: '' })
    if (isLiveMode) {
      fetchLiveJobs({ search: '' })
    } else {
      fetchJobs()
    }
  }

  const toggleLiveMode = (enableLive) => {
    setIsLiveMode(enableLive)
    setCampusTab('all')
    const query = selectedTags.join(' ')
    if (enableLive) {
      fetchLiveJobs({
        search: query || 'Software'
      })
    } else {
      fetchJobs()
    }
  }

  const getSourceBadge = (source, isLive) => {
    const s = source?.toLowerCase() || ''
    if (s.includes('unstop')) {
      return <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><LightningBoltIcon className="h-2.5 w-2.5 text-amber-500" /> Unstop</span>
    }
    if (s.includes('internshala')) {
      return <span className="px-2 py-0.5 bg-teal-50 text-teal-900 border border-teal-200/80 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><GlobeIcon className="h-2.5 w-2.5 text-teal-600" /> Internshala</span>
    }
    if (s.includes('naukri')) {
      return <span className="px-2 py-0.5 bg-blue-900 text-white rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><GlobeIcon className="h-2.5 w-2.5 text-blue-200" /> Naukri</span>
    }
    if (s.includes('linkedin')) {
      return <span className="px-2 py-0.5 bg-sky-50 text-sky-900 border border-sky-200/80 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><GlobeIcon className="h-2.5 w-2.5 text-sky-600" /> LinkedIn</span>
    }
    if (s.includes('indeed')) {
      return <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200/80 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><GlobeIcon className="h-2.5 w-2.5 text-blue-600" /> Indeed</span>
    }
    if (s.includes('glassdoor')) {
      return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><GlobeIcon className="h-2.5 w-2.5 text-emerald-600" /> Glassdoor</span>
    }
    if (s.includes('ziprecruiter')) {
      return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><GlobeIcon className="h-2.5 w-2.5 text-emerald-600" /> ZipRecruiter</span>
    }
    if (s.includes('weworkremotely') || s.includes('remoteok') || s.includes('remotive')) {
      return <span className="px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200/80 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><GlobeIcon className="h-2.5 w-2.5 text-purple-600" /> Remote Web</span>
    }
    return isLive 
      ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><LightningBoltIcon className="h-2.5 w-2.5 text-indigo-600" /> Live Web</span>
      : <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs"><AcademicCapIcon className="h-2.5 w-2.5 text-slate-600" /> Campus Drive</span>
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[10px] font-bold uppercase tracking-wide">Applied</span>
      case 'interviewing':
        return <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md text-[10px] font-bold uppercase tracking-wide">Interviewing</span>
      case 'shortlisted':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold uppercase tracking-wide">Shortlisted 🎉</span>
      case 'offer':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[10px] font-bold uppercase tracking-wide">Offer Received 🏆</span>
      case 'rejected':
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-[10px] font-bold uppercase tracking-wide">Archived</span>
      default:
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold uppercase tracking-wide">Target Role</span>
    }
  }

  const renderDateBadges = (job) => {
    // 1. If explicit deadline/expiration date is known (expires_at column)
    if (job.expires_at) {
      try {
        const exp = new Date(job.expires_at)
        const now = new Date()
        const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          return (
            <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-300 shadow-2xs animate-pulse">
              <ClockIcon className="h-3 w-3 mr-1 text-rose-600" />
              🚨 1 day left to apply
            </span>
          )
        } else if (diffDays === 2) {
          return (
            <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
              <ClockIcon className="h-3 w-3 mr-1 text-amber-600" />
              ⚡ 2 days left to apply
            </span>
          )
        } else if (diffDays > 2 && diffDays <= 7) {
          return (
            <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <ClockIcon className="h-3 w-3 mr-1 text-amber-500" />
              ⏰ {diffDays} days left to apply
            </span>
          )
        } else if (diffDays > 7) {
          return (
            <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shadow-2xs">
              <ClockIcon className="h-3 w-3 mr-1 text-rose-500" />
              Apply by: {exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ({diffDays}d left)
            </span>
          )
        } else {
          return (
            <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <ClockIcon className="h-3 w-3 mr-1 text-slate-400" />
              Application Closed
            </span>
          )
        }
      } catch (e) {}
    }

    // 2. Extract embedded date from description if available (e.g. "Date Posted: 2026-08-18")
    const descDateMatch = (job.description || '').match(/Date Posted[:\s]+(\d{4}-\d{2}-\d{2})/i)
    let effectiveDate = job.posted_date
    if (descDateMatch && descDateMatch[1]) {
      effectiveDate = descDateMatch[1]
    }

    if (effectiveDate) {
      try {
        const posted = new Date(effectiveDate)
        const now = new Date()
        const diffDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
          return (
            <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <SparklesIcon className="h-3 w-3 mr-1 text-emerald-500 animate-pulse" />
              Fresh Opening
            </span>
          )
        } else if (diffDays >= 1 && diffDays <= 7) {
          return (
            <span className="inline-flex items-center text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              <CalendarIcon className="h-3 w-3 mr-1 text-teal-500" />
              Posted {diffDays}d ago
            </span>
          )
        } else if (diffDays > 7 && diffDays <= 30) {
          return (
            <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              <CalendarIcon className="h-3 w-3 mr-1 text-slate-400" />
              Posted {posted.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )
        }
      } catch (e) {}
    }

    // 3. Verified Live Opening Badge
    return (
      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
        Actively Hiring
      </span>
    )
  }

  // Determine active list to display with smart instant tag matching
  const displayItems = useMemo(() => {
    let baseList = jobs

    if (!isLiveMode && campusTab === 'interested') {
      baseList = interestedJobs.map(item => ({
        id: item.job_id || item.id,
        external_id: item.external_job_id,
        interest_id: item.id,
        title: item.job_title,
        company: item.company,
        location: item.job_data?.location,
        salary_range: item.job_data?.salary_range,
        job_type: item.job_data?.job_type,
        required_skills: item.job_data?.required_skills || [],
        apply_url: item.job_data?.apply_url,
        source: item.job_data?.source || 'internal',
        status: item.status,
        notes: item.notes,
        is_interested_item: true
      }))
    }

    let resultList = baseList

    // Filter in-memory when on campus board
    if (selectedTags.length > 0 && !isLiveMode) {
      resultList = baseList.filter((job) => {
        const title = (job.title || '').toLowerCase()
        const company = (job.company || '').toLowerCase()
        const location = (job.location || '').toLowerCase()
        const domain = (job.domain || '').toLowerCase()
        const description = (job.description || '').toLowerCase()
        const skills = (job.required_skills || []).map(s => String(s).toLowerCase())

        return selectedTags.some((tag) => {
          const t = tag.toLowerCase().trim()
          return (
            title.includes(t) ||
            company.includes(t) ||
            location.includes(t) ||
            domain.includes(t) ||
            description.includes(t) ||
            skills.some(s => s.includes(t) || t.includes(s))
          )
        })
      })
    }

    // Sort by AI Match Score descending so high-match tech jobs appear at the top!
    return [...resultList].sort((a, b) => {
      const scoreA = calculateMatchScore(a)
      const scoreB = calculateMatchScore(b)
      return scoreB - scoreA
    })
  }, [isLiveMode, campusTab, interestedJobs, jobs, selectedTags, userSkills, activeResume])

  const hasActiveFilters = selectedTags.length > 0

  return (
    <div className="w-full space-y-3">
      {/* Compact Slim Hero Header */}
      <div className="relative rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-primary-950 py-3.5 px-5 text-white shadow-xs overflow-hidden border border-white/10">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Campus Board & Opportunities
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-medium text-primary-200">
                <SparklesIcon className="h-2.5 w-2.5 text-amber-300" />
                AI Matched
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-0.5 leading-tight">
              {isLiveMode ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  Live Multi-Source Engine active • {total} positions aggregated
                </span>
              ) : campusTab === 'interested' ? (
                <span className="text-amber-300 font-medium">
                  ⭐ {interestedJobs.length} bookmarked roles in your personal roadmap
                </span>
              ) : (
                `Showing ${displayItems.length} verified positions matching your candidate profile.`
              )}
            </p>
          </div>

          {/* Segmented Switcher */}
          <div className="flex bg-black/35 backdrop-blur-md p-1 rounded-lg border border-white/10 self-start md:self-center shadow-inner">
            <button
              onClick={() => toggleLiveMode(false)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                !isLiveMode 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🏛️ Campus Board {interestedJobs.length > 0 && `(${interestedJobs.length})`}
            </button>
            <button
              onClick={() => toggleLiveMode(true)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isLiveMode 
                  ? 'bg-emerald-500 text-white shadow-xs' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <GlobeIcon className="h-3 w-3" />
              🌐 Live Internet (10+)
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tabs for Campus Board */}
      {!isLiveMode && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCampusTab('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              campusTab === 'all'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-xs'
            }`}
          >
            <BriefcaseIcon className="h-3 w-3" />
            All Campus Drives ({jobs.length})
          </button>
          <button
            onClick={() => setCampusTab('interested')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              campusTab === 'interested'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-xs'
            }`}
          >
            <StarSolidIcon className="h-3 w-3 text-amber-300" />
            Target Roles ({interestedJobs.length})
          </button>
        </div>
      )}

      {/* Universal Interactive Tag Search Engine */}
      {(isLiveMode || campusTab === 'all') && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 space-y-2">
          
          {/* Active Search Tags Box + Live Portal Indicators */}
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 min-h-[40px]">
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-primary-600 text-white shadow-xs animate-fadeIn"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-primary-700 p-0.5 rounded transition-colors focus:outline-none ml-0.5"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Filter by clicking quick tags below or type your custom skill / role / location...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isLiveMode && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-400">Portals:</span>
                  <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 font-medium">Unstop</span>
                  <span className="px-1.5 py-0.5 bg-teal-50 text-teal-800 rounded border border-teal-200 font-medium">Internshala</span>
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200 font-medium">LinkedIn</span>
                </div>
              )}
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-0.5 rounded hover:bg-slate-200 transition-colors flex-shrink-0"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Quick-Add Preset Chips (Tailored to Campus or Live Mode) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Add:</span>
            {activePresetTags.map((tag) => {
              const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary-100 text-primary-800 border border-primary-300 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-400 hover:text-primary-700 shadow-xs'
                  }`}
                >
                  {isSelected && <CheckIcon className="h-3 w-3 text-primary-600" />}
                  {tag}
                </button>
              )
            })}
          </div>

          {/* Universal Custom Input Bar */}
          <form onSubmit={handleAddCustomTag} className="flex gap-1.5 pt-0.5">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type any skill, role, location, or domain (e.g. Kubernetes, Golang, Remote, AWS) and press Enter"
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-slate-900"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-3.5 py-1.5 bg-white border border-primary-600 text-primary-600 hover:bg-primary-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-xs font-semibold transition-all"
            >
              Add Filter
            </button>
          </form>

        </div>
      )}

      {/* Job Listings Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-xs border border-slate-100">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-primary-100 border-t-primary-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <SparklesIcon className="h-3.5 w-3.5 text-primary-600 animate-pulse" />
            </div>
          </div>
          <h3 className="mt-2.5 text-xs font-bold text-slate-800">
            {isLiveMode ? 'Scanning Live Web Portals...' : 'Loading Campus Opportunities...'}
          </h3>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Matching skills and computing AI alignment
          </p>
        </div>
      ) : displayItems?.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5">
          {displayItems.map((job) => {
            const isSaved = isJobInterested(job)
            const matchScore = calculateMatchScore(job)

            return (
              <div
                key={job.interest_id || job.id || job.external_id || `${job.company}-${job.title}`}
                className="group relative bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-primary-300 transition-all duration-150 overflow-hidden"
              >
                {/* Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
                  matchScore >= 80 ? 'bg-emerald-500' : matchScore >= 65 ? 'bg-primary-500' : 'bg-slate-300'
                }`} />

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 pl-1">
                  {/* Job Info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {job.title}
                      </h3>
                      {getSourceBadge(job.source, job.is_live)}
                      {job.is_interested_item && getStatusBadge(job.status)}
                    </div>

                    <p className="text-slate-700 font-semibold text-xs flex items-center gap-2">
                      <span>{job.company}</span>
                      {job.job_type && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-normal">
                            {job.job_type}
                          </span>
                        </>
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium">
                      <span className="flex items-center">
                        <MapPinIcon className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        {job.location || 'Remote / Campus'}
                      </span>
                      {job.salary_range && (
                        <span className="flex items-center text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-xs">
                          <CurrencyRupeeIcon className="h-3 w-3 mr-1 text-emerald-600" />
                          {job.salary_range}
                        </span>
                      )}
                      {renderDateBadges(job)}
                      {job.campus_interest_count > 0 && (
                        <span className="flex items-center text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          <UserGroupIcon className="h-2.5 w-2.5 mr-1 text-indigo-500" />
                          {job.campus_interest_count} student{job.campus_interest_count > 1 ? 's' : ''} interested
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Skill Tags */}
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {job.required_skills.slice(0, 6).map((skill, idx) => {
                          const isSkillMatched = userSkills.some(u => u.includes(skill.toLowerCase()) || skill.toLowerCase().includes(u))
                          return (
                            <span 
                              key={idx} 
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                isSkillMatched 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' 
                                  : 'bg-slate-50 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isSkillMatched && <CheckCircleIcon className="h-2.5 w-2.5 mr-1 text-emerald-600" />}
                              {skill}
                            </span>
                          )
                        })}
                        {job.required_skills.length > 6 && (
                          <span className="text-[10px] text-slate-400 font-medium px-1">
                            +{job.required_skills.length - 6} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Application Progress Status Changer */}
                    {job.is_interested_item && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-700 text-[11px]">Stage:</span>
                        <select
                          value={job.status || 'interested'}
                          onChange={(e) => updateInterestStatus(job.interest_id, e.target.value)}
                          className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2 py-0.5 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                        >
                          <option value="interested">⭐ Target Role</option>
                          <option value="applied">📝 Applied</option>
                          <option value="interviewing">💬 Interviewing</option>
                          <option value="shortlisted">🎉 Shortlisted</option>
                          <option value="offer">🏆 Offer Received</option>
                          <option value="rejected">📦 Archived</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Actions & Match Score */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 min-w-[140px] pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleJobInterest(job)}
                        title={isSaved ? "Remove from Campus Board" : "Save to Campus Board"}
                        className={`p-1.5 rounded-lg transition-all border ${
                          isSaved 
                            ? 'bg-amber-50 text-amber-500 border-amber-300 shadow-xs' 
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                      >
                        {isSaved ? <StarSolidIcon className="h-3.5 w-3.5 text-amber-500" /> : <StarIcon className="h-3.5 w-3.5" />}
                      </button>

                      {hasActiveResume ? (
                        <div className={`px-2.5 py-0.5 rounded-md border text-right ${
                          matchScore >= 80 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                        }`}>
                          <div className="text-xs font-black leading-tight flex items-center justify-end gap-0.5">
                            <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
                            {matchScore}%
                          </div>
                          <div className="text-[8px] font-semibold opacity-75">AI Match</div>
                        </div>
                      ) : (
                        <Link 
                          to="/resume" 
                          className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200 hover:underline"
                        >
                          Match
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-1 w-full lg:w-auto">
                      {job.apply_url ? (
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center px-3 py-1 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                        >
                          Apply
                          <ExternalLinkIcon className="h-3 w-3 ml-1" />
                        </a>
                      ) : (
                        <Link to={`/jobs/${job.id}`} className="flex-1 lg:w-full">
                          <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-lg py-1 px-2.5">
                            Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Actionable Compact Empty State with 1-Click Live Web Bridge */
        <div className="text-center py-7 px-4 bg-gradient-to-b from-white to-slate-50/60 rounded-xl border border-dashed border-slate-200 shadow-xs">
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mx-auto mb-2 border border-primary-100">
            <BriefcaseIcon className="h-5 w-5 text-primary-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {campusTab === 'interested' 
              ? 'No Saved Target Roles' 
              : selectedTags.length > 0 
                ? `0 Campus Drives match "${selectedTags.join(', ')}"` 
                : 'No Opportunities Found'}
          </h3>
          <p className="mt-1 text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
            {campusTab === 'interested' 
              ? 'Click the ⭐ star icon on any drive to curate your personal target pipeline.'
              : isLiveMode 
                ? 'No live listings matched your search. Try different keywords or reset filters.' 
                : selectedTags.length > 0
                  ? `No on-campus placement drives matched these filters. Switch to Live Web to search across 10+ internet portals.`
                  : 'Try adjusting your filters or switch to Live Internet Jobs.'}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            {campusTab === 'interested' ? (
              <button 
                onClick={() => setCampusTab('all')}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <BriefcaseIcon className="h-3.5 w-3.5" />
                Browse Campus Drives
              </button>
            ) : (
              <>
                {!isLiveMode && selectedTags.length > 0 ? (
                  <button 
                    onClick={() => {
                      setIsLiveMode(true)
                      fetchLiveJobs({ search: selectedTags.join(' ') })
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <GlobeIcon className="h-3.5 w-3.5" />
                    Search 10+ Live Portals for "{selectedTags.join(', ')}"
                  </button>
                ) : !isLiveMode ? (
                  <button 
                    onClick={() => toggleLiveMode(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <GlobeIcon className="h-3.5 w-3.5" />
                    Search 10+ Live Internet Portals
                  </button>
                ) : null}

                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all shadow-xs"
                  >
                    Reset Filters
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobList