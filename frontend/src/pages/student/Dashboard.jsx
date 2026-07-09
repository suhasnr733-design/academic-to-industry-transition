// src/pages/student/Dashboard.jsx

import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useResume } from '../../hooks/useResume'
import { Heading } from '../../components/common/Typography'
import { Button } from '../../components/common/Button'
import {
  DocumentIcon,
  BriefcaseIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/outline'

const stats = [
  { name: 'Resume Score', value: '78%', icon: DocumentIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Job Matches', value: '24', icon: BriefcaseIcon, color: 'text-green-600', bg: 'bg-green-50' },
  { name: 'Skills Gap', value: '5', icon: ChartBarIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { name: 'Courses Completed', value: '3', icon: AcademicCapIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
]

export const Dashboard = () => {
  const { user } = useAuth()
  const { resumes } = useResume()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.full_name} 👋
        </h1>
        <p className="mt-2 text-white/80">
          Track your progress and get personalized recommendations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Resumes</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          {resumes?.length > 0 ? (
            <div className="space-y-3">
              {resumes.slice(0, 3).map((resume) => (
                <div key={resume.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resume.filename}</p>
                      <p className="text-xs text-gray-500">Uploaded {new Date(resume.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    resume.status === 'completed' ? 'bg-green-100 text-green-800' :
                    resume.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {resume.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-2 text-gray-500">No resumes uploaded yet</p>
              <Button className="mt-4">Upload Resume</Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Actions</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-blue-100 rounded-lg bg-blue-50">
              <div>
                <p className="text-sm font-medium text-blue-900">Complete your profile</p>
                <p className="text-xs text-blue-700">80% complete</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center justify-between p-3 border border-yellow-100 rounded-lg bg-yellow-50">
              <div>
                <p className="text-sm font-medium text-yellow-900">Upload your resume</p>
                <p className="text-xs text-yellow-700">Get personalized job matches</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex items-center justify-between p-3 border border-green-100 rounded-lg bg-green-50">
              <div>
                <p className="text-sm font-medium text-green-900">Take a skill assessment</p>
                <p className="text-xs text-green-700">Identify skill gaps</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}