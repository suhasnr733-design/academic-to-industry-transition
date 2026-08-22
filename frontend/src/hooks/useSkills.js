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

  const learningPath = useCallback(async (resumeId) => {
    try {
      setIsLoading(true)
      if (!resumeId) {
        const resumesRes = await api.get('/resume')
        const resumesList = resumesRes.data?.resumes || resumesRes.data || []
        if (resumesList.length > 0) {
          resumeId = resumesList[0].id
        }
      }
      if (!resumeId) return []
      
      const res = await api.get(`/prediction/skill-gap/${resumeId}`)
      if (res.data && res.data.learning_path && res.data.learning_path.length > 0) {
        return res.data.learning_path
      }
      return []
    } catch (err) {
      console.log('No learning path found:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    getGapAnalysis,
    learningPath
  }
}
