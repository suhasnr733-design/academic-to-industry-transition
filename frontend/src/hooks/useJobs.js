// frontend/src/hooks/useJobs.js

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

export const useJobs = () => {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)

  const fetchJobs = useCallback(async (params = {}) => {
    try {
      setIsLoading(true)
      const res = await api.get('/jobs', { params })
      setJobs(res.data.jobs || [])
      setTotalPages(res.data.pages || 1)
    } catch (err) {
      console.log('Error fetching jobs:', err)
      setError(err.response?.data?.error || 'Failed to fetch jobs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getJobById = useCallback(async (id) => {
    try {
      setIsLoading(true)
      const res = await api.get(`/jobs/${id}`)
      setSelectedJob(res.data)
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch job')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    jobs,
    selectedJob,
    isLoading,
    error,
    totalPages,
    fetchJobs,
    getJobById
  }
}

export const useJob = useJobs
