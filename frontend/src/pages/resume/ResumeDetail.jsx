// src/pages/resume/ResumeDetail.jsx

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResume } from '../../hooks/useResume'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/outline'

export const ResumeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getResume, deleteResume, isLoading } = useResume()
  const [resume, setResume] = React.useState(null)
  const [fetchError, setFetchError] = React.useState(null)

  React.useEffect(() => {
    const fetchResumeData = async () => {
      if (!id) return
      try {
        setFetchError(null)
        const data = await getResume(id)
        setResume(data)
      } catch (err) {
        console.error('Failed to fetch resume:', err)
        setFetchError(err.message || 'Failed to load resume details')
      }
    }
    fetchResumeData()
  }, [id])

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      await deleteResume(id)
      navigate('/resume')
    }
  }

  // Derive candidate name cleanly from resume user data, current user, or filename
  const candidateName = React.useMemo(() => {
    if (resume?.candidate_name) return resume.candidate_name
    if (user?.full_name) return user.full_name
    if (resume?.filename) {
      // Remove extension and format underscores / hyphens to clean title case
      const cleaned = resume.filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
      return cleaned
    }
    return 'Candidate Resume'
  }, [resume, user])

  if (isLoading && !resume) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (fetchError || !resume) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Heading level={3} className="text-gray-800">Resume Not Found</Heading>
        <p className="text-gray-500 mt-2">{fetchError || 'Could not find the requested resume.'}</p>
        <Button className="mt-6" onClick={() => navigate('/resume')}>
          Back to Resumes
        </Button>
      </div>
    )
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Heading level={2} className="text-gray-900 truncate">
                {candidateName}
              </Heading>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-sm text-gray-500 mt-1.5">
                <span>
                  Uploaded on {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : 'N/A'}
                </span>
                {resume.filename && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 max-w-xs truncate"
                      title={resume.filename}
                    >
                      <DocumentTextIcon className="h-3.5 w-3.5 mr-1 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{resume.filename}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2.5 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate(`/skills/${resume.id}`)} className="whitespace-nowrap">
                Skill Gap Analysis
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} className="whitespace-nowrap">
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills */}
            <div className="border rounded-xl p-5 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Extracted Skills</h4>
                <span className="text-xs font-semibold px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                  {resume.skills?.length || 0} Skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                {resume.skills?.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
                {(!resume.skills || resume.skills.length === 0) && (
                  <p className="text-gray-400 text-sm">No skills extracted</p>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="border rounded-xl p-5 bg-gray-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Employability Score</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {resume.employability_score >= 70 ? 'High Readiness' : 'Moderate Readiness'}
                  </span>
                </div>
                <div className="flex items-center my-4">
                  <div className="flex-1 h-3.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${resume.employability_score || 0}%` }}
                    />
                  </div>
                  <span className="ml-4 text-2xl font-black text-gray-900">
                    {Math.round(resume.employability_score || 0)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Calculated dynamically based on extracted core competencies, technical proficiency, and job market trends.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            <div className="border rounded-xl p-5 bg-gray-50/50">
              <h4 className="font-semibold text-gray-900 mb-3">Education & Academics</h4>
              {resume.education && resume.education.length > 0 ? (
                <div className="space-y-3">
                  {resume.education.map((edu, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-sm">
                      <div className="font-semibold text-gray-800">{edu.degree || 'Degree'}</div>
                      <div className="text-gray-600 whitespace-pre-line">{edu.institution || 'Academic Institute'}</div>
                      {edu.gpa && (
                        <div className="text-xs text-primary-600 font-medium mt-1">GPA / Score: {edu.gpa}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No structured education entries parsed</p>
              )}
            </div>

            {/* Recommended Roles */}
            <div className="border rounded-xl p-5 bg-gray-50/50">
              <h4 className="font-semibold text-gray-900 mb-3">Recommended Career Paths</h4>
              {resume.recommended_roles && resume.recommended_roles.length > 0 ? (
                <div className="space-y-2">
                  {resume.recommended_roles.map((role, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-sm">
                      <span className="font-medium text-gray-800">{role}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                        High Match
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No specific role recommendations generated</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeDetail