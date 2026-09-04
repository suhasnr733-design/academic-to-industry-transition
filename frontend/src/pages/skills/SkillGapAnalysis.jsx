// src/pages/skills/SkillGapAnalysis.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react'
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

  const swrKey = `swr_skill_gap_${resumeId || 'latest'}`

  const [analysis, setAnalysis] = useState(() => {
    try {
      const cached = sessionStorage.getItem(swrKey)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [fetchError, setFetchError] = useState(null)
  const [selectedRole, setSelectedRole] = useState(() => {
    try {
      const cached = sessionStorage.getItem(swrKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        return parsed.target_role || ''
      }
    } catch {}
    return ''
  })

  const roleAnalysisCache = useRef({})

  useEffect(() => {
    roleAnalysisCache.current = {}
    try {
      const cached = sessionStorage.getItem(swrKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.target_role) {
          roleAnalysisCache.current[parsed.target_role] = parsed
        }
      }
    } catch {}
  }, [resumeId, swrKey])

  const fetchAnalysis = useCallback(async (role) => {
    if (role && roleAnalysisCache.current[role]) {
      setAnalysis(roleAnalysisCache.current[role])
      return
    }

    try {
      setFetchError(null)
      const data = await getGapAnalysis(resumeId, role)
      if (data) {
        setAnalysis(data)
        if (data.target_role) {
          roleAnalysisCache.current[data.target_role] = data
          if (!role) {
            setSelectedRole(data.target_role)
          }
        }
        try {
          sessionStorage.setItem(swrKey, JSON.stringify(data))
        } catch (storageErr) {
          console.warn('Could not cache skill gap in sessionStorage:', storageErr)
        }
      }
    } catch (err) {
      console.error('Error in SkillGapAnalysis:', err)
      setFetchError(err.message || 'Failed to load skill gap analysis')
    }
  }, [resumeId, swrKey, getGapAnalysis])

  useEffect(() => {
    fetchAnalysis(selectedRole)
  }, [resumeId])

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole)
    if (roleAnalysisCache.current[newRole]) {
      setAnalysis(roleAnalysisCache.current[newRole])
    } else {
      fetchAnalysis(newRole)
    }
  }

  if (isLoading && !analysis) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  // Handle no resume state gracefully
  if (analysis?.no_resume || (!isLoading && !analysis?.resume_id && !analysis?.current_skills?.length && fetchError)) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6 text-center bg-[#111827] rounded-2xl shadow-xl border border-gray-800/80">
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center mb-4 text-indigo-400">
          <DocumentTextIcon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">No Resume Uploaded Yet</h2>
        <p className="text-gray-400 mt-2 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
          Upload your resume to automatically extract your skills, analyze skill gaps for your target job roles, and get tailored course recommendations.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => navigate('/resume/upload')}>
            Upload Resume
          </Button>
          <Button variant="secondary" onClick={() => navigate('/resume')}>
            View Resumes
          </Button>
        </div>
      </div>
    )
  }

  if (fetchError && !analysis) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-[#111827] rounded-2xl shadow-xl border border-gray-800 p-8">
        <h3 className="text-lg font-bold text-white">Skill Gap Analysis Unavailable</h3>
        <p className="text-gray-400 mt-2 text-xs">{fetchError || 'Could not load skill gap analysis.'}</p>
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
      <div className="bg-[#111827] rounded-2xl shadow-xl border border-gray-800/80 p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Skill Gap Analysis</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center space-x-2">
                <BriefcaseIcon className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-gray-300">Target Role:</span>
                <select
                  value={selectedRole || analysis?.target_role || 'Software Engineer'}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="px-3 py-1.5 bg-[#1E293B] border border-gray-700/80 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role} className="bg-[#111827] text-white">
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              {analysis?.filename && (
                <span className="text-xs text-gray-400 bg-[#1E293B] border border-gray-700/60 px-2.5 py-1 rounded-lg max-w-xs truncate" title={analysis.filename}>
                  Resume: {analysis.candidate_name || analysis.filename}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
            <div className="text-3xl font-black text-indigo-400">
              {matchPercentage}%
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Overall Match</div>
          </div>
        </div>

        {/* AI Recommended Role Quick Pills */}
        {recommendedRoles && recommendedRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 rounded-xl border border-indigo-500/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mr-1">
              <SparklesIcon className="w-4 h-4 text-indigo-400 animate-pulse" />
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-400/30'
                      : 'bg-[#1E293B] text-gray-300 hover:bg-[#334155] hover:text-white border border-gray-700/80'
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
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>Skill Match Alignment</span>
            <span className="font-semibold text-gray-200">{matchingSkills.length} of {matchingSkills.length + missingSkills.length} target skills met</span>
          </div>
          <div className="w-full h-3 bg-[#0F172A] rounded-full overflow-hidden border border-gray-800">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                matchPercentage >= 70
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : matchPercentage >= 40
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${matchPercentage}%` }}
            />
          </div>
        </div>

        {/* Candidate's Extracted Skills Preview */}
        {currentSkills.length > 0 && (
          <div className="mb-8 p-4 bg-[#1E293B]/40 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Skills Found in Resume ({currentSkills.length})
              </span>
              <Link to={`/resume/${analysis?.resume_id || ''}`} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                View Resume Details &rarr;
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentSkills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-[#1E293B] text-gray-200 border border-gray-700/70 rounded-lg text-xs font-medium">
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
            <h4 className="font-bold text-white mb-3 text-sm flex items-center">
              <CheckCircleIcon className="h-4 w-4 text-emerald-400 mr-2" />
              Matching Skills ({matchingSkills.length})
            </h4>
            <div className="space-y-2">
              {matchingSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400 mr-3 flex-shrink-0" />
                  <span className="text-emerald-300 text-xs font-semibold">{skill}</span>
                </div>
              ))}
              {matchingSkills.length === 0 && (
                <p className="text-gray-500 text-center py-4 bg-[#1E293B]/30 rounded-xl text-xs border border-gray-800">
                  No matching skills identified yet
                </p>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div>
            <h4 className="font-bold text-white mb-3 text-sm flex items-center">
              <XCircleIcon className="h-4 w-4 text-rose-400 mr-2" />
              Missing Skills ({missingSkills.length})
            </h4>
            <div className="space-y-2">
              {missingSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl">
                  <XCircleIcon className="h-4 w-4 text-rose-400 mr-3 flex-shrink-0" />
                  <span className="text-rose-300 text-xs font-semibold">{skill}</span>
                  <span className="ml-auto text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">Gap</span>
                </div>
              ))}
              {missingSkills.length === 0 && (
                <p className="text-gray-500 text-center py-4 bg-[#1E293B]/30 rounded-xl text-xs border border-gray-800">
                  No missing skills! You meet all requirements.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 border-t border-gray-800 pt-6">
          <h4 className="font-bold text-white mb-4 text-sm">Recommended Learning</h4>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 border border-gray-800 rounded-xl bg-[#1E293B]/50 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white text-sm">{rec.skill}</span>
                      {rec.priority && (
                        <span className={`ml-3 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          rec.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          rec.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      )}
                    </div>
                    {rec.estimated_time && (
                      <span className="text-xs font-medium text-gray-400">{rec.estimated_time}</span>
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] border border-gray-700/80 text-gray-300 hover:text-white hover:border-indigo-500/50 rounded-lg text-xs font-medium transition-all group cursor-pointer"
                            title={`Open ${courseTitle} webpage`}
                          >
                            <span>📚</span>
                            <span className="group-hover:underline">{courseTitle}</span>
                            <ExternalLinkIcon className="h-3 w-3 text-gray-400 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                          </a>
                        )
                      })}
                    </div>
                  )}
                  {rec.platforms && rec.platforms.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 mr-1">Platforms:</span>
                      {rec.platforms.map((platform, pi) => {
                        const pConfig = getPlatformBadgeConfig(platform)
                        const pUrl = getPlatformUrl(platform, rec.skill)
                        return (
                          <a
                            key={pi}
                            href={pUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all ${pConfig.badgeClass} cursor-pointer`}
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
            <p className="text-gray-400 text-xs py-4 text-center bg-[#1E293B]/40 rounded-xl border border-gray-800">
              No learning recommendations available.
            </p>
          )}
        </div>

        {/* Learning Path */}
        {learningPath.length > 0 && (
          <div className="mt-8 border-t border-gray-800 pt-6">
            <h4 className="font-bold text-white mb-4 text-sm">Suggested Learning Path</h4>
            <div className="relative pl-8 border-l-2 border-indigo-500/30 space-y-6">
              {learningPath.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-11 top-0.5 w-6 h-6 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {step.step || idx + 1}
                  </div>
                  <div className="p-4 bg-[#1E293B]/60 rounded-xl border border-gray-700/80">
                    <h5 className="font-semibold text-white text-sm">{step.skill}</h5>
                    {step.estimated_time && (
                      <p className="text-xs text-gray-400 mt-0.5">Estimated Duration: {step.estimated_time}</p>
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-full text-xs font-medium transition-all group cursor-pointer"
                              title={`Open ${courseTitle} webpage`}
                            >
                              <span className="group-hover:underline">{courseTitle}</span>
                              <ExternalLinkIcon className="h-3 w-3 text-indigo-400 group-hover:text-white" />
                            </a>
                          )
                        })}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-400 font-medium">Explore on:</span>
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