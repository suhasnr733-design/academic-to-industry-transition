// frontend/src/hooks/useRecommendedActions.js

import { useMemo, useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from './useAuth'
import { useResume } from './useResume'

export const useRecommendedActions = () => {
  const { user } = useAuth()
  const { resumes } = useResume()
  const [assessmentCompleted, setAssessmentCompleted] = useState(false)
  const [assessmentScore, setAssessmentScore] = useState(null)

  useEffect(() => {
    // Check assessment status from localStorage, user state, or backend API
    const checkAssessment = async () => {
      const storedCompleted = localStorage.getItem('assessment_completed') === 'true'
      const storedScore = localStorage.getItem('latest_assessment_score')
      if (storedCompleted) {
        setAssessmentCompleted(true)
        setAssessmentScore(storedScore || 85)
        return
      }

      if (user?.has_assessment || user?.assessment_score) {
        setAssessmentCompleted(true)
        setAssessmentScore(user?.assessment_score || 85)
        return
      }

      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const res = await api.get('/assessment/latest')
          if (res.data?.has_assessment && res.data?.result) {
            const scoreVal = Math.round(res.data.result.score || 85)
            setAssessmentCompleted(true)
            setAssessmentScore(scoreVal)
            localStorage.setItem('assessment_completed', 'true')
            localStorage.setItem('latest_assessment_score', String(scoreVal))
          }
        } catch (e) {
          // fallback gracefully
        }
      }
    }

    checkAssessment()
    // Listen for storage updates
    window.addEventListener('storage', checkAssessment)
    return () => window.removeEventListener('storage', checkAssessment)
  }, [user])

  // Profile completion calculation
  const profileDetails = useMemo(() => {
    if (!user) return { percentage: 0, isComplete: false }

    const fields = [
      user.full_name,
      user.email,
      user.department,
      user.year_of_study,
      user.college,
      user.phone,
      user.bio
    ]
    const filledCount = fields.filter(val => val && String(val).trim().length > 0).length
    const percentage = Math.round((filledCount / fields.length) * 100)
    const isComplete = percentage >= 70 || Boolean(user.department && user.college)

    return { percentage, isComplete }
  }, [user])

  // Resume completion calculation
  const resumeDetails = useMemo(() => {
    const count = resumes ? resumes.length : 0
    return {
      count,
      isComplete: count > 0
    }
  }, [resumes])

  // Core recommended actions list
  const actions = useMemo(() => {
    const items = [
      {
        id: 'profile',
        title: 'Complete your profile',
        description: profileDetails.isComplete 
          ? `Profile active (${profileDetails.percentage}% complete)` 
          : `${profileDetails.percentage}% complete - add college & department`,
        isCompleted: profileDetails.isComplete,
        link: '/profile',
        badge: profileDetails.isComplete ? 'Complete' : 'Pending',
        actionLabel: profileDetails.isComplete ? 'Edit Profile' : 'Complete Profile',
        category: 'onboarding'
      },
      {
        id: 'resume',
        title: 'Upload your resume',
        description: resumeDetails.isComplete 
          ? `${resumeDetails.count} ${resumeDetails.count === 1 ? 'resume' : 'resumes'} uploaded & analyzed` 
          : 'Upload your resume to get AI job matches',
        isCompleted: resumeDetails.isComplete,
        link: resumeDetails.isComplete ? '/resume' : '/resume/upload',
        badge: resumeDetails.isComplete ? 'Uploaded' : 'Action Required',
        actionLabel: resumeDetails.isComplete ? 'View Resumes' : 'Upload Resume',
        category: 'onboarding'
      },
      {
        id: 'assessment',
        title: 'Take a skill assessment',
        description: assessmentCompleted 
          ? `Assessment complete (Score: ${assessmentScore}%)` 
          : 'Identify skill gaps and test domain knowledge',
        isCompleted: assessmentCompleted,
        link: '/assessment',
        badge: assessmentCompleted ? 'Verified' : 'Recommended',
        actionLabel: assessmentCompleted ? 'Retake Test' : 'Start Assessment',
        category: 'onboarding'
      }
    ]

    return items
  }, [profileDetails, resumeDetails, assessmentCompleted, assessmentScore])

  // Advanced / next step recommendations when core onboarding is satisfied
  const advancedRecommendations = useMemo(() => {
    return [
      {
        id: 'jobs',
        title: 'Explore matched jobs',
        description: 'View curated jobs with AI matching algorithms',
        link: '/jobs',
        actionLabel: 'View Jobs'
      },
      {
        id: 'skills',
        title: 'Skill Gap Analysis',
        description: 'Discover high-demand industry skills for your target role',
        link: '/skills',
        actionLabel: 'Analyze Skills'
      },
      {
        id: 'learning',
        title: 'Personalized Learning Roadmap',
        description: 'Follow tailored courses and certifications',
        link: '/learning',
        actionLabel: 'Start Learning'
      }
    ]
  }, [])

  const completedCount = Array.isArray(actions) ? actions.filter(a => a?.isCompleted).length : 0
  const totalCount = Array.isArray(actions) && actions.length > 0 ? actions.length : 3
  const progressPercent = totalCount > 0 ? Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100))) : 0
  const allCoreCompleted = Boolean(totalCount > 0 && completedCount === totalCount)
  const pendingCount = Math.max(0, totalCount - completedCount)

  const markAssessmentDone = (score = 85) => {
    localStorage.setItem('assessment_completed', 'true')
    localStorage.setItem('latest_assessment_score', String(score))
    setAssessmentCompleted(true)
    setAssessmentScore(score)
  }

  return {
    actions,
    advancedRecommendations,
    completedCount,
    totalCount,
    progressPercent,
    allCoreCompleted,
    pendingCount,
    profileDetails,
    resumeDetails,
    assessmentCompleted,
    assessmentScore,
    markAssessmentDone
  }
}
