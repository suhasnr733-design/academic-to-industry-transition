// src/pages/jobs/JobList.jsx

import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { Input } from '../../components/common/Input'
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  CurrencyRupeeIcon,
  SearchIcon,
  FilterIcon
} from '@heroicons/react/outline'

export const JobList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { jobs, isLoading, domains, total } = useJobs(searchParams)
  const [filters, setFilters] = React.useState({
    domain: searchParams.get('domain') || '',
    location: searchParams.get('location') || '',
    search: searchParams.get('search') || '',
  })

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    setSearchParams(params)
  }

  const clearFilters = () => {
    setFilters({ domain: '', location: '', search: '' })
    setSearchParams({})
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading level={2}>Job Opportunities</Heading>
          <p className="text-gray-500 mt-1">
            {total} jobs found matching your profile
          </p>
        </div>
        <Button variant="outline">
          <FilterIcon className="h-5 w-5 mr-2" />
          Save Search
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search"
            name="search"
            placeholder="Job title, company, keywords..."
            value={filters.search}
            onChange={handleFilterChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <select
              name="domain"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              value={filters.domain}
              onChange={handleFilterChange}
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
          <Input
            label="Location"
            name="location"
            placeholder="City or region"
            value={filters.location}
            onChange={handleFilterChange}
          />
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="secondary" onClick={clearFilters}>Clear</Button>
          <Button onClick={applyFilters}>
            <SearchIcon className="h-5 w-5 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Job Listings */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : jobs?.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {job.location || 'Location not specified'}
                    </span>
                    {job.salary_range && (
                      <span className="flex items-center text-sm text-gray-500">
                        <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                        {job.salary_range}
                      </span>
                    )}
                    {job.job_type && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {job.job_type}
                      </span>
                    )}
                    {job.domain && (
                      <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded-full text-xs">
                        {job.domain}
                      </span>
                    )}
                  </div>
                  {job.description && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                      {job.description}
                    </p>
                  )}
                </div>
                <div className="mt-3 md:mt-0 md:ml-6 flex items-center space-x-3">
                  {job.match_score && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">
                        {job.match_score}%
                      </div>
                      <div className="text-xs text-gray-500">Match</div>
                    </div>
                  )}
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <BriefcaseIcon className="h-16 w-16 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
          <p className="mt-2 text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  )
}