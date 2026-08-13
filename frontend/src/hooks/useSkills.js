// frontend/src/hooks/useSkills.js

import { useState, useCallback } from 'react'
import { api } from '../services/api'

export const useSkills = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const getGapAnalysis = useCallback(async (resumeId) => {
    try {
      setIsLoading(true)
      const targetId = resumeId || 1
      const res = await api.get(`/prediction/skill-gap/${targetId}`)
      return res.data
    } catch (err) {
      console.log('Error fetching gap analysis:', err)
      setError(err.response?.data?.error || 'Failed to fetch skill gap analysis')
      return {
        match_percentage: 0,
        matching_skills: [],
        missing_skills: [],
        recommendations: [],
        learning_path: []
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const learningPath = useCallback(async () => {
    return [
      {
        id: 1,
        title: 'Python Core & Advanced Concepts',
        status: 'completed',
        duration: '2 weeks',
        courses: ['Master Python Programming']
      },
      {
        id: 2,
        title: 'Database & SQL Engineering',
        status: 'in-progress',
        duration: '3 weeks',
        courses: ['Relational Databases & SQL']
      },
      {
        id: 3,
        title: 'Machine Learning & Model Stacking',
        status: 'pending',
        duration: '4 weeks',
        courses: ['Ensemble Methods in Machine Learning']
      }
    ]
  }, [])

  return {
    isLoading,
    error,
    getGapAnalysis,
    learningPath
  }
}
