// src/pages/skills/SkillGapAnalysis.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  SparklesIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  ClockIcon
} from '@heroicons/react/outline'
import { getPlatformUrl, getCourseUrl, getPlatformBadgeConfig, isExactCourseUrl } from '../../utils/courseUrls'

// Helper for reliable, collision-free slug generation across skills with dots/slashes/spaces
const getSkillSlug = (skill) => 
  String(skill || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'skill'

export const SkillGapAnalysis = () => {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const { getGapAnalysis, isLoading } = useSkills()

  const currentResumeKey = resumeId ? String(resumeId) : 'latest'
  const swrStorageKey = `swr_skill_gap_${currentResumeKey}`

  // Hydrate initial state for the specific active resume
  const [analysis, setAnalysis] = useState(() => {
    try {
      const cached = sessionStorage.getItem(swrStorageKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (!resumeId || String(parsed.resume_id) === String(resumeId)) {
          return parsed
        }
      }
      return null
    } catch {
      return null
    }
  })
  const [fetchError, setFetchError] = useState(null)
  const [isRoleFetching, setIsRoleFetching] = useState(false)
  const [selectedRole, setSelectedRole] = useState(() => {
    try {
      const cached = sessionStorage.getItem(swrStorageKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (!resumeId || String(parsed.resume_id) === String(resumeId)) {
          return parsed.target_role || ''
        }
      }
    } catch {}
    return ''
  })

  // Tooltip interactive state for keyboard focus and touch accessibility
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const tooltipRef = useRef(null)

  // Cache partitioned strictly by resume key AND role to prevent cross-resume data leaks
  const roleAnalysisCache = useRef({})

  // Track the currently active resume key to discard in-flight responses across resume switches
  const activeResumeKeyRef = useRef(currentResumeKey)

  // Request counter to cancel stale in-flight responses during rapid role changes
  const activeRequestIdRef = useRef(0)

  // Timer ref to clean up smooth scroll highlight timeout on unmount
  const highlightTimerRef = useRef(null)
  const highlightedElementRef = useRef(null)

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
        highlightTimerRef.current = null
      }
      if (highlightedElementRef.current) {
        highlightedElementRef.current.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2')
        highlightedElementRef.current = null
      }
    }
  }, [])

  // Close score tooltip on Escape key or outside click/touch
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isTooltipOpen) {
        setIsTooltipOpen(false)
      }
    }
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setIsTooltipOpen(false)
      }
    }
    if (isTooltipOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isTooltipOpen])

  // When resumeId changes, reset state and prevent displaying stale data from another resume
  useEffect(() => {
    activeRequestIdRef.current++
    activeResumeKeyRef.current = currentResumeKey
    setFetchError(null)

    let cachedForResume = null
    try {
      const raw = sessionStorage.getItem(swrStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (!resumeId || String(parsed.resume_id) === String(resumeId)) {
          cachedForResume = parsed
        }
      }
    } catch {}

    setAnalysis(cachedForResume)
    const initialRole = cachedForResume?.target_role || ''
    setSelectedRole(initialRole)

    if (cachedForResume?.target_role) {
      const cacheKey = `${currentResumeKey}__${cachedForResume.target_role.toLowerCase().trim()}`
      roleAnalysisCache.current[cacheKey] = cachedForResume
    }

    fetchAnalysis(initialRole, currentResumeKey)
  }, [resumeId, currentResumeKey, swrStorageKey])

  const fetchAnalysis = useCallback(async (role, forResumeKey = currentResumeKey) => {
    const roleKey = role ? `${forResumeKey}__${role.toLowerCase().trim()}` : ''
    
    // Return cached role analysis instantly if already available for THIS resume
    if (roleKey && roleAnalysisCache.current[roleKey]) {
      const cached = roleAnalysisCache.current[roleKey]
      activeRequestIdRef.current++
      setAnalysis(cached)
      setSelectedRole(cached.target_role || role)
      setIsRoleFetching(false)
      try {
        sessionStorage.setItem(swrStorageKey, JSON.stringify(cached))
      } catch {}
      return
    }

    const thisRequestId = ++activeRequestIdRef.current
    setIsRoleFetching(true)
    setFetchError(null)

    try {
      const data = await getGapAnalysis(resumeId, role)
      
      // Strict isolation check: discard if:
      // a) A newer request has been started (thisRequestId !== activeRequestIdRef.current)
      // b) The active resume has changed (forResumeKey !== activeResumeKeyRef.current)
      if (
        thisRequestId !== activeRequestIdRef.current ||
        forResumeKey !== activeResumeKeyRef.current
      ) {
        return
      }

      if (data) {
        setAnalysis(data)
        const effectiveRole = data.target_role || role
        if (effectiveRole) {
          setSelectedRole(effectiveRole)
          const fetchedKey = `${forResumeKey}__${effectiveRole.toLowerCase().trim()}`
          roleAnalysisCache.current[fetchedKey] = data
        }
        try {
          sessionStorage.setItem(swrStorageKey, JSON.stringify(data))
        } catch (storageErr) {
          console.warn('Could not cache skill gap in sessionStorage:', storageErr)
        }
      }
    } catch (err) {
      if (
        thisRequestId === activeRequestIdRef.current &&
        forResumeKey === activeResumeKeyRef.current
      ) {
        console.error('Error in SkillGapAnalysis:', err)
        setFetchError(err.message || 'Failed to load skill gap analysis')
        // Revert selectedRole to currently displayed analysis to avoid UI desync
        setSelectedRole(analysis?.target_role || '')
      }
    } finally {
      if (
        thisRequestId === activeRequestIdRef.current &&
        forResumeKey === activeResumeKeyRef.current
      ) {
        setIsRoleFetching(false)
      }
    }
  }, [resumeId, currentResumeKey, swrStorageKey, getGapAnalysis, analysis?.target_role])

  const handleRoleChange = async (newRole) => {
    // Consistent policy: disable role switching while active request is fetching
    if (isRoleFetching) return
    if (!newRole) return

    const normalizedNew = newRole.toLowerCase().trim()
    const currentActive = (selectedRole || analysis?.target_role || '').toLowerCase().trim()
    if (normalizedNew === currentActive) return

    const roleKey = `${currentResumeKey}__${normalizedNew}`
    
    // CACHE HIT:
    if (roleAnalysisCache.current[roleKey]) {
      const cached = roleAnalysisCache.current[roleKey]
      activeRequestIdRef.current++
      setIsRoleFetching(false)
      setFetchError(null)
      setAnalysis(cached)
      setSelectedRole(cached.target_role || newRole)
      try {
        sessionStorage.setItem(swrStorageKey, JSON.stringify(cached))
      } catch {}
      return
    }

    // CACHE MISS:
    setSelectedRole(newRole)
    await fetchAnalysis(newRole, currentResumeKey)
  }

  // Smooth scroll helper to jump directly from a skill gap or milestone to its learning resources
  const scrollToSkillCard = (skillName, milestoneIndex = null) => {
    if (!skillName && milestoneIndex === null) return

    // Clean up any previously highlighted element and timer
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
    if (highlightedElementRef.current) {
      highlightedElementRef.current.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2')
      highlightedElementRef.current = null
    }

    // Attempt to locate target element by milestone index, data attribute, or normalized slug
    let el = null
    if (milestoneIndex !== null) {
      el = document.querySelector(`[data-milestone-index="${milestoneIndex}"]`)
    }
    if (!el && skillName) {
      const normalizedSkill = String(skillName).toLowerCase().trim()
      el = document.querySelector(`[data-skill-name="${normalizedSkill}"]`)
    }
    if (!el && skillName) {
      const slug = getSkillSlug(skillName)
      el = document.getElementById(`learning-card-${slug}`)
    }

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2')
      highlightedElementRef.current = el
      highlightTimerRef.current = setTimeout(() => {
        if (highlightedElementRef.current === el) {
          el.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2')
          highlightedElementRef.current = null
        }
      }, 2000)
    } else {
      // Graceful fallback: navigate to learning courses section
      const section = document.getElementById('recommended-courses-section')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
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

  // Consolidate learning items into a single, non-redundant roadmap & resource dataset
  const learningItems = useMemo(() => {
    if (learningPath.length > 0) {
      return learningPath.map((step, idx) => {
        const stepSkill = step.skill || ''
        const matchingRec = recommendations.find(
          r => r.skill?.toLowerCase() === stepSkill.toLowerCase()
        )
        return {
          stepNumber: step.step || idx + 1,
          skill: stepSkill,
          priority: step.priority || matchingRec?.priority || (idx < 3 ? 'High' : 'Medium'),
          estimatedTime: step.estimated_time || matchingRec?.estimated_time || '2-4 weeks',
          courses: step.courses || matchingRec?.courses || [],
          platforms: matchingRec?.platforms || ['Coursera', 'Udemy', 'NPTEL']
        }
      })
    }
    return recommendations.map((rec, idx) => ({
      stepNumber: idx + 1,
      skill: rec.skill || '',
      priority: rec.priority || (idx < 3 ? 'High' : 'Medium'),
      estimatedTime: rec.estimated_time || '2-4 weeks',
      courses: rec.courses || [],
      platforms: rec.platforms || ['Coursera', 'Udemy', 'NPTEL']
    }))
  }, [learningPath, recommendations])

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
          <DocumentTextIcon className="text-primary-600" style={{ width: 40, height: 40 }} />
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
      <div className="w-full py-12 text-center bg-white rounded-2xl shadow-lg p-8">
        <Heading level={3} className="text-gray-800">Skill Gap Analysis Unavailable</Heading>
        <p className="text-gray-500 mt-2">{fetchError || 'Could not load skill gap analysis.'}</p>
        <Button className="mt-4" onClick={() => fetchAnalysis(selectedRole)}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 min-w-0">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8">
        {/* Top Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 pb-6 border-b border-gray-100">
          <div className="min-w-0 flex-1">
            <Heading level={2} className="text-gray-900 tracking-tight font-extrabold text-2xl sm:text-3xl">
              Skill Gap Analysis
            </Heading>
            <div className="flex flex-wrap items-center gap-2.5 mt-3">
              {/* Target Role Selector with Visual Loading Indicator */}
              <div className={`inline-flex items-center space-x-2 bg-gray-50 border border-gray-200/90 rounded-xl px-3 py-1.5 shadow-2xs hover:border-gray-300 transition-colors ${isRoleFetching ? 'opacity-80' : ''}`}>
                {isRoleFetching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent flex-shrink-0" style={{ width: 16, height: 16 }} />
                ) : (
                  <BriefcaseIcon className="text-primary-600 flex-shrink-0" style={{ width: 16, height: 16, minWidth: 16, minHeight: 16 }} />
                )}
                <label htmlFor="target-role-select" className="text-xs font-semibold text-gray-600 flex-shrink-0">
                  Target role:
                </label>
                <select
                  id="target-role-select"
                  value={selectedRole || analysis?.target_role || 'Software Engineer'}
                  disabled={isRoleFetching}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer pr-1 disabled:cursor-wait"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resume Indicator Pill */}
              {analysis?.filename && (
                <span 
                  className="inline-flex items-center space-x-1.5 bg-gray-50 border border-gray-200/90 text-xs text-gray-600 px-3 py-1.5 rounded-xl shadow-2xs max-w-xs truncate" 
                  title={analysis.filename}
                >
                  <DocumentTextIcon className="text-gray-400 flex-shrink-0" style={{ width: 16, height: 16, minWidth: 16, minHeight: 16 }} />
                  <span className="truncate">
                    Resume: <strong className="font-semibold text-gray-800">{analysis.candidate_name || analysis.filename}</strong>
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Prominent, Integrated Match Score (Explained as Role Competency Alignment, not Hiring Probability) */}
          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-0.5 bg-gradient-to-br from-primary-50/70 via-indigo-50/40 to-primary-50/20 px-4 py-2.5 rounded-xl border border-primary-100 shadow-2xs flex-shrink-0">
            <div className="text-3xl sm:text-4xl font-black text-primary-600 tracking-tight leading-none">
              {matchPercentage}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Role competency match</span>
              <div ref={tooltipRef} className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setIsTooltipOpen(prev => !prev)}
                  onFocus={() => setIsTooltipOpen(true)}
                  onBlur={() => setIsTooltipOpen(false)}
                  onMouseEnter={() => setIsTooltipOpen(true)}
                  onMouseLeave={() => setIsTooltipOpen(false)}
                  aria-label="Explain role competency score"
                  aria-expanded={isTooltipOpen}
                  aria-describedby="competency-score-tooltip"
                  className="text-gray-400 hover:text-primary-600 focus:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 rounded-full cursor-help p-0.5 transition-colors"
                >
                  <InformationCircleIcon style={{ width: 16, height: 16, minWidth: 16, minHeight: 16 }} />
                </button>
                {isTooltipOpen && (
                  <div 
                    id="competency-score-tooltip"
                    role="tooltip"
                    className="absolute right-0 bottom-full mb-1.5 w-64 p-2.5 bg-gray-900 text-white text-[11px] font-normal rounded-lg shadow-lg z-50 leading-relaxed"
                  >
                    Skill match alignment: {matchingSkills.length} of {matchingSkills.length + missingSkills.length} target role competencies identified in your active resume. (Measures curriculum and skill overlap, not hiring probability).
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommended Role Quick Pills */}
        {recommendedRoles && recommendedRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5 p-2.5 bg-gradient-to-r from-primary-50/60 via-indigo-50/30 to-transparent rounded-xl border border-primary-100/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary-900 mr-1 flex-shrink-0">
              <SparklesIcon className="text-primary-600 animate-pulse" style={{ width: 16, height: 16, minWidth: 16, minHeight: 16 }} />
              <span>Top AI recommendations:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recommendedRoles.map((role) => {
                const currentActiveRole = (selectedRole || analysis?.target_role || '').toLowerCase().trim()
                const isSelected = currentActiveRole === role.toLowerCase().trim()
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={isRoleFetching}
                    onClick={() => handleRoleChange(role)}
                    className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-primary-600 text-white shadow-xs ring-2 ring-primary-300 font-bold'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-primary-700 border border-gray-200 hover:border-primary-300'
                    } ${isRoleFetching ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <span>{role}</span>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Content Panels with Subtle Dimming During In-Flight Role Fetches */}
        <div className={`transition-opacity duration-200 ${isRoleFetching ? 'opacity-75 pointer-events-none' : ''}`}>
          {/* Skill Match Alignment Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-medium text-gray-600">Skill match alignment</span>
              <span className="font-semibold text-gray-700">
                {matchingSkills.length} of {matchingSkills.length + missingSkills.length} target skills met
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  matchPercentage >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : matchPercentage >= 40
                    ? 'bg-gradient-to-r from-primary-500 to-indigo-600'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, matchPercentage))}%` }}
              />
            </div>
          </div>

          {/* Extracted Resume Skills Preview with Readable Chips */}
          {currentSkills.length > 0 && (
            <div className="mb-8 p-4 bg-slate-50/80 rounded-xl border border-gray-200/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Skills found in resume ({currentSkills.length})
                </span>
                <Link 
                  to={`/resume/${analysis?.resume_id || ''}`} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-primary-50 text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 rounded-lg text-xs font-semibold shadow-2xs transition-all group"
                >
                  <span>View resume details</span>
                  <ArrowRightIcon className="text-primary-500 group-hover:translate-x-0.5 transition-transform" style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }} />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white text-gray-800 border border-gray-200/90 rounded-lg text-xs font-medium shadow-2xs hover:border-gray-300 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SKILL PANELS: Naturally-sized columns with items-start alignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 sm:gap-5 mb-8 min-w-0">
            {/* Matching Skills Column */}
            <div className="bg-emerald-50/30 rounded-xl border border-emerald-100/90 p-3.5 sm:p-4 min-w-0">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100">
                <h3 className="font-bold text-gray-900 text-sm flex items-center">
                  <CheckCircleIcon 
                    className="text-emerald-600 mr-2 flex-shrink-0" 
                    style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }} 
                  />
                  <span>Matching skills ({matchingSkills.length})</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  Resume match
                </span>
              </div>
              <div className="space-y-2.5">
                {matchingSkills.map((skill, idx) => (
                  <div 
                    key={idx} 
                    className="min-h-[58px] sm:min-h-[64px] flex items-center justify-between p-3 sm:px-4 sm:py-3.5 bg-white border border-emerald-100/90 hover:border-emerald-200 rounded-xl shadow-2xs transition-all gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <CheckCircleIcon 
                        className="text-emerald-500 flex-shrink-0" 
                        style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }} 
                      />
                      <span className="text-gray-900 font-semibold text-sm sm:text-base leading-snug break-words">
                        {skill}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full flex-shrink-0 shadow-2xs">
                      Matched
                    </span>
                  </div>
                ))}
                {matchingSkills.length === 0 && (
                  <div className="p-6 text-center bg-white/90 border border-dashed border-emerald-200 rounded-xl text-xs text-gray-500">
                    <p className="font-medium text-gray-700">No matching skills identified</p>
                    <p className="mt-1">None of the extracted resume skills match the benchmarked competencies for this role.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Missing Skills Column */}
            <div className="bg-rose-50/30 rounded-xl border border-rose-100/90 p-3.5 sm:p-4 min-w-0">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-100">
                <h3 className="font-bold text-gray-900 text-sm flex items-center">
                  <XCircleIcon 
                    className="text-rose-500 mr-2 flex-shrink-0" 
                    style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }} 
                  />
                  <span>Missing skills ({missingSkills.length})</span>
                </h3>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                  To acquire
                </span>
              </div>
              <div className="space-y-2.5">
                {missingSkills.map((skill, idx) => (
                  <div 
                    key={idx} 
                    className="min-h-[58px] sm:min-h-[64px] flex items-center justify-between p-3 sm:px-4 sm:py-3.5 bg-white border border-rose-100/90 hover:border-rose-200 rounded-xl shadow-2xs transition-all gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <XCircleIcon 
                        className="text-rose-500 flex-shrink-0" 
                        style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }} 
                      />
                      <span className="text-gray-900 font-semibold text-sm sm:text-base leading-snug break-words">
                        {skill}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap flex-shrink-0 justify-end">
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 rounded-full flex-shrink-0 shadow-2xs">
                        Skill gap
                      </span>
                      <button
                        type="button"
                        onClick={() => scrollToSkillCard(skill)}
                        className="min-h-[32px] inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-300 border border-primary-200 rounded-lg transition-all shadow-2xs cursor-pointer group/btn"
                        aria-label={`Learn ${skill} - view courses`}
                        title={`View recommended courses for ${skill}`}
                      >
                        <span>Learn skill</span>
                        <ArrowDownIcon 
                          className="text-primary-500 group-hover/btn:translate-y-0.5 transition-transform" 
                          style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }} 
                        />
                      </button>
                    </div>
                  </div>
                ))}
                {missingSkills.length === 0 && (
                  <div className="p-6 text-center bg-white/90 border border-dashed border-rose-200 rounded-xl text-xs text-gray-500">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" style={{ width: 24, height: 24 }} />
                    <p className="font-semibold text-emerald-800">No skill gaps identified</p>
                    <p className="mt-0.5 text-gray-600">Your resume covers all target competencies benchmarked for this role.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suggested Learning Roadmap as a Responsive, Accessible Numbered Overview */}
          {learningItems.length > 0 && (
            <div className="border-t border-gray-200/80 pt-6 mb-8 scroll-mt-24">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                    Suggested learning roadmap
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Prioritized milestone overview to bridge your {learningItems.length} skill gap{learningItems.length === 1 ? '' : 's'}.
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200 self-start sm:self-auto">
                  {learningItems.length} Milestone{learningItems.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Responsive grid adapting cleanly to 3, 4, or more milestones */}
              <div className={`grid gap-3 ${
                learningItems.length >= 4 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {learningItems.map((item, idx) => (
                  <button
                    key={item.stepNumber || idx}
                    type="button"
                    onClick={() => scrollToSkillCard(item.skill, idx)}
                    className="text-left w-full p-3.5 bg-gradient-to-br from-gray-50 to-white hover:from-primary-50/40 hover:to-white focus:outline-none focus:ring-2 focus:ring-primary-300 border border-gray-200/90 hover:border-primary-300 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                    title={`Click to view course recommendations for ${item.skill}`}
                    aria-label={`Milestone ${item.stepNumber}: ${item.skill}, estimated duration ${item.estimatedTime}. Click to view courses.`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2 w-full">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {item.stepNumber}
                        </span>
                        <span className="font-bold text-gray-900 text-sm truncate group-hover:text-primary-700 transition-colors">
                          {item.skill}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {idx === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                            Start
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          item.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                          item.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 w-full">
                      <span className="flex items-center gap-1 font-medium">
                        <ClockIcon className="text-gray-400" style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }} />
                        {item.estimatedTime}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary-600 group-hover:underline text-[11px]">
                        <span>View courses</span>
                        <ArrowDownIcon className="text-primary-500 group-hover:translate-y-0.5 transition-transform" style={{ width: 12, height: 12, minWidth: 12, minHeight: 12 }} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Learning Courses as Detailed Resource Section */}
          <div id="recommended-courses-section" className="border-t border-gray-200/80 pt-6 scroll-mt-24">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Recommended learning courses
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Curated course modules and platform searches to help you close each identified skill gap.
              </p>
            </div>

            {learningItems.length > 0 ? (
              <div className="space-y-4">
                {learningItems.map((item, idx) => {
                  const skillSlug = getSkillSlug(item.skill)
                  return (
                    <div 
                      key={item.stepNumber || idx}
                      id={`learning-card-${skillSlug}`}
                      data-skill-name={String(item.skill || '').toLowerCase().trim()}
                      data-milestone-index={idx}
                      className="p-4 sm:p-5 border border-gray-200/90 rounded-xl bg-white shadow-2xs hover:border-primary-200 transition-all scroll-mt-24"
                    >
                      {/* Course Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex-shrink-0">
                            {item.stepNumber}
                          </span>
                          <h4 className="text-base font-bold text-gray-900">{item.skill}</h4>
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            item.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                            item.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/60 self-start sm:self-auto">
                          <ClockIcon className="text-gray-400 mr-1.5" style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }} />
                          <span>Est. {item.estimatedTime}</span>
                        </div>
                      </div>

                      {/* Curated Course Modules */}
                      {item.courses && item.courses.length > 0 ? (
                        <div className="mb-3.5">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Curated course modules:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.courses.map((course, ci) => {
                              const courseTitle = typeof course === 'object' ? (course.title || course.name) : course
                              const courseUrl = getCourseUrl(course, item.skill)
                              const isExact = isExactCourseUrl(course)
                              return (
                                <a
                                  key={ci}
                                  href={courseUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`${courseTitle} (opens in a new tab)`}
                                  className="inline-flex items-center justify-between gap-2 px-3 py-2 bg-gray-50/80 hover:bg-primary-50/50 focus:bg-primary-50/50 border border-gray-200/90 hover:border-primary-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 text-gray-800 hover:text-primary-700 rounded-lg text-xs font-medium transition-all group cursor-pointer shadow-2xs max-w-full"
                                  title={isExact ? `Direct course link: ${courseTitle}` : `Search course: ${courseTitle}`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm flex-shrink-0">📚</span>
                                    <span className="group-hover:underline break-words leading-snug">{courseTitle}</span>
                                  </div>
                                  <ExternalLinkIcon 
                                    className="text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" 
                                    style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }} 
                                  />
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3.5 p-3 bg-gray-50 rounded-lg border border-gray-200/70 text-xs text-gray-600">
                          Direct course modules are currently being curated for {item.skill}. Explore available courses on the learning platforms below.
                        </div>
                      )}

                      {/* Platform Exploration Links */}
                      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 mr-1">Search on platforms:</span>
                        {item.platforms.map((platform, pi) => {
                          const pConfig = getPlatformBadgeConfig(platform)
                          const pUrl = getPlatformUrl(platform, item.skill)
                          return (
                            <a
                              key={pi}
                              href={pUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Search ${item.skill} courses on ${pConfig.name} (opens in a new tab)`}
                              className={`min-h-[28px] inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-300 ${pConfig.badgeClass} cursor-pointer`}
                              title={`Search ${item.skill} courses on ${pConfig.name}`}
                            >
                              <span>{pConfig.name}</span>
                              <ExternalLinkIcon style={{ width: 12, height: 12, minWidth: 12, minHeight: 12 }} className="opacity-75" />
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50/80 rounded-2xl border border-dashed border-gray-200">
                <CheckCircleIcon className="text-emerald-500 mx-auto mb-2" style={{ width: 40, height: 40 }} />
                <h4 className="text-sm font-bold text-gray-800">All Target Competencies Met</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Your resume skills cover all core competencies required for {selectedRole || analysis?.target_role}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkillGapAnalysis