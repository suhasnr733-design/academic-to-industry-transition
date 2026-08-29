// frontend/src/hooks/useJobs.js

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export const useJobs = () => {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [interestedJobs, setInterestedJobs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [domains, setDomains] = useState([])
  const [isLiveMode, setIsLiveMode] = useState(false)

  const fetchJobs = useCallback(async (params = {}, append = false) => {
    try {
      if (!append) {
        setIsLoading(true)
      }
      setError(null)
      const res = await api.get('/jobs', { params })
      const jobList = res.data.jobs || []
      if (append) {
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id || `${j.company}-${j.title}`))
          const uniqueNew = jobList.filter(j => !existingIds.has(j.id || `${j.company}-${j.title}`))
          return [...prev, ...uniqueNew]
        })
      } else {
        setJobs(jobList)
      }
      const pages = res.data.pages || 1
      const curPage = res.data.page || params.page || 1
      setTotalPages(pages)
      setTotal(res.data.total || jobList.length)
      return { jobs: jobList, totalPages: pages, page: curPage, has_more: curPage < pages }
    } catch (err) {
      console.log('Error fetching jobs:', err)
      setError(err.response?.data?.error || 'Failed to fetch jobs')
      return { jobs: [], totalPages: 1, page: 1, has_more: false }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchLiveJobs = useCallback(async (params = {}, append = false) => {
    try {
      if (!append) {
        setIsLoading(true)
      }
      setError(null)
      setIsLiveMode(true)
      const res = await api.get('/jobs/live', { params: { limit: 25, ...params } })
      const liveList = res.data.jobs || []
      const hasMoreFromBackend = res.data.has_more ?? (liveList.length >= 25)

      let newlyAddedCount = 0
      if (append) {
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id || j.external_id || `${j.company}-${j.title}`))
          const uniqueNew = liveList.filter(j => !existingIds.has(j.id || j.external_id || `${j.company}-${j.title}`))
          newlyAddedCount = uniqueNew.length
          setTotal(prev.length + uniqueNew.length)
          return [...prev, ...uniqueNew]
        })
      } else {
        setJobs(liveList)
        setTotal(liveList.length)
      }
      setTotalPages(1)
      const effectiveHasMore = hasMoreFromBackend && (!append || newlyAddedCount > 0)
      return { jobs: liveList, has_more: effectiveHasMore }
    } catch (err) {
      console.log('Error fetching live jobs:', err)
      setError(err.response?.data?.error || 'Failed to fetch live jobs')
      return { jobs: [], has_more: false }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchLiveMatches = useCallback(async (params = {}) => {
    try {
      setIsLoading(true)
      setError(null)
      setIsLiveMode(true)
      const res = await api.post('/jobs/live/match', params)
      const matches = res.data.matches || []
      setJobs(matches)
      setTotal(matches.length)
      setTotalPages(1)
      return matches
    } catch (err) {
      console.log('Error fetching live matches:', err)
      setError(err.response?.data?.error || 'Failed to match live jobs')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchInterestedJobs = useCallback(async (status = null) => {
    try {
      const params = status ? { status } : {}
      const res = await api.get('/jobs/interested', { params })
      const list = res.data.interests || []
      setInterestedJobs(list)
      return list
    } catch (err) {
      // Graceful fallback if not authenticated
      console.log('Could not fetch interested jobs:', err)
      return []
    }
  }, [])

  const toggleJobInterest = useCallback(async (job) => {
    try {
      const jobId = job.id && typeof job.id === 'number' ? job.id : null
      const extId = job.external_id || (typeof job.id === 'string' ? job.id : null)

      // Find if already interested
      const existing = interestedJobs.find(
        (i) => (jobId && i.job_id === jobId) || (extId && i.external_job_id === extId) || (i.job_title === job.title && i.company === job.company)
      )

      if (existing) {
        // Remove interest
        await api.delete(`/jobs/interested/${existing.id}`)
        setInterestedJobs((prev) => prev.filter((i) => i.id !== existing.id))
        toast.success(`Removed "${job.title}" from Campus Board`)
        return false
      } else {
        // Add interest
        const payload = {
          job_id: jobId,
          external_job_id: extId,
          job_title: job.title,
          company: job.company,
          job_data: {
            location: job.location,
            salary_range: job.salary_range,
            job_type: job.job_type,
            required_skills: job.required_skills,
            apply_url: job.apply_url,
            source: job.source,
            match_score: job.match_score
          },
          status: 'interested'
        }
        const res = await api.post('/jobs/interested', payload)
        if (res.data.interest) {
          setInterestedJobs((prev) => [res.data.interest, ...prev])
        }
        toast.success(`Saved "${job.title}" to Campus Board ⭐`)
        return true
      }
    } catch (err) {
      console.error('Error toggling job interest:', err)
      toast.error(err.response?.data?.error || 'Please log in to save jobs to your Campus Board')
      return null
    }
  }, [interestedJobs])

  const updateInterestStatus = useCallback(async (interestId, status, notes = null) => {
    try {
      const res = await api.patch(`/jobs/interested/${interestId}/status`, { status, notes })
      if (res.data.interest) {
        setInterestedJobs((prev) =>
          prev.map((i) => (i.id === interestId ? res.data.interest : i))
        )
        toast.success(`Updated stage to ${status.toUpperCase()}`)
      }
      return res.data.interest
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Failed to update stage')
      return null
    }
  }, [])

  const isJobInterested = useCallback((job) => {
    if (!job) return false
    const jobId = job.id && typeof job.id === 'number' ? job.id : null
    const extId = job.external_id || (typeof job.id === 'string' ? job.id : null)
    return interestedJobs.some(
      (i) => (jobId && i.job_id === jobId) || (extId && i.external_job_id === extId) || (i.job_title === job.title && i.company === job.company)
    )
  }, [interestedJobs])

  const getJobById = useCallback(async (id) => {
    try {
      setIsLoading(true)
      setError(null)
      // 1. Check if it's already in the currently loaded jobs
      const cached = jobs.find(j => String(j.id) === String(id) || String(j.external_id) === String(id))
      if (cached) {
        setSelectedJob(cached)
        return cached
      }
      
      // 2. Check if it's in saved pipeline (interestedJobs)
      const pipelineCached = interestedJobs.find(
        j => String(j.job_id) === String(id) || String(j.external_job_id) === String(id)
      )
      if (pipelineCached && pipelineCached.job_data) {
        const fullJob = {
          id,
          external_id: id,
          title: pipelineCached.job_title,
          company: pipelineCached.company,
          status: pipelineCached.status,
          ...pipelineCached.job_data
        }
        setSelectedJob(fullJob)
        return fullJob
      }

      // 3. Query backend
      const res = await api.get(`/jobs/${id}`)
      setSelectedJob(res.data)
      return res.data
    } catch (err) {
      console.log('Error fetching job:', err)
      const errorMsg = err.response?.data?.error || 'Opportunity not found or has expired'
      setError(errorMsg)
      setSelectedJob(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [jobs, interestedJobs])

  const fetchDomains = useCallback(async () => {
    try {
      const res = await api.get('/jobs/domains')
      setDomains(res.data.domains || ['Software Engineering', 'Data Science', 'Frontend', 'Backend', 'DevOps'])
    } catch (e) {
      setDomains(['Software Engineering', 'Data Science', 'Frontend', 'Backend', 'DevOps'])
    }
  }, [])

  useEffect(() => {
    // Note: fetchJobs is driven explicitly by consuming components (e.g. JobList) with custom parameters.
    fetchDomains()
    fetchInterestedJobs()
  }, [fetchDomains, fetchInterestedJobs])

  return {
    jobs,
    selectedJob,
    interestedJobs,
    isLoading,
    error,
    totalPages,
    total,
    domains,
    isLiveMode,
    setIsLiveMode,
    fetchJobs,
    fetchLiveJobs,
    fetchLiveMatches,
    fetchInterestedJobs,
    toggleJobInterest,
    updateInterestStatus,
    isJobInterested,
    getJobById
  }
}

export const useJob = useJobs
export default useJobs

