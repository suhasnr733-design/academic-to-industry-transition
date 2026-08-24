// frontend/src/hooks/useAssessments.js

import { useState, useCallback } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export const useAssessments = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const startAssessment = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get('/assessment/start')
      if (res.data?.requires_resume) {
        return {
          requires_resume: true,
          error: res.data?.error || 'Please upload a resume first.'
        }
      }
      const session = res.data?.session || {}
      return session
    } catch (err) {
      console.error('Failed to start assessment:', err)
      const isRequiresResume = err.response?.data?.requires_resume || false
      const message = err.response?.data?.error || 'Failed to start assessment'
      setError(message)
      if (!isRequiresResume) {
        toast.error(message)
      }
      return {
        requires_resume: isRequiresResume,
        error: message
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const submitAssessment = useCallback(async (answers, timeTaken = 0) => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.post('/assessment/submit', {
        answers,
        time_taken: timeTaken
      })
      return res.data?.result
    } catch (err) {
      console.error('Failed to submit assessment:', err)
      const message = err.response?.data?.error || 'Failed to submit assessment'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getLatestAssessment = useCallback(async () => {
    try {
      const res = await api.get('/assessment/latest')
      return res.data
    } catch (err) {
      console.error('Failed to fetch latest assessment:', err)
      return { has_assessment: false, result: null }
    }
  }, [])

  const getAssessmentHistory = useCallback(async () => {
    try {
      const res = await api.get('/assessment/history')
      return res.data?.history || []
    } catch (err) {
      console.error('Failed to fetch assessment history:', err)
      return []
    }
  }, [])

  return {
    isLoading,
    error,
    startAssessment,
    submitAssessment,
    getLatestAssessment,
    getAssessmentHistory
  }
}

export default useAssessments
