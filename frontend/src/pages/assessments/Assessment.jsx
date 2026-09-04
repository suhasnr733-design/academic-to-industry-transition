// src/pages/assessments/Assessment.jsx

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessments } from '../../hooks/useAssessments'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import {
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ClockIcon,
  RefreshIcon,
  BriefcaseIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  BadgeCheckIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  LockClosedIcon,
  UploadIcon
} from '@heroicons/react/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/solid'
import toast from 'react-hot-toast'

export const Assessment = () => {
  const navigate = useNavigate()
  const { startAssessment, submitAssessment, getLatestAssessment } = useAssessments()
  const { resumes, isLoading: resumesLoading, uploadResume } = useResume()

  const [session, setSession] = useState(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  // Optimization 2: Hydrate latest assessment result immediately from sessionStorage (0.00s render)
  const [result, setResult] = useState(() => {
    try {
      const cached = sessionStorage.getItem('swr_latest_assessment')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.has_assessment && parsed?.result) {
          return parsed.result
        }
      }
    } catch {}
    return null
  })
  const [viewMode, setViewMode] = useState(() => {
    try {
      const cached = sessionStorage.getItem('swr_latest_assessment')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.has_assessment && parsed?.result) {
          return 'results'
        }
      }
    } catch {}
    return 'loading'
  })
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('swr_latest_assessment')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.has_assessment && parsed?.result) {
          return false
        }
      }
    } catch {}
    return true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize assessment or restore verified server-side test results
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        // If resumes list is definitely loaded and has 0 resumes, show guard immediately
        if (Array.isArray(resumes) && resumes.length === 0 && !resumesLoading) {
          setViewMode('no_resume')
          setIsLoading(false)
          return
        }

        // Optimization 3: Restore active in-progress quiz if present
        const savedProgress = sessionStorage.getItem('active_assessment_progress')
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress)
            // Restore if session was active within the last 2 hours
            if (parsed?.session?.questions?.length > 0 && Date.now() - (parsed.timestamp || 0) < 7200000) {
              setSession(parsed.session)
              setAnswers(parsed.answers || {})
              setCurrentQuestionIdx(parsed.currentQuestionIdx || 0)
              setSecondsElapsed(parsed.secondsElapsed || 0)
              setViewMode('quiz')
              setIsLoading(false)
              return
            }
          } catch {}
        }

        // 1. Check if student already has a verified assessment attempt stored on the server
        const latestData = await getLatestAssessment()
        try {
          sessionStorage.setItem('swr_latest_assessment', JSON.stringify(latestData))
        } catch {}

        if (latestData?.has_assessment && latestData?.result) {
          setResult(latestData.result)
          setViewMode('results')
          setIsLoading(false)
          return
        }

        // 2. If no previous assessment found, initialize fresh session
        await handleStartNewAssessment()
      } catch (err) {
        console.error('Assessment initialization error:', err)
        setViewMode('no_resume')
      } finally {
        setIsLoading(false)
      }
    }

    if (!resumesLoading) {
      init()
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resumes, resumesLoading, getLatestAssessment])

  // Optimization 3: Auto-persist active quiz progress to prevent accidental loss
  useEffect(() => {
    if (viewMode === 'quiz' && session?.questions?.length > 0) {
      try {
        sessionStorage.setItem('active_assessment_progress', JSON.stringify({
          session,
          answers,
          currentQuestionIdx,
          secondsElapsed,
          timestamp: Date.now()
        }))
      } catch {}
    }
  }, [viewMode, session, answers, currentQuestionIdx, secondsElapsed])

  // Timer runner during active quiz
  useEffect(() => {
    if (viewMode === 'quiz') {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [viewMode])

  const handleStartNewAssessment = async () => {
    // Optimization 3: Clear any existing draft when starting fresh
    try {
      sessionStorage.removeItem('active_assessment_progress')
    } catch {}
    setIsLoading(true)
    try {
      const newSession = await startAssessment()
      
      // Check if backend rejected due to missing resume
      if (newSession?.requires_resume || (Array.isArray(resumes) && resumes.length === 0)) {
        setViewMode('no_resume')
        return
      }

      if (!newSession?.questions || newSession.questions.length === 0) {
        setViewMode('no_resume')
        return
      }

      setSession(newSession)
      setCurrentQuestionIdx(0)
      setAnswers({})
      setSecondsElapsed(0)
      setResult(null)
      setViewMode('quiz')
    } catch (err) {
      toast.error('Could not initialize questions. Please try again.')
      setViewMode('no_resume')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle in-place direct resume upload
  const handleDirectResumeUpload = async (file) => {
    if (!file) return

    const validExtensions = ['.pdf', '.docx', '.doc', '.txt']
    const fileExt = '.' + file.name.split('.').pop().toLowerCase()
    if (!validExtensions.includes(fileExt)) {
      toast.error('Please upload a valid resume file (PDF, DOCX, TXT)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB')
      return
    }

    setIsUploadingResume(true)
    const toastId = toast.loading('Uploading & analyzing resume skills...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      await uploadResume(formData)
      toast.success('Resume analyzed! Starting your skill assessment...', { id: toastId })
      
      // Clear legacy flags and generate fresh assessment immediately
      localStorage.removeItem('assessment_completed')
      localStorage.removeItem('latest_assessment_score')
      window.dispatchEvent(new Event('storage'))

      await handleStartNewAssessment()
    } catch (err) {
      toast.error(err.message || 'Failed to upload resume', { id: toastId })
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDirectResumeUpload(e.dataTransfer.files[0])
    }
  }

  const handleAnswer = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleSubmit = async () => {
    const questions = session?.questions || []
    const answeredCount = Object.keys(answers).length

    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit?`
      )
      if (!confirmSubmit) return
    }

    try {
      setIsSubmitting(true)
      const evaluation = await submitAssessment(answers, secondsElapsed)
      setResult(evaluation)
      
      // Optimization 2: Persist in sessionStorage for instant return
      try {
        sessionStorage.setItem('swr_latest_assessment', JSON.stringify({
          has_assessment: true,
          result: evaluation
        }))
      } catch {}

      // Optimization 3: Clear active draft upon successful submission
      try {
        sessionStorage.removeItem('active_assessment_progress')
      } catch {}
      
      const activeResume = resumes && resumes.length > 0 ? resumes[0] : null
      const resumeId = activeResume?.id || 'default'
      const scoreVal = Math.round(evaluation?.score || 85)

      // Save per-resume local storage and notify components
      localStorage.setItem(`assessment_completed_for_resume_${resumeId}`, 'true')
      localStorage.setItem(`assessment_score_for_resume_${resumeId}`, String(scoreVal))
      localStorage.setItem('assessment_completed', 'true')
      localStorage.setItem('latest_assessment_score', String(scoreVal))
      window.dispatchEvent(new Event('storage'))

      toast.success('Skill assessment completed successfully!')
      setViewMode('results')
    } catch (error) {
      toast.error(error.message || 'Failed to submit assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const questions = session?.questions || []
  const currentQ = questions[currentQuestionIdx]
  const testedSkills = session?.tested_skills || []

  // ----------------------------------------------------
  // 1. LOADING STATE
  // ----------------------------------------------------
  if (((isLoading || viewMode === 'loading') && !result) || (resumesLoading && !result)) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-medium text-base">Preparing your skill-customized assessment...</p>
      </div>
    )
  }

  // ----------------------------------------------------
  // 2. RESUME REQUIRED GUARD VIEW (With In-Place Dropzone)
  // ----------------------------------------------------
  if (viewMode === 'no_resume') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Top accent badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-4">
            <LockClosedIcon className="w-4 h-4 text-amber-600" />
            <span>Resume Required for Assessment</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Upload Your Resume to Begin
          </h2>

          <p className="mt-2 text-gray-600 text-sm max-w-lg mx-auto leading-relaxed">
            TransitionAI generates tailored questions from your extracted resume skills. Upload your resume directly below to start immediately.
          </p>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleDirectResumeUpload(e.target.files[0])
              }
            }}
            style={{ display: 'none' }}
          />

          {/* In-Place Interactive Dropzone */}
          <div
            onClick={() => !isUploadingResume && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-6 border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-100'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            {isUploadingResume ? (
              <div className="py-4 space-y-3">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-primary-600 border-t-transparent"></div>
                <p className="text-sm font-bold text-primary-700">Analyzing resume & extracting skills...</p>
                <p className="text-xs text-gray-500">Your tailored assessment will start automatically.</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <UploadIcon className="w-7 h-7" />
                </div>
                <p className="text-base font-semibold text-gray-800">
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here, or browse'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOCX, TXT (Max 10MB)
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold shadow-md hover:bg-primary-700 transition-colors">
                    Browse File & Start Test
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 3 Steps Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-left">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[11px] font-bold flex items-center justify-center mb-1.5">1</span>
              <h4 className="text-xs font-bold text-gray-900">Upload Here</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Drop your resume file directly above.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center mb-1.5">2</span>
              <h4 className="text-xs font-bold text-gray-900">AI Skill Extraction</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Identifies your core technical skills.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center mb-1.5">3</span>
              <h4 className="text-xs font-bold text-gray-900">Instant Test</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Assessment begins automatically.</p>
            </div>
          </div>

          {/* Back button */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="text-xs px-5 py-2"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // 3. RESULTS VIEW
  // ----------------------------------------------------
  if (viewMode === 'results' && result) {
    const score = Math.round(result.score || result.percentage || 0)
    const totalQ = result.total_questions || (result.review ? result.review.length : 6)
    const correctQ = result.correct_answers || 0
    const timeTaken = result.time_taken || 0
    const skillBreakdown = result.skill_breakdown || {}
    const reviews = result.review || []

    const isPassed = score >= 60

    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
        {/* Results Hero Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className={`p-8 sm:p-10 text-white bg-gradient-to-r ${
            isPassed 
              ? 'from-emerald-600 via-teal-600 to-indigo-600' 
              : 'from-blue-600 via-indigo-600 to-purple-600'
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
                  <SparklesIcon className="w-4 h-4 text-amber-300" />
                  Skill Assessment Results
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {isPassed ? 'Outstanding Achievement! 🎉' : 'Assessment Completed! 🚀'}
                </h1>
                <p className="text-white/80 mt-2 text-sm sm:text-base max-w-lg">
                  Your assessment was evaluated based on your resume profile. Results have been saved to your career record.
                </p>
              </div>

              {/* Score Badge */}
              <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 min-w-[170px] shadow-lg">
                <span className="text-5xl font-black">{score}%</span>
                <span className="text-xs font-medium text-white/90 mt-1 uppercase tracking-wide">
                  {result.competency_level || (score >= 80 ? 'Industry Ready' : score >= 60 ? 'Competent' : 'Developing')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50 py-4 px-6 text-center text-xs sm:text-sm">
            <div>
              <p className="text-gray-400 font-medium">Correct Answers</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{correctQ} / {totalQ}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Time Taken</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{formatTime(timeTaken)}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Status</p>
              <p className={`text-lg font-bold mt-0.5 ${isPassed ? 'text-emerald-600' : 'text-primary-600'}`}>
                {isPassed ? 'Verified ✓' : 'Recorded'}
              </p>
            </div>
          </div>

          {/* Skill Mastery Breakdown */}
          {Object.keys(skillBreakdown).length > 0 && (
            <div className="p-8 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BadgeCheckIcon className="w-5 h-5 text-primary-600" />
                Tested Resume Skill Proficiency
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(skillBreakdown).map(([skillName, stats]) => (
                  <div key={skillName} className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">{skillName}</span>
                      <span className="text-xs font-bold text-gray-900">{stats.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.percentage >= 80 ? 'bg-emerald-500' : stats.percentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {stats.correct} of {stats.total} correct
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="p-6 bg-white flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="secondary"
              onClick={handleStartNewAssessment}
              className="flex items-center gap-2"
            >
              <RefreshIcon className="w-4 h-4" />
              <span>Retake Assessment</span>
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/skills')}
                className="flex items-center gap-1.5"
              >
                <BookOpenIcon className="w-4 h-4" />
                <span>Skill Gap Analysis</span>
              </Button>

              <Button
                onClick={() => navigate('/jobs')}
                className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700"
              >
                <BriefcaseIcon className="w-4 h-4" />
                <span>Explore Matched Jobs</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Detailed Question Review */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5 text-gray-500" />
              Detailed Question Review & Explanations
            </h3>

            <div className="space-y-4">
              {reviews.map((rev, idx) => (
                <div
                  key={rev.id || idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    rev.is_correct
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {rev.is_correct ? (
                          <CheckCircleSolid className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            Question {idx + 1}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-gray-200 font-medium text-gray-700">
                            {rev.skill}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mt-1.5">
                          {rev.question}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        rev.is_correct
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rev.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 font-medium">Your Answer:</span>
                      <p className={`font-semibold mt-0.5 ${rev.is_correct ? 'text-emerald-900' : 'text-rose-900'}`}>
                        {rev.user_answer || '(Skipped)'}
                      </p>
                    </div>
                    {!rev.is_correct && (
                      <div>
                        <span className="text-gray-500 font-medium">Correct Answer:</span>
                        <p className="font-semibold text-emerald-800 mt-0.5">
                          {rev.correct_answer}
                        </p>
                      </div>
                    )}
                  </div>

                  {rev.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-white/80 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                      <span className="font-bold text-gray-800 mr-1">Explanation:</span>
                      {rev.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ----------------------------------------------------
  // 4. ACTIVE QUIZ VIEW (Clean, without difficulty badges)
  // ----------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Resume Skills Context Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 shadow-xs">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-950">
              Personalized Skill Assessment
            </h3>
            <p className="text-xs text-blue-800/80 mt-0.5">
              Questions are customized based on skills extracted from your resume.
            </p>
            {testedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {testedSkills.map(skill => (
                  <span
                    key={skill}
                    className="text-[11px] font-semibold bg-white/90 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Quiz Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
        {/* Top Quiz Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-gray-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Heading level={3}>Skill Evaluation</Heading>
              {currentQ?.skill && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  {currentQ.skill}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Question {currentQuestionIdx + 1} of {questions.length}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            {/* 30-Question Jump Bar */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[180px] sm:max-w-[260px] md:max-w-[320px] py-1 px-1">
              {questions.map((q, idx) => (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-6 h-6 shrink-0 rounded-md text-[10px] font-bold flex items-center justify-center transition-all ${
                    idx === currentQuestionIdx
                      ? 'bg-primary-600 text-white shadow-xs ring-2 ring-primary-200'
                      : answers[q.id]
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clean Single Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 my-6 overflow-hidden">
          <div
            className="bg-primary-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Current Question Body */}
        {currentQ ? (
          <div className="space-y-6">
            <p className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed">
              {currentQ.question}
            </p>

            <div className="space-y-3">
              {currentQ.options?.map((option, idx) => {
                const isSelected = answers[currentQ.id] === option
                return (
                  <label
                    key={idx}
                    onClick={() => handleAnswer(currentQ.id, option)}
                    className={`flex items-start p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-100 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQ.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => handleAnswer(currentQ.id, option)}
                      className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className={`ml-3 text-sm leading-relaxed ${
                      isSelected ? 'font-semibold text-primary-950' : 'text-gray-700'
                    }`}>
                      {option}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No questions available for this session.
          </div>
        )}

        {/* Navigation & Submit Footer */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIdx === 0}
          >
            Previous
          </Button>

          <div className="flex items-center space-x-3">
            {currentQuestionIdx < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <span>Submit & View Results</span>
                <CheckCircleSolid className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Assessment