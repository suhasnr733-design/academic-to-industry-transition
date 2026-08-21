// frontend/src/App.jsx

import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store/store'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute, AdminRoute, FacultyRoute } from './components/common/ProtectedRoute'
import { LoadingFallback } from './components/common/LoadingFallback'

// Lazy loaded page components
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.default || m.Login })))
const Register = lazy(() => import('./pages/auth/Register').then(m => ({ default: m.default || m.Register })))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback').then(m => ({ default: m.default || m.AuthCallback })))
const Dashboard = lazy(() => import('./pages/student/Dashboard').then(m => ({ default: m.default || m.Dashboard })))
const AdvancedDashboard = lazy(() => import('./pages/dashboard/AdvancedDashboard').then(m => ({ default: m.default || m.AdvancedDashboard })))
const FacultyDashboard = lazy(() => import('./pages/faculty/Dashboard').then(m => ({ default: m.default || m.FacultyDashboard })))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.default || m.AdminDashboard })))
const ResumeUpload = lazy(() => import('./pages/resume/ResumeUpload').then(m => ({ default: m.default || m.ResumeUpload })))
const ResumeList = lazy(() => import('./pages/resume/ResumeList').then(m => ({ default: m.default || m.ResumeList })))
const ResumeDetail = lazy(() => import('./pages/resume/ResumeDetail').then(m => ({ default: m.default || m.ResumeDetail })))
const JobList = lazy(() => import('./pages/jobs/JobList').then(m => ({ default: m.default || m.JobList })))
const JobDetail = lazy(() => import('./pages/jobs/JobDetail').then(m => ({ default: m.default || m.JobDetail })))
const SkillGapAnalysis = lazy(() => import('./pages/skills/SkillGapAnalysis').then(m => ({ default: m.default || m.SkillGapAnalysis })))
const LearningPath = lazy(() => import('./pages/skills/LearningPath').then(m => ({ default: m.default || m.LearningPath })))
const Profile = lazy(() => import('./pages/settings/Profile').then(m => ({ default: m.default || m.Profile })))
const Settings = lazy(() => import('./pages/settings/Settings').then(m => ({ default: m.default || m.Settings })))
const Assessment = lazy(() => import('./pages/assessments/Assessment').then(m => ({ default: m.default || m.Assessment })))
const Notifications = lazy(() => import('./pages/notifications/Notifications').then(m => ({ default: m.default || m.Notifications })))

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingFallback />} persistor={persistor}>
        <HelmetProvider>
          <ThemeProvider>
            <AuthProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      
                      <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/dashboard/advanced" element={<AdvancedDashboard />} />
                        <Route path="/advanced-dashboard" element={<AdvancedDashboard />} />
                        <Route path="/resume" element={<ResumeList />} />
                        <Route path="/resume/upload" element={<ResumeUpload />} />
                        <Route path="/resume/:id" element={<ResumeDetail />} />
                        <Route path="/jobs" element={<JobList />} />
                        <Route path="/jobs/:id" element={<JobDetail />} />
                        <Route path="/skills" element={<SkillGapAnalysis />} />
                        <Route path="/skills/:resumeId" element={<SkillGapAnalysis />} />
                        <Route path="/learning" element={<LearningPath />} />
                        <Route path="/assessment" element={<Assessment />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/notifications" element={<Notifications />} />
                      </Route>
                      
                      <Route element={<FacultyRoute />}>
                        <Route path="/faculty" element={<FacultyDashboard />} />
                      </Route>
                      
                      <Route element={<AdminRoute />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                      </Route>
                      
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Suspense>
                </Layout>
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
              </BrowserRouter>
            </AuthProvider>
          </ThemeProvider>
        </HelmetProvider>
      </PersistGate>
    </Provider>
  )
}

export default App