// src/pages/resume/ResumeList.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { DocumentIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/outline'

const statusConfig = {
  pending: { icon: ClockIcon, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Pending' },
  processing: { icon: ClockIcon, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Processing' },
  completed: { icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-100', label: 'Completed' },
  failed: { icon: ExclamationCircleIcon, color: 'text-red-500', bg: 'bg-red-100', label: 'Failed' },
}

export const ResumeList = () => {
  const { resumes, isLoading } = useResume()

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading level={2}>My Resumes</Heading>
          <p className="text-gray-500 mt-1">Manage your uploaded resumes</p>
        </div>
        <Link to="/resume/upload">
          <Button>Upload New</Button>
        </Link>
      </div>

      {resumes?.length > 0 ? (
        <div className="space-y-4">
          {resumes.map((resume) => {
            const status = statusConfig[resume.status] || statusConfig.pending
            const StatusIcon = status.icon

            return (
              <Link
                key={resume.id}
                to={`/resume/${resume.id}`}
                className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <DocumentIcon className="h-6 w-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{resume.filename}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {new Date(resume.created_at).toLocaleDateString()}
                        </span>
                        {resume.file_size && (
                          <span className="text-sm text-gray-500">
                            {(resume.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      <StatusIcon className="h-3.5 w-3.5 mr-1" />
                      {status.label}
                    </span>
                    {resume.employability_score && (
                      <span className="text-sm font-semibold text-gray-900">
                        Score: {resume.employability_score}%
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <DocumentIcon className="h-16 w-16 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No resumes uploaded</h3>
          <p className="mt-2 text-gray-500">Upload your first resume to get started</p>
          <Link to="/resume/upload">
            <Button className="mt-4">Upload Resume</Button>
          </Link>
        </div>
      )}
    </div>
  )
}