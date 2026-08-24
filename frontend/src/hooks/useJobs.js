// frontend/src/hooks/useJobs.js

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

export const useJobs = () => {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [domains, setDomains] = useState([])
  const [isLiveMode, setIsLiveMode] = useState(false)

  const fetchJobs = useCallback(async (params = {}) => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get('/jobs', { params })
      const jobList = res.data.jobs || []
      setJobs(jobList)
      setTotalPages(res.data.pages || 1)
      setTotal(res.data.total || jobList.length)
    } catch (err) {
      console.log('Error fetching jobs:', err)
      setError(err.response?.data?.error || 'Failed to fetch jobs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchLiveJobs = useCallback(async (params = {}) => {
    try {
      setIsLoading(true)
      setError(null)
      setIsLiveMode(true)
      const res = await api.get('/jobs/live', { params })
      const liveList = res.data.jobs || []
      setJobs(liveList)
      setTotal(liveList.length)
      setTotalPages(1)
      return liveList
    } catch (err) {
      console.log('Error fetching live jobs:', err)
      setError(err.response?.data?.error || 'Failed to fetch live jobs')
      return []
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

  const getJobById = useCallback(async (id) => {
    try {
      setIsLoading(true)
      // Check if it's already in the currently loaded live jobs
      const cached = jobs.find(j => String(j.id) === String(id) || String(j.external_id) === String(id))
      if (cached) {
        setSelectedJob(cached)
        return cached
      }
      
      const res = await api.get(`/jobs/${id}`)
      setSelectedJob(res.data)
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch job')
    } finally {
      setIsLoading(false)
    }
  }, [jobs])

  const fetchDomains = useCallback(async () => {
    try {
      const res = await api.get('/jobs/domains')
      setDomains(res.data.domains || ['Software Engineering', 'Data Science', 'Frontend', 'Backend', 'DevOps'])
    } catch (e) {
      setDomains(['Software Engineering', 'Data Science', 'Frontend', 'Backend', 'DevOps'])
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    fetchDomains()
  }, [fetchJobs, fetchDomains])

  return {
    jobs,
    selectedJob,
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
    getJobById
  }
}

export const useJob = useJobs
export default useJobs
