// frontend/src/hooks/useSkills.js

import { useState, useCallback } from 'react'
import { api } from '../services/api'

export const useSkills = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const getGapAnalysis = useCallback(async (resumeId, targetRole) => {
    try {
      setIsLoading(true)
      setError(null)
      const url = resumeId ? `/prediction/skill-gap/${resumeId}` : `/prediction/skill-gap/latest`
      const params = {}
      if (targetRole) {
        params.target_role = targetRole
      }
      const res = await api.get(url, { params })
      return res.data
    } catch (err) {
      console.error('Error fetching gap analysis:', err)
      const errMessage = err.response?.data?.error || 'Failed to fetch skill gap analysis'
      setError(errMessage)
      return {
        error: errMessage,
        no_resume: err.response?.data?.no_resume || err.response?.status === 404,
        match_percentage: 0,
        matching_skills: [],
        missing_skills: [],
        recommendations: [],
        learning_path: [],
        available_roles: ['Software Engineer', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Data Scientist', 'ML Engineer']
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const learningPath = useCallback(async (resumeId, targetRole) => {
    try {
      setIsLoading(true)
      const url = resumeId ? `/prediction/skill-gap/${resumeId}` : `/prediction/skill-gap/latest`
      const params = {}
      if (targetRole) {
        params.target_role = targetRole
      }
      const res = await api.get(url, { params })
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
