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
    // Check assessment status strictly scoped to active resumes
    const checkAssessment = async () => {
      // If no resumes uploaded, assessment cannot be completed
      if (!resumes || resumes.length === 0) {
        setAssessmentCompleted(false)
        setAssessmentScore(null)
        return
      }

      const activeResume = resumes[0]
      const resumeId = activeResume?.id || 'default'
      const resumeCreatedAt = activeResume?.created_at ? new Date(activeResume.created_at).getTime() : 0

      // Check per-resume completion flag in localStorage
      const storedCompletedForResume = localStorage.getItem(`assessment_completed_for_resume_${resumeId}`) === 'true'
      const storedScore = localStorage.getItem(`assessment_score_for_resume_${resumeId}`)
      
      if (storedCompletedForResume && storedScore) {
        setAssessmentCompleted(true)
        setAssessmentScore(Number(storedScore))
        return
      }

      // Check backend latest assessment
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const res = await api.get('/assessment/latest')
          if (res.data?.has_assessment && res.data?.result) {
            const assessCreatedAt = res.data.result.created_at ? new Date(res.data.result.created_at).getTime() : 0
            
            // Only consider assessment completed if it was taken at or after the active resume was uploaded
            if (assessCreatedAt > 0 && resumeCreatedAt > 0 && assessCreatedAt >= resumeCreatedAt - 120000) {
              const scoreVal = Math.round(res.data.result.score || 85)
              setAssessmentCompleted(true)
              setAssessmentScore(scoreVal)
              localStorage.setItem(`assessment_completed_for_resume_${resumeId}`, 'true')
              localStorage.setItem(`assessment_score_for_resume_${resumeId}`, String(scoreVal))
              return
            }
          }
        } catch (e) {
          // fallback gracefully
        }
      }

      // Default: Fresh state for newly uploaded resume
      setAssessmentCompleted(false)
      setAssessmentScore(null)
    }

    checkAssessment()
    // Listen for storage updates
    window.addEventListener('storage', checkAssessment)
    return () => window.removeEventListener('storage', checkAssessment)
  }, [user, resumes])

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
        description: !resumeDetails.isComplete
          ? 'Requires resume upload first to personalize questions'
          : assessmentCompleted 
            ? `Assessment complete (Score: ${assessmentScore}%)` 
            : 'Personalized evaluation (Easy → Medium → Hard)',
        isCompleted: Boolean(resumeDetails.isComplete && assessmentCompleted),
        link: !resumeDetails.isComplete ? '/resume/upload' : '/assessment',
        badge: !resumeDetails.isComplete ? 'Resume Required' : assessmentCompleted ? 'Verified' : 'Recommended',
        actionLabel: !resumeDetails.isComplete ? 'Upload Resume First' : assessmentCompleted ? 'Retake Test' : 'Start Assessment',
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
    const activeResume = resumes && resumes.length > 0 ? resumes[0] : null
    const resumeId = activeResume?.id || 'default'
    localStorage.setItem(`assessment_completed_for_resume_${resumeId}`, 'true')
    localStorage.setItem(`assessment_score_for_resume_${resumeId}`, String(score))
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
