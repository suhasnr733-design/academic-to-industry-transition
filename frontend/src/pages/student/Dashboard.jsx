// src/pages/student/Dashboard.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useResume } from '../../hooks/useResume'
import { useJobs } from '../../hooks/useJobs'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import { WelcomeActionsModal } from '../../components/dashboard/WelcomeActionsModal'
import {
  DocumentIcon,
  BriefcaseIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  LocationMarkerIcon,
  OfficeBuildingIcon,
  SparklesIcon,
  RefreshIcon
} from '@heroicons/react/outline'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { resumes, fetchResumes } = useResume()
  const { jobs, isLoading: jobsLoading } = useJobs()

  const [jobCount, setJobCount] = useState(0)
  const [skillGapCount, setSkillGapCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // 1. Compute dynamic profile completeness
  const profileFields = ['full_name', 'email', 'department', 'year_of_study']
  const filledFields = profileFields.filter((f) => Boolean(user?.[f]))
  const profilePercentage = Math.round((filledFields.length / profileFields.length) * 100)

  // 2. Determine active resume
  const latestResume = resumes?.[0]
  const completedResume = resumes?.find((r) => r.status === 'completed') || latestResume

  // 3. Automatically trigger processing for pending resumes & poll status
  useEffect(() => {
    if (!latestResume) return

    if (latestResume.status === 'pending') {
      api.post(`/resume/${latestResume.id}/process`)
        .catch(() => {})
        .finally(() => {
          setIsProcessing(true)
        })
    }

    if (latestResume.status === 'processing' || latestResume.status === 'pending') {
      setIsProcessing(true)
      const timer = setInterval(() => {
        if (fetchResumes) fetchResumes()
      }, 3000)
      return () => clearInterval(timer)
    } else {
      setIsProcessing(false)
    }
  }, [latestResume?.status, latestResume?.id])

  // 4. Fetch jobs & skill gaps dynamically
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const jobsRes = await api.get('/jobs')
        const jobsList = jobsRes.data?.jobs || []
        setJobCount(jobsList.length)

        if (completedResume && completedResume.status === 'completed') {
          if (completedResume.skills && completedResume.skills.length > 0) {
            const missing = Math.max(1, 8 - completedResume.skills.length)
            setSkillGapCount(completedResume.skill_gaps?.length || missing)
          } else {
            setSkillGapCount(0)
          }
        } else {
          setSkillGapCount(0)
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err)
      }
    }

    fetchDashboardMetrics()
  }, [completedResume?.id, completedResume?.status])

  // 5. Dynamic Stats Calculation
  const resumeScoreValue = completedResume
    ? completedResume.status === 'completed' && completedResume.employability_score != null
      ? `${Math.round(completedResume.employability_score)}%`
      : completedResume.status === 'processing'
      ? 'Processing...'
      : 'Pending'
    : '0%'

  const stats = [
    {
      name: 'Resume Score',
      value: resumeScoreValue,
      icon: DocumentIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: completedResume?.status === 'completed' ? 'Calculated from AI parsing' : 'Upload or process resume'
    },
    {
      name: 'Available Jobs',
      value: `${jobCount}`,
      icon: BriefcaseIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
      description: 'Active matching openings'
    },
    {
      name: 'Skills Extracted',
      value: `${completedResume?.skills?.length || 0}`,
      icon: ChartBarIcon,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      description: completedResume?.skills?.length ? 'Extracted from your resume' : 'No skills extracted yet'
    },
    {
      name: 'Resumes Uploaded',
      value: `${resumes?.length || 0}`,
      icon: AcademicCapIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      description: 'Total active versions'
    },
  ]

  const handleProcessResume = async (e, resumeId) => {
    e.stopPropagation()
    try {
      setIsProcessing(true)
      await api.post(`/resume/${resumeId}/process`)
      if (fetchResumes) fetchResumes()
    } catch (err) {
      console.error('Process resume error:', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Login Welcome Modal Popup */}
      <WelcomeActionsModal />

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.full_name || 'Student'} 👋
            </h1>
            <p className="mt-2 text-white/85 text-sm sm:text-base">
              Track your employability insights, resume updates, and top industry job matches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {resumes?.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm"
                onClick={() => fetchResumes && fetchResumes()}
              >
                <RefreshIcon className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm"
              onClick={() => navigate('/resume/upload')}
            >
              Upload Resume
            </Button>
            <Button
              size="sm"
              className="bg-white text-primary-700 hover:bg-gray-100 shadow-sm"
              onClick={() => navigate('/jobs')}
            >
              Explore Jobs
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Resumes + Matched Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Resumes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DocumentIcon className="w-5 h-5 text-primary-600" />
                Recent Resumes
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/resume')}>View All</Button>
            </div>
            {resumes?.length > 0 ? (
              <div className="space-y-3">
                {resumes.slice(0, 3).map((resume) => (
                  <div 
                    key={resume.id} 
                    onClick={() => navigate(`/resume/${resume.id}`)}
                    className="flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-primary-50/40 rounded-xl cursor-pointer border border-gray-100 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-white shadow-xs">
                        <DocumentIcon className="h-5 w-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{resume.filename}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : 'N/A'}
                          {resume.skills?.length ? ` • ${resume.skills.length} skills found` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        resume.status === 'completed' ? 'bg-green-100 text-green-800' :
                        resume.status === 'processing' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {resume.status}
                      </span>
                      {resume.status === 'pending' && (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={(e) => handleProcessResume(e, resume.id)}
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-gray-500 text-sm">No resumes uploaded yet</p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/resume/upload')}>Upload Resume</Button>
              </div>
            )}
          </div>
          {resumes?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 text-right">
              <button 
                onClick={() => navigate('/resume/upload')} 
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                + Upload another resume
              </button>
            </div>
          )}
        </div>

        {/* Top Matched Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-primary-600" />
                Top Matched Jobs
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>View All</Button>
            </div>

            {jobs && jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-primary-50/40 rounded-xl cursor-pointer border border-gray-100 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-white shadow-xs mt-0.5">
                        <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{job.company || 'Industry Partner'}</span>
                          {job.location && (
                            <>
                              <span>•</span>
                              <span>{job.location}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {job.job_type || 'Full Time'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                <BriefcaseIcon className="h-10 w-10 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm font-medium text-gray-800">Explore career opportunities</p>
                <p className="text-xs text-gray-500 mt-0.5">Discover roles matching your extracted skill profile.</p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/jobs')}>
                  Browse Job Portal
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Tailored to your skills</span>
            <button
              onClick={() => navigate('/skills')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              Analyze Skill Gaps &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard