// src/pages/student/Dashboard.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useResume } from '../../hooks/useResume'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import {
  DocumentIcon,
  BriefcaseIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  RefreshIcon
} from '@heroicons/react/outline'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { resumes, fetchResumes } = useResume()

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
        fetchResumes()
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
      fetchResumes()
    } catch (err) {
      console.error('Process resume error:', err)
    }
  }

  const latestResume = resumes && resumes.length > 0 ? resumes[0] : null
  const scoreDisplay = latestResume?.employability_score
    ? `${Math.round(latestResume.employability_score)}%`
    : (resumes?.length > 0 ? 'Pending' : '--')
  const totalSkills = latestResume?.skills ? latestResume.skills.length : 0
  const resumeCount = resumes ? resumes.length : 0

  const stats = [
    { name: 'Employability Score', value: scoreDisplay, icon: ChartBarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Resumes Uploaded', value: `${resumeCount}`, icon: DocumentIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Extracted Skills', value: `${totalSkills}`, icon: AcademicCapIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Profile Status', value: user?.department ? 'Active' : 'Incomplete', icon: BriefcaseIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.full_name || 'Student'} 👋
          </h1>
          <p className="mt-2 text-white/80">
            Track your real progress and get personalized AI career recommendations
          </p>
        </div>
        {resumes?.length > 0 && (
          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 self-start md:self-auto"
            onClick={() => fetchResumes()}
          >
            <RefreshIcon className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        )}
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
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

      {/* Recent Activity & Real Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Resumes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Resumes</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/resume')}>View All</Button>
          </div>
          {resumes?.length > 0 ? (
            <div className="space-y-3">
              {resumes.slice(0, 3).map((resume) => (
                <div 
                  key={resume.id} 
                  onClick={() => navigate(`/resume/${resume.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="h-5 w-5 text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resume.filename}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : 'N/A'}
                        {resume.skills?.length ? ` • ${resume.skills.length} skills found` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
              <p className="mt-2 text-gray-500">No resumes uploaded yet</p>
              <Button className="mt-4" onClick={() => navigate('/resume/upload')}>Upload Resume</Button>
            </div>
          )}
        </div>

        {/* Dynamic Recommended Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Actions</h3>
          </div>
          <div className="space-y-4">
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center justify-between p-3 border border-blue-100 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-blue-900">Complete your profile</p>
                <p className="text-xs text-blue-700">{profilePercentage}% complete</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-blue-600" />
            </div>

            {resumes?.length === 0 ? (
              <div 
                onClick={() => navigate('/resume/upload')}
                className="flex items-center justify-between p-3 border border-yellow-100 rounded-lg bg-yellow-50 cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-yellow-900">Upload your resume</p>
                  <p className="text-xs text-yellow-700">Get AI skill extraction and job matching</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-yellow-600" />
              </div>
            ) : (
              <div 
                onClick={() => navigate(completedResume ? `/skills/${completedResume.id}` : '/skills')}
                className="flex items-center justify-between p-3 border border-yellow-100 rounded-lg bg-yellow-50 cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-yellow-900">Skill Gap & Market Readiness</p>
                  <p className="text-xs text-yellow-700">Compare your skills against active market roles</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-yellow-600" />
              </div>
            )}

            <div 
              onClick={() => navigate('/jobs')}
              className="flex items-center justify-between p-3 border border-green-100 rounded-lg bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-green-900">Explore Matching Opportunities</p>
                <p className="text-xs text-green-700">{jobCount} active positions available</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard