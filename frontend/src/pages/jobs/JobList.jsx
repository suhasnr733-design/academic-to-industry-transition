import React, { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { Input } from '../../components/common/Input'
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
  BookmarkIcon,
  StarIcon,
  TrashIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/outline'
import { BookmarkIcon as BookmarkSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/solid'

export const JobList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { resumes } = useResume()
  const activeResume = resumes?.find(r => r.status === 'completed') || resumes?.[0]
  const hasActiveResume = Boolean(activeResume && (activeResume.status === 'completed' || (activeResume.skills && activeResume.skills.length > 0)))

  const userSkills = useMemo(() => {
    return (activeResume?.skills || []).map(s => String(s).toLowerCase().trim())
  }, [activeResume])

  const calculateMatchScore = (job) => {
    if (job.match_score !== undefined && job.match_score !== null && job.match_score > 0) {
      return Math.round(job.match_score)
    }

    const required = (job.required_skills || []).map(s => String(s).toLowerCase().trim())
    if (required.length === 0) {
      return 78
    }

    if (userSkills.length === 0) return 60

    const matched = required.filter(req => 
      userSkills.some(uSkill => uSkill.includes(req) || req.includes(uSkill))
    )

    const score = Math.round((matched.length / required.length) * 100)
    return Math.min(98, Math.max(50, score > 0 ? score : 55))
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
  const [filters, setFilters] = useState({
    domain: searchParams.get('domain') || '',
    location: searchParams.get('location') || '',
    search: searchParams.get('search') || '',
  })

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    if (isLiveMode) {
      fetchLiveJobs({
        search: filters.search || '',
        location: filters.location || ''
      })
    } else {
      const params = {}
      if (filters.domain) params.domain = filters.domain
      if (filters.location) params.location = filters.location
      if (filters.search) params.search = filters.search
      fetchJobs(params)
    }
  }

  const toggleLiveMode = (enableLive) => {
    setIsLiveMode(enableLive)
    setCampusTab('all')
    if (enableLive) {
      fetchLiveJobs({
        search: filters.search || '',
        location: filters.location || ''
      })
    } else {
      fetchJobs()
    }
  }

  const clearFilters = () => {
    setFilters({ domain: '', location: '', search: '' })
    if (isLiveMode) {
      fetchLiveJobs({ search: '' })
    } else {
      fetchJobs()
    }
  }

  const getSourceBadge = (source, isLive) => {
    const s = source?.toLowerCase() || ''
    if (s.includes('unstop')) {
      return <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-900 rounded-full text-xs font-semibold flex items-center gap-1"><LightningBoltIcon className="h-3 w-3 text-yellow-600" /> Unstop</span>
    }
    if (s.includes('internshala')) {
      return <span className="px-2.5 py-0.5 bg-teal-100 text-teal-900 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3 text-teal-600" /> Internshala</span>
    }
    if (s.includes('naukri')) {
      return <span className="px-2.5 py-0.5 bg-blue-900 text-white rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> Naukri.com</span>
    }
    if (s.includes('linkedin')) {
      return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> LinkedIn</span>
    }
    if (s.includes('indeed')) {
      return <span className="px-2.5 py-0.5 bg-sky-100 text-sky-900 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> Indeed</span>
    }
    if (s.includes('glassdoor')) {
      return <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> Glassdoor</span>
    }
    if (s.includes('ziprecruiter')) {
      return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> ZipRecruiter</span>
    }
    if (s.includes('weworkremotely')) {
      return <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> We Work Remotely</span>
    }
    if (s.includes('remoteok')) {
      return <span className="px-2.5 py-0.5 bg-pink-100 text-pink-800 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> RemoteOK</span>
    }
    if (s.includes('remotive')) {
      return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> Remotive</span>
    }
    if (s.includes('arbeitnow')) {
      return <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> Arbeitnow</span>
    }
    if (s.includes('adzuna')) {
      return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold flex items-center gap-1"><GlobeIcon className="h-3 w-3" /> Adzuna</span>
    }
    return isLive 
      ? <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold flex items-center gap-1"><LightningBoltIcon className="h-3 w-3" /> Live Web</span>
      : <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Campus Drive</span>
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold uppercase tracking-wider">Applied</span>
      case 'interviewing':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold uppercase tracking-wider">Interviewing</span>
      case 'shortlisted':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold uppercase tracking-wider">Shortlisted 🎉</span>
      case 'offer':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold uppercase tracking-wider">Offer Received 🏆</span>
      case 'rejected':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold uppercase tracking-wider">Archived</span>
      default:
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold uppercase tracking-wider">Target Role</span>
    }
  }

  // Determine active list to display
  const displayItems = useMemo(() => {
    if (!isLiveMode && campusTab === 'interested') {
      return interestedJobs.map(item => ({
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
    return jobs
  }, [isLiveMode, campusTab, interestedJobs, jobs])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header & Source Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Heading level={2}>Campus Board & Jobs</Heading>
          <p className="text-gray-500 mt-1">
            {isLiveMode ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Multi-Source Aggregator ({total} jobs indexed across 10+ portals)
              </span>
            ) : campusTab === 'interested' ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                ⭐ {interestedJobs.length} roles saved on your personal Campus Board
              </span>
            ) : (
              `Showing ${total} verified campus drive & platform positions`
            )}
          </p>
        </div>

        {/* Source Switcher */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200 shadow-inner">
          <button
            onClick={() => toggleLiveMode(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              !isLiveMode 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏛️ Campus Board {interestedJobs.length > 0 && `(${interestedJobs.length} Saved)`}
          </button>
          <button
            onClick={() => toggleLiveMode(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              isLiveMode 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <GlobeIcon className="h-4 w-4" />
            🌐 Live Internet Jobs (10+ Sources)
          </button>
        </div>
      </div>

      {/* Sub-tabs for Campus Board */}
      {!isLiveMode && (
        <div className="flex items-center space-x-3 mb-6 border-b border-gray-200 pb-3">
          <button
            onClick={() => setCampusTab('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              campusTab === 'all'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <BriefcaseIcon className="h-4 w-4" />
            All Campus Drives ({jobs.length})
          </button>
          <button
            onClick={() => setCampusTab('interested')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              campusTab === 'interested'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <StarSolidIcon className="h-4 w-4 text-amber-300" />
            My Target Roles ({interestedJobs.length})
          </button>
        </div>
      )}

      {/* Filters (Hidden when viewing saved interested list) */}
      {(isLiveMode || campusTab === 'all') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Job Role"
              name="search"
              placeholder="e.g. DevOps Engineer, Data Analyst, Software Engineer..."
              value={filters.search}
              onChange={handleFilterChange}
            />
            {!isLiveMode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <select
                  name="domain"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-sm"
                  value={filters.domain}
                  onChange={handleFilterChange}
                >
                  <option value="">All Domains</option>
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Sources</label>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-gray-600">
                  <span className="px-2 py-0.5 bg-yellow-50 text-yellow-800 rounded border font-medium">Unstop</span>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded border font-medium">Internshala</span>
                  <span className="px-2 py-0.5 bg-blue-900 text-white rounded border font-medium">Naukri</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border font-medium">LinkedIn</span>
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded border font-medium">Indeed</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border">Remotive</span>
                </div>
              </div>
            )}
            <Input
              label="Location"
              name="location"
              placeholder="City, Country or Remote"
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="secondary" onClick={clearFilters}>Clear</Button>
            <Button onClick={applyFilters}>
              <SearchIcon className="h-5 w-5 mr-2" />
              {isLiveMode ? 'Search Live Feeds & APIs' : 'Search'}
            </Button>
          </div>
        </div>
      )}

      {/* Job Listings */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4" />
          <p className="text-gray-500 text-sm">
            {isLiveMode ? 'Querying live job engines across portals...' : 'Loading campus opportunities...'}
          </p>
        </div>
      ) : displayItems?.length > 0 ? (
        <div className="space-y-4">
          {displayItems.map((job) => {
            const isSaved = isJobInterested(job)
            return (
              <div
                key={job.interest_id || job.id || job.external_id || `${job.company}-${job.title}`}
                className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100 relative group"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                      {getSourceBadge(job.source, job.is_live)}
                      {job.is_interested_item && getStatusBadge(job.status)}
                    </div>
                    <p className="text-gray-600 font-medium text-sm">{job.company}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {job.location || 'Remote / Campus Drive'}
                      </span>
                      {job.salary_range && (
                        <span className="flex items-center">
                          <CurrencyRupeeIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {job.salary_range}
                        </span>
                      )}
                      {job.job_type && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {job.job_type}
                        </span>
                      )}
                      {job.campus_interest_count > 0 && (
                        <span className="flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                          <UserGroupIcon className="h-3.5 w-3.5 mr-1" />
                          {job.campus_interest_count} student{job.campus_interest_count > 1 ? 's' : ''} interested
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    {/* Skills Display */}
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {job.required_skills.slice(0, 7).map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Application Progress Status Changer (When on Interested Tab) */}
                    {job.is_interested_item && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold text-gray-700">Application Stage:</span>
                        <select
                          value={job.status || 'interested'}
                          onChange={(e) => updateInterestStatus(job.interest_id, e.target.value)}
                          className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                          <option value="interested">⭐ Target / Interested</option>
                          <option value="applied">📝 Applied</option>
                          <option value="interviewing">💬 Interviewing</option>
                          <option value="shortlisted">🎉 Shortlisted</option>
                          <option value="offer">🏆 Offer Received</option>
                          <option value="rejected">📦 Archived / Rejected</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Match Score & Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 min-w-[170px]">
                    <div className="flex items-center gap-2">
                      {/* Bookmark / Star Toggle Button */}
                      <button
                        onClick={() => toggleJobInterest(job)}
                        title={isSaved ? "Remove from Campus Board" : "Save to Campus Board"}
                        className={`p-2 rounded-xl transition-all border ${
                          isSaved 
                            ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100 shadow-xs' 
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                      >
                        {isSaved ? <StarSolidIcon className="h-5 w-5 text-amber-500" /> : <StarIcon className="h-5 w-5" />}
                      </button>

                      {/* Single Personal Resume Match Status */}
                      {hasActiveResume ? (
                        <div className="bg-primary-50/80 border border-primary-100 px-3 py-1 rounded-xl text-right">
                          <div className="text-lg font-bold text-primary-700 leading-tight">
                            {calculateMatchScore(job)}%
                          </div>
                          <div className="text-[10px] font-medium text-primary-600">Resume Match</div>
                        </div>
                      ) : (
                        <Link 
                          to="/resume" 
                          className="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100 hover:underline"
                        >
                          Match
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full">
                      {job.apply_url ? (
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
                        >
                          Apply
                          <ExternalLinkIcon className="h-4 w-4 ml-1.5" />
                        </a>
                      ) : (
                        <Link to={`/jobs/${job.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
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
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <BriefcaseIcon className="h-16 w-16 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {campusTab === 'interested' ? 'No Saved Target Roles Yet' : 'No jobs found'}
          </h3>
          <p className="mt-2 text-gray-500 text-sm max-w-md mx-auto">
            {campusTab === 'interested' 
              ? 'Click the ⭐ star icon on any job posting or campus drive to curate your personal target board and track application stages.'
              : isLiveMode 
                ? 'No live listings matched your search. Try different keywords.' 
                : 'Try adjusting your filters or search terms.'}
          </p>
          {campusTab === 'interested' && (
            <Button className="mt-4" onClick={() => setCampusTab('all')}>
              Browse Campus Drives
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default JobList