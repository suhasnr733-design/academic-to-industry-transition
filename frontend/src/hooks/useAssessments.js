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
      const session = res.data?.session || {}
      return session
    } catch (err) {
      console.error('Failed to start assessment:', err)
      const message = err.response?.data?.error || 'Failed to start assessment'
      setError(message)
      toast.error(message)
      // Fallback foundational questions in case of network issue
      return {
        session_id: 'offline_session',
        tested_skills: ['General Problem Solving', 'Web & Data'],
        source: 'foundational',
        questions: [
          {
            id: 'core_1',
            skill: 'Data Structures & Algorithms',
            question: 'What is the average time complexity of searching an element in a Hash Map / Hash Table?',
            options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)']
          },
          {
            id: 'sql_1',
            skill: 'SQL',
            question: 'Which SQL clause is used to filter groups after an aggregation using GROUP BY?',
            options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT']
          },
          {
            id: 'react_1',
            skill: 'React',
            question: 'Which React hook should you use to perform side effects (such as data fetching or subscriptions)?',
            options: ['useState', 'useContext', 'useEffect', 'useMemo']
          }
        ]
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
