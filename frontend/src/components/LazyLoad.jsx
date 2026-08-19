// frontend/src/components/LazyLoad.jsx

import React, { Suspense, lazy } from 'react'
import { LoadingFallback } from './common/LoadingFallback'

// Lazy load pages
export const LazyLogin = lazy(() => import('../pages/auth/Login'))
export const LazyRegister = lazy(() => import('../pages/auth/Register'))
export const LazyDashboard = lazy(() => import('../pages/student/Dashboard'))
export const LazyFacultyDashboard = lazy(() => import('../pages/faculty/Dashboard'))
export const LazyAdminDashboard = lazy(() => import('../pages/admin/Dashboard'))
export const LazyResumeUpload = lazy(() => import('../pages/resume/ResumeUpload'))
export const LazyResumeList = lazy(() => import('../pages/resume/ResumeList'))
export const LazyResumeDetail = lazy(() => import('../pages/resume/ResumeDetail'))
export const LazyJobList = lazy(() => import('../pages/jobs/JobList'))
export const LazyJobDetail = lazy(() => import('../pages/jobs/JobDetail'))
export const LazySkillGap = lazy(() => import('../pages/skills/SkillGapAnalysis'))
export const LazyLearningPath = lazy(() => import('../pages/skills/LearningPath'))
export const LazyNotifications = lazy(() => import('../pages/notifications/Notifications'))
export const LazyProfile = lazy(() => import('../pages/settings/Profile'))
export const LazySettings = lazy(() => import('../pages/settings/Settings'))

export const LazyComponent = ({ component: Component, fallback = <LoadingFallback /> }) => (
  <Suspense fallback={fallback}>
    <Component />
  </Suspense>
)

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
  LazyFacultyDashboard,
  LazyAdminDashboard,
  LazyResumeUpload,
  LazyResumeList,
  LazyResumeDetail,
  LazyJobList,
  LazyJobDetail,
  LazySkillGap,
  LazyLearningPath,
  LazyNotifications,
  LazyProfile,
  LazySettings,
  LazyComponent,
  withLazyLoad,
}
