import React, { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { getJobDeadlineStatus } from '../../utils/jobDateUtils'
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
    const jobSkills = (job.required_skills || []).map(s => String(s || '').toLowerCase().trim())
    const eduText = JSON.stringify(activeResume?.education || []).toLowerCase()
    const projText = JSON.stringify(activeResume?.projects || []).toLowerCase()
    const expText = JSON.stringify(activeResume?.experience || {}).toLowerCase()

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
    const userLoc = (activeResume?.location || 'bangalore').toLowerCase()
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
    totalPages,
    isLiveMode, 
    setIsLiveMode, 
    fetchJobs, 
    fetchLiveJobs,
    toggleJobInterest,
    updateInterestStatus,
    isJobInterested
  } = useJobs()

  const urlDomain = searchParams.get('domain') || ''
  const urlLocation = searchParams.get('location') || ''
  const urlSearch = searchParams.get('search') || searchParams.get('q') || ''

  const [campusTab, setCampusTab] = useState('all') // 'all' | 'interested'
  const [customAddedTags, setCustomAddedTags] = useState(() => {
    const custom = []
    if (urlDomain && !CAMPUS_PRESET_TAGS.includes(urlDomain) && !LIVE_PRESET_TAGS.includes(urlDomain)) custom.push(urlDomain)
    if (urlLocation && !CAMPUS_PRESET_TAGS.includes(urlLocation) && !LIVE_PRESET_TAGS.includes(urlLocation)) custom.push(urlLocation)
    if (urlSearch && !CAMPUS_PRESET_TAGS.includes(urlSearch) && !LIVE_PRESET_TAGS.includes(urlSearch)) custom.push(urlSearch)
    return custom
  })
  const [selectedTags, setSelectedTags] = useState(() => {
    const initial = []
    if (urlDomain) initial.push(urlDomain)
    if (urlLocation && !initial.some(t => t.toLowerCase() === urlLocation.toLowerCase())) initial.push(urlLocation)
    if (urlSearch && !initial.some(t => t.toLowerCase() === urlSearch.toLowerCase())) initial.push(urlSearch)
    return initial
  })
  const [customInput, setCustomInput] = useState('')
  const [livePage, setLivePage] = useState(1)
  const [campusPage, setCampusPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreLive, setHasMoreLive] = useState(true)

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    const query = selectedTags.join(' ')
    if (isLiveMode) {
      const nextPage = livePage + 1
      const result = await fetchLiveJobs({ search: query || 'Software', page: nextPage, limit: 25 }, true)
      setLivePage(nextPage)
      if (result && typeof result === 'object' && 'has_more' in result) {
        setHasMoreLive(Boolean(result.has_more))
      }
    } else {
      const nextPage = campusPage + 1
      await fetchJobs({ 
        search: query || undefined, 
        domain: urlDomain || undefined, 
        location: urlLocation || undefined, 
        page: nextPage, 
        per_page: 20 
      }, true)
      setCampusPage(nextPage)
    }
    setIsLoadingMore(false)
  }

  // Optimization 4: 300ms debounce on search & tag filters to prevent typing request spikes
  useEffect(() => {
    const handler = setTimeout(() => {
      const query = selectedTags.join(' ') || urlSearch || undefined
      fetchJobs({ 
        page: 1, 
        per_page: 20,
        domain: urlDomain || undefined,
        location: urlLocation || undefined,
        search: query
      })
    }, 300)

    return () => clearTimeout(handler)
  }, [fetchJobs, selectedTags, urlDomain, urlLocation, urlSearch])

  // Dynamic quick-add presets based on current tab mode and backend domains
  const activePresetTags = useMemo(() => {
    const base = isLiveMode ? LIVE_PRESET_TAGS : CAMPUS_PRESET_TAGS
    const dynamicDomains = (domains || []).filter(
      d => d && !base.some(b => b.toLowerCase() === d.toLowerCase())
    )
    const customOnly = customAddedTags.filter(
      t => t && 
        !base.some(b => b.toLowerCase() === t.toLowerCase()) && 
        !dynamicDomains.some(d => d.toLowerCase() === t.toLowerCase())
    )
    return [...base, ...dynamicDomains, ...customOnly]
  }, [isLiveMode, domains, customAddedTags])

  const handleToggleTag = (tag) => {
    const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())
    const updated = isSelected
      ? selectedTags.filter(t => t.toLowerCase() !== tag.toLowerCase())
      : [...selectedTags, tag]

    setSelectedTags(updated)
    setLivePage(1)
    setCampusPage(1)
    setHasMoreLive(true)

    if (isLiveMode) {
      fetchLiveJobs({ search: updated.join(' '), page: 1 })
    } else {
      fetchJobs({ search: updated.join(' '), page: 1, per_page: 20 })
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    const updated = selectedTags.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase())
    setSelectedTags(updated)
    setLivePage(1)
    setCampusPage(1)
    setHasMoreLive(true)

    if (isLiveMode) {
      fetchLiveJobs({ search: updated.join(' '), page: 1 })
    } else {
      fetchJobs({ search: updated.join(' '), page: 1, per_page: 20 })
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
    setLivePage(1)
    setCampusPage(1)
    setHasMoreLive(true)
    setSearchParams({})
    if (isLiveMode) {
      fetchLiveJobs({ search: '', page: 1 })
    } else {
      fetchJobs({ page: 1, per_page: 20 })
    }
  }

  const toggleLiveMode = (enableLive) => {
    setIsLiveMode(enableLive)
    setCampusTab('all')
    setLivePage(1)
    setHasMoreLive(true)
    const query = selectedTags.join(' ')
    if (enableLive) {
      fetchLiveJobs({
        search: query || 'Software',
        page: 1
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

  const renderDateBadges = (job) => {
    const status = getJobDeadlineStatus(job)

    if (status.type === 'CLOSED') {
      return (
        <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          <ClockIcon className="h-3 w-3 mr-1 text-slate-400" />
          {status.label}
        </span>
      )
    }

    if (status.type === 'CLOSING_TODAY' || status.type === 'URGENT_1_DAY') {
      return (
        <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-300 shadow-2xs animate-pulse">
          <ClockIcon className="h-3 w-3 mr-1 text-rose-600" />
          {status.label}
        </span>
      )
    }

    if (status.type === 'CLOSING_SOON') {
      return (
        <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
          <ClockIcon className="h-3 w-3 mr-1 text-amber-600" />
          {status.label}
        </span>
      )
    }

    if (status.type === 'ACTIVE_DEADLINE') {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shadow-2xs">
          <ClockIcon className="h-3 w-3 mr-1 text-rose-500" />
          {status.label}
        </span>
      )
    }

    // Rolling admissions
    return (
      <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
        {status.label}
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

        return selectedTags.every((tag) => {
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
    <div data-testid="job-list" className="w-full space-y-3">
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border ${
              campusTab === 'all'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-[#1E293B]/60 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <BriefcaseIcon className="h-3.5 w-3.5" />
            <span>All Campus Drives ({jobs.length})</span>
          </button>
          <button
            onClick={() => setCampusTab('interested')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border ${
              campusTab === 'interested'
                ? 'bg-amber-500 border-amber-400 text-gray-950 font-bold shadow-sm'
                : 'bg-[#1E293B]/60 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <StarSolidIcon className="h-3.5 w-3.5 text-amber-400" />
            <span>Target Roles ({interestedJobs.length})</span>
          </button>
        </div>
      )}

      {/* Universal Interactive Tag Search Engine */}
      {(isLiveMode || campusTab === 'all') && (
        <div className="bg-[#111827] rounded-2xl shadow-sm border border-gray-800 p-3.5 space-y-2.5">
          
          {/* Active Search Tags Box + Live Portal Indicators */}
          <div className="flex items-center justify-between gap-2 p-2 bg-[#1E293B]/40 rounded-xl border border-gray-800 min-h-[40px]">
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-indigo-700 p-0.5 rounded transition-colors focus:outline-none ml-0.5"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">
                  Filter by clicking quick tags below or type custom skill / role / location...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isLiveMode && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="font-semibold text-gray-400">Portals:</span>
                  <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-300 rounded border border-yellow-500/20 font-medium">Unstop</span>
                  <span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-300 rounded border border-teal-500/20 font-medium">Internshala</span>
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20 font-medium">LinkedIn</span>
                </div>
              )}
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-gray-400 hover:text-white font-semibold px-2 py-0.5 rounded hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Quick-Add Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-semibold text-gray-400 mr-1">Quick Add:</span>
            {activePresetTags.map((tag) => {
              const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold shadow-xs'
                      : 'bg-[#1E293B]/40 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white'
                  }`}
                >
                  {isSelected && <CheckIcon className="h-3 w-3 text-indigo-400" />}
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
              className="flex-1 px-3 py-2 text-xs border border-gray-700 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-[#1E293B]/60 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Add Filter
            </button>
          </form>
        </div>
      )}

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#111827] rounded-3xl border border-gray-800">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-gray-400 font-medium">Aggregating matching opportunities...</p>
        </div>
      ) : displayItems.length > 0 ? (
        <div className="space-y-3.5">
          {displayItems.map((job) => {
            const isSaved = isJobInterested(job)
            const matchScore = calculateMatchScore(job)

            return (
              <div
                key={job.interest_id || job.id || job.external_id || `${job.company}-${job.title}`}
                className="group relative bg-[#111827] rounded-2xl p-4 sm:p-5 border border-gray-800 hover:border-indigo-500/40 shadow-sm transition-all duration-150 overflow-hidden"
              >
                {/* Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
                  matchScore >= 80 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : matchScore >= 65 ? 'bg-indigo-500' : 'bg-gray-700'
                }`} />

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 pl-2">
                  {/* Job Info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        <Link 
                          to={`/jobs/${job.id || job.external_id}`} 
                          state={{ matchScore }}
                          className="hover:underline hover:text-indigo-300 transition-colors"
                        >
                          {job.title}
                        </Link>
                      </h3>
                      {getSourceBadge(job.source, job.is_live)}
                      {job.is_interested_item && getStatusBadge(job.status)}
                    </div>

                    <p className="text-gray-300 font-semibold text-xs flex items-center gap-2">
                      <span>{job.company}</span>
                      {job.job_type && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded-md text-[10px] font-normal border border-gray-700/60">
                            {job.job_type}
                          </span>
                        </>
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-400 font-medium">
                      <span className="flex items-center">
                        <MapPinIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        {job.location || 'Remote / Campus'}
                      </span>
                      <span className="flex items-center text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-xs">
                        <CurrencyRupeeIcon className="h-3 w-3 mr-1 text-emerald-400" />
                        {formatSalaryDisplay(job.salary_range, job.description, job.title, job.location)}
                      </span>
                      {renderDateBadges(job)}
                      {job.campus_interest_count > 0 && (
                        <span className="flex items-center text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          <UserGroupIcon className="h-2.5 w-2.5 mr-1 text-indigo-400" />
                          {job.campus_interest_count} student{job.campus_interest_count > 1 ? 's' : ''} interested
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Skill Tags */}
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {job.required_skills.slice(0, 6).map((skill, idx) => {
                          const skillStr = String(skill || '').toLowerCase().trim()
                          const isSkillMatched = skillStr && userSkills.some(u => {
                            const uStr = String(u || '').toLowerCase().trim()
                            return uStr && (uStr.includes(skillStr) || skillStr.includes(uStr))
                          })
                          return (
                            <span 
                              key={idx} 
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors border ${
                                isSkillMatched 
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold' 
                                  : 'bg-[#1E293B] text-gray-300 border-gray-700/60'
                              }`}
                            >
                              {isSkillMatched && <CheckCircleIcon className="h-2.5 w-2.5 mr-1 text-emerald-400" />}
                              {String(skill)}
                            </span>
                          )
                        })}
                        {job.required_skills.length > 6 && (
                          <span className="text-[10px] text-gray-400 font-medium px-1">
                            +{job.required_skills.length - 6} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Application Progress Status Changer */}
                    {job.is_interested_item && (
                      <div className="pt-2 border-t border-gray-800 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-gray-400 text-[11px]">Stage:</span>
                        <select
                          value={job.status || 'interested'}
                          onChange={(e) => updateInterestStatus(job.interest_id, e.target.value)}
                          className="text-xs font-semibold bg-[#1E293B] text-white border border-gray-700 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
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
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2.5 min-w-[140px] pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleJobInterest(job)}
                        title={isSaved ? "Remove from Campus Board" : "Save to Campus Board"}
                        className={`p-2 rounded-xl transition-all border ${
                          isSaved 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-xs' 
                            : 'bg-[#1E293B] text-gray-400 border-gray-700 hover:text-amber-400 hover:border-amber-500/30'
                        }`}
                      >
                        {isSaved ? <StarSolidIcon className="h-4 w-4 text-amber-400" /> : <StarIcon className="h-4 w-4" />}
                      </button>

                      {hasActiveResume ? (
                        <div className={`px-2.5 py-1 rounded-xl border text-right ${
                          matchScore >= 80 
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                            : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                        }`}>
                          <div className="text-xs font-black leading-tight flex items-center justify-end gap-0.5">
                            <SparklesIcon className="h-3.5 w-3.5 text-amber-400" />
                            {matchScore}%
                          </div>
                          <div className="text-[8px] font-semibold uppercase tracking-wider opacity-75">AI Match</div>
                        </div>
                      ) : (
                        <Link 
                          to="/resume" 
                          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
                        >
                          Match
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <Link 
                        to={`/jobs/${job.id || job.external_id}`} 
                        state={{ matchScore }}
                        className="flex-1 lg:flex-none"
                      >
                        <button className="w-full text-xs font-semibold rounded-xl py-1.5 px-3 bg-[#1E293B] hover:bg-gray-800 text-gray-200 border border-gray-700 transition-all">
                          Details
                        </button>
                      </Link>
                      {job.apply_url && (
                        job.is_closed || job.status === 'closed' ? (
                          <span className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 bg-gray-800 text-gray-400 text-xs font-semibold rounded-xl border border-gray-700 cursor-not-allowed">
                            Closed
                          </span>
                        ) : (
                          <a
                            href={job.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 lg:flex-none inline-flex items-center justify-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                          >
                            Apply
                            <ExternalLinkIcon className="h-3 w-3 ml-1" />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Pagination for Live Web Mode & Campus Drives */}
          {displayItems.length > 0 && ((isLiveMode && hasMoreLive) || (!isLiveMode && campusTab === 'all' && campusPage < totalPages)) && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 bg-[#1E293B] border border-gray-700 text-indigo-300 hover:bg-gray-800 active:scale-95 disabled:opacity-50 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span>Loading More...</span>
                  </>
                ) : (
                  <>
                    <GlobeIcon className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Load More {isLiveMode ? 'Opportunities (+25)' : 'Campus Drives (+20)'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-[#111827] rounded-3xl border border-gray-800 shadow-sm">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
            <BriefcaseIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            {campusTab === 'interested' 
              ? 'No Saved Target Roles' 
              : selectedTags.length > 0 
                ? `0 Opportunities match "${selectedTags.join(', ')}"` 
                : 'No Opportunities Found'}
          </h3>
          <p className="mt-1.5 text-gray-400 text-xs max-w-md mx-auto leading-relaxed">
            {campusTab === 'interested' 
              ? 'Click the ⭐ star icon on any drive to curate your personal target pipeline.'
              : 'Try adjusting your search keywords or explore live placement drives.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="px-4 py-2 bg-[#1E293B] hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-xl text-xs font-semibold transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobList