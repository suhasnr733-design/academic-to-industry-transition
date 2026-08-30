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

  const role = user?.role || 'student'
  const isFaculty = role === 'faculty'

  useEffect(() => {
    // Only check resume-based assessment for student accounts
    if (isFaculty) return

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
  }, [user, resumes, isFaculty])

  // Profile completion calculation (Role aware)
  const profileDetails = useMemo(() => {
    if (!user) return { percentage: 0, isComplete: false, missingHint: '' }

    if (isFaculty) {
      const facultyFields = [
        { key: 'full_name', name: 'name' },
        { key: 'email', name: 'email' },
        { key: 'department', name: 'department' },
        { key: 'college', name: 'institution' },
        { key: 'phone', name: 'office contact' },
        { key: 'bio', name: 'mentorship bio' }
      ]
      const filled = facultyFields.filter(f => user[f.key] && String(user[f.key]).trim().length > 0)
      const missing = facultyFields.filter(f => !user[f.key] || String(user[f.key]).trim().length === 0)
      const percentage = Math.round((filled.length / facultyFields.length) * 100)
      const isComplete = percentage >= 80 || Boolean(user.department && user.college && user.phone)

      let missingHint = ''
      if (missing.length > 0) {
        missingHint = `add ${missing.slice(0, 2).map(m => m.name).join(' & ')}`
      }

      return { percentage, isComplete, missingHint }
    }

    // Student fields: Core academic fields account for up to 70%, optional contact & bio for up to 30%
    const coreFields = [
      { key: 'full_name', name: 'name' },
      { key: 'email', name: 'email' },
      { key: 'department', name: 'department' },
      { key: 'year_of_study', name: 'year of study' },
      { key: 'college', name: 'college' }
    ]
    const optionalFields = [
      { key: 'phone', name: 'contact number' },
      { key: 'bio', name: 'career bio' }
    ]

    const filledCore = coreFields.filter(f => user[f.key] && String(user[f.key]).trim().length > 0)
    const filledOptional = optionalFields.filter(f => user[f.key] && String(user[f.key]).trim().length > 0)

    const coreScore = (filledCore.length / coreFields.length) * 70
    const optionalScore = (filledOptional.length / optionalFields.length) * 30
    const percentage = Math.min(100, Math.round(coreScore + optionalScore))
    const isComplete = percentage >= 70

    const missingCore = coreFields.filter(f => !user[f.key] || String(user[f.key]).trim().length === 0)
    const missingOptional = optionalFields.filter(f => !user[f.key] || String(user[f.key]).trim().length === 0)

    let missingHint = ''
    if (missingCore.length > 0) {
      missingHint = `add ${missingCore.slice(0, 2).map(m => m.name).join(' & ')}`
    } else if (missingOptional.length > 0) {
      missingHint = `add ${missingOptional.map(m => m.name).join(' & ')}`
    }

    return { percentage, isComplete, missingHint }
  }, [user, isFaculty])

  // Resume completion calculation (Students)
  const resumeDetails = useMemo(() => {
    const count = resumes ? resumes.length : 0
    return {
      count,
      isComplete: count > 0
    }
  }, [resumes])

  // Core recommended actions list (Role aware)
  const actions = useMemo(() => {
    if (isFaculty) {
      return [
        {
          id: 'profile',
          title: 'Complete Faculty Profile',
          description: profileDetails.isComplete
            ? `Faculty profile active (${profileDetails.percentage}% complete)`
            : `${profileDetails.percentage}% complete - ${profileDetails.missingHint || 'add department & college'}`,
          isCompleted: profileDetails.isComplete,
          link: '/profile',
          badge: profileDetails.isComplete ? 'Complete' : 'Pending',
          actionLabel: profileDetails.isComplete ? 'Edit Profile' : 'Complete Profile',
          category: 'onboarding'
        },
        {
          id: 'mentorship',
          title: 'Connect with Student Mentees',
          description: Boolean(user?.department)
            ? `Department (${user?.department}) mentorship channel open`
            : 'Set your department to receive student mentorship requests',
          isCompleted: Boolean(user?.department && (user?.college || user?.bio)),
          link: '/faculty?tab=requests',
          badge: Boolean(user?.department) ? 'Ready' : 'Setup Required',
          actionLabel: 'Mentorship Requests',
          category: 'onboarding'
        },
        {
          id: 'drives',
          title: 'Coordinate Campus Placement Drives',
          description: 'Inspect company drives, student attendees, and shortlist candidates',
          isCompleted: Boolean(user?.department && user?.college),
          link: '/faculty?tab=drives',
          badge: Boolean(user?.college) ? 'Active' : 'Institution Required',
          actionLabel: 'Campus Drives',
          category: 'onboarding'
        }
      ]
    }

    // Student Actions
    return [
      {
        id: 'profile',
        title: 'Complete your profile',
        description: profileDetails.isComplete 
          ? `Profile active (${profileDetails.percentage}% complete)` 
          : `${profileDetails.percentage}% complete - ${profileDetails.missingHint || 'add college & department'}`,
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
  }, [isFaculty, user, profileDetails, resumeDetails, assessmentCompleted, assessmentScore])

  // Advanced / next step recommendations when core onboarding is satisfied
  const advancedRecommendations = useMemo(() => {
    if (isFaculty) {
      return [
        {
          id: 'analytics',
          title: 'Cohort Skill Gap Analytics',
          description: 'Discover real-time technical skill deficits across student cohorts',
          link: '/faculty?tab=analytics',
          actionLabel: 'View Analytics'
        },
        {
          id: 'shortlist',
          title: 'Placement Shortlist & Bundle Export',
          description: 'Filter high-readiness candidates and export resume zip bundles',
          link: '/faculty?tab=shortlist',
          actionLabel: 'Shortlist Candidates'
        },
        {
          id: 'students',
          title: 'Department Student Directory',
          description: 'Track verified student resumes and live placement status',
          link: '/faculty?tab=students',
          actionLabel: 'Student Directory'
        }
      ]
    }

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
  }, [isFaculty])

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
    markAssessmentDone,
    isFaculty
  }
}

export default useRecommendedActions
