// src/pages/resume/ResumeDetail.jsx

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/outline'

export const ResumeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getResume, isLoading } = useResume()
  const [resume, setResume] = React.useState(null)

  React.useEffect(() => {
    const fetchResume = async () => {
      const data = await getResume(id)
      setResume(data)
    }
    fetchResume()
  }, [id, getResume])

  if (isLoading || !resume) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/resume')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Resumes
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <Heading level={2}>{resume.filename}</Heading>
              <p className="text-gray-500 mt-1">
                Uploaded on {new Date(resume.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">Download</Button>
              <Button variant="danger" size="sm">Delete</Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills */}
            <div className="border rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {resume.skills?.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
                {(!resume.skills || resume.skills.length === 0) && (
                  <p className="text-gray-400 text-sm">No skills extracted</p>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="border rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Employability Score</h4>
              <div className="flex items-center">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                    style={{ width: `${resume.employability_score || 0}%` }}
                  />
                </div>
                <span className="ml-4 text-2xl font-bold text-gray-900">
                  {resume.employability_score || 0}%
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Based on your skills and job market requirements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}