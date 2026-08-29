// src/pages/skills/SkillGapAnalysis.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSkills } from '../../hooks/useSkills'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ExternalLinkIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  SparklesIcon
} from '@heroicons/react/outline'
import { getPlatformUrl, getCourseUrl, getPlatformBadgeConfig } from '../../utils/courseUrls'

export const SkillGapAnalysis = () => {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const { getGapAnalysis, isLoading } = useSkills()
  const [analysis, setAnalysis] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')

  const fetchAnalysis = useCallback(async (role) => {
    try {
      setFetchError(null)
      const data = await getGapAnalysis(resumeId, role)
      setAnalysis(data)
      if (data?.target_role && !role) {
        setSelectedRole(data.target_role)
      }
    } catch (err) {
      console.error('Error in SkillGapAnalysis:', err)
      setFetchError(err.message || 'Failed to load skill gap analysis')
    }
  }, [resumeId, getGapAnalysis])

  useEffect(() => {
    fetchAnalysis(selectedRole)
  }, [resumeId])

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole)
    fetchAnalysis(newRole)
  }

  if (isLoading && !analysis) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Handle no resume state gracefully
  if (analysis?.no_resume || (!isLoading && !analysis?.resume_id && !analysis?.current_skills?.length && fetchError)) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-4 bg-primary-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
          <DocumentTextIcon className="h-10 w-10 text-primary-600" />
        </div>
        <Heading level={2} className="text-gray-900">No Resume Uploaded Yet</Heading>
        <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">
          Upload your resume to automatically extract your skills, analyze skill gaps for your target job roles, and get tailored course recommendations.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => navigate('/resume/upload')}>
            Upload Resume
          </Button>
          <Button variant="outline" onClick={() => navigate('/resume')}>
            View Resumes
          </Button>
        </div>
      </div>
    )
  }

  if (fetchError && !analysis) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-white rounded-2xl shadow-lg p-8">
        <Heading level={3} className="text-gray-800">Skill Gap Analysis Unavailable</Heading>
        <p className="text-gray-500 mt-2">{fetchError || 'Could not load skill gap analysis.'}</p>
        <Button className="mt-4" onClick={() => fetchAnalysis(selectedRole)}>
          Try Again
        </Button>
      </div>
    )
  }

  const matchPercentage = analysis?.match_percentage ?? 0
  const matchingSkills = analysis?.matching_skills || []
  const missingSkills = analysis?.missing_skills || []
  const currentSkills = analysis?.current_skills || []
  const recommendations = analysis?.recommendations || []
  const learningPath = analysis?.learning_path || []
  const recommendedRoles = analysis?.recommended_roles || [
    'Full Stack Developer',
    'Software Engineer',
    'Frontend Developer'
  ]
  const availableRoles = analysis?.available_roles || [
    'Full Stack Developer',
    'Software Engineer',
    'DevOps Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Data Scientist',
    'ML Engineer'
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-4 pb-6 border-b border-gray-100">
          <div>
            <Heading level={2}>Skill Gap Analysis</Heading>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center space-x-2">
                <BriefcaseIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Target Role:</span>
                <select
                  value={selectedRole || analysis?.target_role || 'Software Engineer'}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              {analysis?.filename && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md max-w-xs truncate" title={analysis.filename}>
                  Resume: {analysis.candidate_name || analysis.filename}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
            <div className="text-4xl font-black text-primary-600">
              {matchPercentage}%
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overall Match</div>
          </div>
        </div>

        {/* AI Recommended Role Quick Pills (Option 3) */}
        {recommendedRoles && recommendedRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gradient-to-r from-primary-50/70 via-indigo-50/40 to-transparent rounded-xl border border-primary-100/90">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary-800 mr-1">
              <SparklesIcon className="w-4 h-4 text-primary-600 animate-pulse" />
              <span>Top AI Recommendations:</span>
            </div>
            {recommendedRoles.map((role) => {
              const currentActiveRole = selectedRole || analysis?.target_role
              const isSelected = currentActiveRole === role
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-xs ring-2 ring-primary-300'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-primary-700 border border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <span>{role}</span>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Match Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Skill Match Alignment</span>
            <span className="font-semibold text-gray-700">{matchingSkills.length} of {matchingSkills.length + missingSkills.length} target skills met</span>
          </div>
          <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                matchPercentage >= 70
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : matchPercentage >= 40
                  ? 'bg-gradient-to-r from-primary-500 to-indigo-600'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${matchPercentage}%` }}
            />
          </div>
        </div>

        {/* Candidate's Extracted Skills Preview */}
        {currentSkills.length > 0 && (
          <div className="mb-8 p-4 bg-gray-50/80 rounded-xl border border-gray-200/70">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Skills Found in Resume ({currentSkills.length})
              </span>
              <Link to={`/resume/${analysis?.resume_id || ''}`} className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                View Resume Details &rarr;
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentSkills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-0.5 bg-white text-gray-700 border border-gray-200 rounded-md text-xs font-medium shadow-2xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matching Skills */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              Matching Skills ({matchingSkills.length})
            </h4>
            <div className="space-y-2">
              {matchingSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center p-3 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{skill}</span>
                </div>
              ))}
              {matchingSkills.length === 0 && (
                <p className="text-gray-400 text-center py-4 bg-gray-50 rounded-lg text-sm">
                  No matching skills identified yet
                </p>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              Missing Skills ({missingSkills.length})
            </h4>
            <div className="space-y-2">
              {missingSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center p-3 bg-red-50 rounded-lg">
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{skill}</span>
                  <span className="ml-auto text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Gap</span>
                </div>
              ))}
              {missingSkills.length === 0 && (
                <p className="text-gray-400 text-center py-4 bg-gray-50 rounded-lg text-sm">
                  No missing skills! You meet all requirements.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-gray-900 mb-4">Recommended Learning</h4>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 hover:border-primary-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900 text-base">{rec.skill}</span>
                      {rec.priority && (
                        <span className={`ml-3 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      )}
                    </div>
                    {rec.estimated_time && (
                      <span className="text-sm font-medium text-gray-500">{rec.estimated_time}</span>
                    )}
                  </div>
                  {rec.courses && rec.courses.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rec.courses.map((course, ci) => {
                        const courseTitle = typeof course === 'object' ? (course.title || course.name) : course
                        const courseUrl = getCourseUrl(course, rec.skill)
                        return (
                          <a
                            key={ci}
                            href={courseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-primary-600 hover:border-primary-300 hover:shadow-xs rounded-lg text-xs font-medium transition-all group cursor-pointer"
                            title={`Open ${courseTitle} webpage`}
                          >
                            <span>📚</span>
                            <span className="group-hover:underline">{courseTitle}</span>
                            <ExternalLinkIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                          </a>
                        )
                      })}
                    </div>
                  )}
                  {rec.platforms && rec.platforms.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 mr-1">Platforms:</span>
                      {rec.platforms.map((platform, pi) => {
                        const pConfig = getPlatformBadgeConfig(platform)
                        const pUrl = getPlatformUrl(platform, rec.skill)
                        return (
                          <a
                            key={pi}
                            href={pUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all shadow-2xs hover:shadow-xs ${pConfig.badgeClass} cursor-pointer`}
                            title={`Open ${rec.skill} courses on ${pConfig.name}`}
                          >
                            <span>Platform: {pConfig.name}</span>
                            <ExternalLinkIcon className="h-3 w-3 opacity-75" />
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center bg-gray-50 rounded-lg">
              No learning recommendations available.
            </p>
          )}
        </div>

        {/* Learning Path */}
        {learningPath.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Suggested Learning Path</h4>
            <div className="relative pl-8 border-l-2 border-primary-200 space-y-6">
              {learningPath.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-11 top-0.5 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {step.step || idx + 1}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h5 className="font-semibold text-gray-900">{step.skill}</h5>
                    {step.estimated_time && (
                      <p className="text-xs text-gray-500 mt-0.5">Estimated Duration: {step.estimated_time}</p>
                    )}
                    {step.courses && step.courses.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {step.courses.map((course, ci) => {
                          const courseTitle = typeof course === 'object' ? (course.title || course.name) : course
                          const courseUrl = getCourseUrl(course, step.skill)
                          return (
                            <a
                              key={ci}
                              href={courseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 hover:bg-primary-100 text-primary-700 hover:text-primary-900 border border-primary-100 rounded-full text-xs font-medium transition-all group cursor-pointer"
                              title={`Open ${courseTitle} webpage`}
                            >
                              <span className="group-hover:underline">{courseTitle}</span>
                              <ExternalLinkIcon className="h-3 w-3 text-primary-400 group-hover:text-primary-700" />
                            </a>
                          )
                        })}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/60">
                      <span className="text-xs text-gray-500 font-medium">Explore on:</span>
                      {['Coursera', 'Udemy', 'NPTEL'].map((plat, pi) => {
                        const pUrl = getPlatformUrl(plat, step.skill)
                        const pConfig = getPlatformBadgeConfig(plat)
                        return (
                          <a
                            key={pi}
                            href={pUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border transition-colors ${pConfig.badgeClass}`}
                            title={`Search ${step.skill} on ${plat}`}
                          >
                            <span>{plat}</span>
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SkillGapAnalysis