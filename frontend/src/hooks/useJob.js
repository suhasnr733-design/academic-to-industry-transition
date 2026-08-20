// frontend/src/hooks/useJob.js

import { useState, useEffect } from 'react'
import { api } from '../services/api'

export const useJob = () => {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchJobs = async (params = {}) => {
    try {
      setIsLoading(true)
      const res = await api.get('/jobs', { params })
      setJobs(res.data.jobs || [])
    } catch (err) {
      console.log('Error fetching jobs:', err)
      setError(err.response?.data?.error || 'Failed to fetch jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const getJobById = async (id) => {
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
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return {
    jobs,
    selectedJob,
    isLoading,
    error,
    fetchJobs,
    getJobById
  }
}
