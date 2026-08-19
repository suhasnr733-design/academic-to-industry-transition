// frontend/src/components/LazyLoad.jsx

import React, { Suspense, lazy } from 'react'
import { LoadingFallback } from './common/LoadingFallback'

// Lazy load components
export const LazyLogin = lazy(() => import('../pages/auth/Login'))
export const LazyRegister = lazy(() => import('../pages/auth/Register'))
export const LazyDashboard = lazy(() => import('../pages/student/Dashboard'))
export const LazyResumeUpload = lazy(() => import('../pages/resume/ResumeUpload'))
export const LazyResumeList = lazy(() => import('../pages/resume/ResumeList'))
export const LazyJobList = lazy(() => import('../pages/jobs/JobList'))
export const LazySkillGap = lazy(() => import('../pages/skills/SkillGapAnalysis'))
export const LazyLearningPath = lazy(() => import('../pages/skills/LearningPath'))
export const LazyNotifications = lazy(() => import('../pages/notifications/Notifications'))

export const withLazyLoad = (Component, fallback = <LoadingFallback />) => {
  return function LazyLoadedComponent(props) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    )
  }
}

export default {
  LazyLogin,
  LazyRegister,
  LazyDashboard,
  LazyResumeUpload,
  LazyResumeList,
  LazyJobList,
  LazySkillGap,
  LazyLearningPath,
  LazyNotifications,
  withLazyLoad,
}
