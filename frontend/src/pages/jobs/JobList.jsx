// src/pages/jobs/JobList.jsx

import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { Input } from '../../components/common/Input'
import { 
  BriefcaseIcon, 
  LocationMarkerIcon as MapPinIcon, 
  CurrencyDollarIcon as CurrencyRupeeIcon,
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon,
  GlobeIcon,
  SparklesIcon,
  AcademicCapIcon,
  LightningBoltIcon
} from '@heroicons/react/outline'

export const JobList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { 
    jobs, 
    isLoading, 
    domains, 
    total, 
    isLiveMode, 
    setIsLiveMode, 
    fetchJobs, 
    fetchLiveJobs 
  } = useJobs()

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
        search: filters.search || 'Software Engineer',
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
    if (enableLive) {
      fetchLiveJobs({
        search: filters.search || 'Software Engineer',
        location: filters.location || ''
      })
    } else {
      fetchJobs()
    }
  }

  const clearFilters = () => {
    setFilters({ domain: '', location: '', search: '' })
    if (isLiveMode) {
      fetchLiveJobs({ search: 'Software Engineer' })
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
      : <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Campus Board</span>
  }

  const getAcademicFitColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-indigo-700 bg-indigo-50 border-indigo-200'
    return 'text-amber-700 bg-amber-50 border-amber-200'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header & Source Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Heading level={2}>Job Opportunities</Heading>
          <p className="text-gray-500 mt-1">
            {isLiveMode ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Multi-Source Real-Time Aggregator ({total} jobs indexed)
              </span>
            ) : (
              `Showing ${total} verified platform jobs`
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
            🏛️ Campus Board
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search Keywords"
            name="search"
            placeholder={isLiveMode ? "e.g. Research Scientist, Python, Machine Learning..." : "Job title, company..."}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Active Global & Indian Sources</label>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-gray-600">
                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-800 rounded border font-medium">Unstop</span>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded border font-medium">Internshala</span>
                <span className="px-2 py-0.5 bg-blue-900 text-white rounded border font-medium">Naukri.com</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border font-medium">LinkedIn</span>
                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded border font-medium">Indeed</span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border">We Work Remotely</span>
                <span className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded border">RemoteOK</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border">Remotive</span>
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded border">Arbeitnow</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border">Adzuna</span>
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

      {/* Job Listings */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4" />
          <p className="text-gray-500 text-sm">
            {isLiveMode ? 'Querying live job engines across LinkedIn, Indeed, WeWorkRemotely...' : 'Loading positions...'}
          </p>
        </div>
      ) : jobs?.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id || job.external_id || `${job.company}-${job.title}`}
              className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    {getSourceBadge(job.source, job.is_live)}
                  </div>
                  <p className="text-gray-600 font-medium text-sm">{job.company}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {job.location || 'Remote'}
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
                  </div>

                  {/* Academic Tags & Transition Highlights */}
                  {job.academic_tags && job.academic_tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <AcademicCapIcon className="h-3.5 w-3.5 text-indigo-500" /> Academic Fit:
                      </span>
                      {job.academic_tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {job.description && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  {/* Skills Display */}
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.required_skills.slice(0, 7).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded border text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Match Score & Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 min-w-[150px]">
                  {job.academic_fit_score !== undefined && (
                    <div className="text-right">
                      <div className={`px-2.5 py-1 rounded-lg border text-sm font-bold inline-flex items-center gap-1 ${getAcademicFitColor(job.academic_fit_score)}`}>
                        <AcademicCapIcon className="h-4 w-4" />
                        {job.academic_fit_score}% Fit
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Academic Match</div>
                    </div>
                  )}

                  {job.match_score !== undefined && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary-600">
                        {job.match_score}%
                      </div>
                      <div className="text-xs text-gray-400">Resume Match</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full">
                    {job.apply_url ? (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                      >
                        Apply Now
                        <ExternalLinkIcon className="h-4 w-4 ml-1.5" />
                      </a>
                    ) : (
                      <Link to={`/jobs/${job.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <BriefcaseIcon className="h-16 w-16 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
          <p className="mt-2 text-gray-500 text-sm">
            {isLiveMode ? 'No live listings matched your search. Try different keywords.' : 'Try adjusting your filters or search terms.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default JobList