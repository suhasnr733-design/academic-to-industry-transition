// src/pages/skills/LearningPath.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useResume } from '../../context/ResumeContext'

import { LearningDashboardHeader } from '../../components/learning/LearningDashboardHeader'
import { InteractiveRoadmap } from '../../components/learning/InteractiveRoadmap'
import { YourSkillsLearningSection } from '../../components/learning/YourSkillsLearningSection'
import { SkillLearningCard } from '../../components/learning/SkillLearningCard'
import { DailyLearningPlan } from '../../components/learning/DailyLearningPlan'
import { ContinueLearningWidget } from '../../components/learning/ContinueLearningWidget'
import { BookmarksSection } from '../../components/learning/BookmarksSection'
import { AILearningAssistant } from '../../components/learning/AILearningAssistant'
import { CompletionCelebrationModal } from '../../components/learning/CompletionCelebrationModal'

import { 
  AcademicCapIcon, 
  BookmarkIcon, 
  SparklesIcon, 
  UploadIcon,
  RefreshIcon
} from '@heroicons/react/outline'

export const LearningPath = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { resumes, fetchResumes } = useResume()

  const urlResumeId = searchParams.get('resume_id')
  const urlLanguage = searchParams.get('language') || 'en'

  const [activeResumeId, setActiveResumeId] = useState(urlResumeId ? Number(urlResumeId) : null)
  const [selectedLanguage, setSelectedLanguage] = useState(urlLanguage)

  const [roadmapData, setRoadmapData] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeSkillId, setActiveSkillId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, in-progress, not-started, completed
  const [activeMainTab, setActiveMainTab] = useState('roadmap') // roadmap, bookmarks

  // AI Assistant Drawer state
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [aiSkillTarget, setAiSkillTarget] = useState('SQL')

  // Completion modal state
  const [celebrationSkill, setCelebrationSkill] = useState(null)

  // Track active request ID to prevent race conditions on fast resume switching
  const activeRequestIdRef = useRef(0)

  // Auto-sync resumes list on mount
  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  // Sync activeResumeId with available resumes or URL parameter
  useEffect(() => {
    if (urlResumeId) {
      const parsedId = Number(urlResumeId)
      if (!isNaN(parsedId) && parsedId !== activeResumeId) {
        setActiveResumeId(parsedId)
      }
    } else if (!activeResumeId && resumes && resumes.length > 0) {
      setActiveResumeId(resumes[0].id)
    }
  }, [urlResumeId, resumes, activeResumeId])

  // Fetch learning data for activeResumeId & selectedLanguage
  const fetchLearningData = useCallback(async (targetResumeId, targetLanguage) => {
    if (!targetResumeId) {
      setRoadmapData(null)
      setBookmarks([])
      setActiveSkillId(null)
      setLoading(false)
      return
    }

    const currentReqId = ++activeRequestIdRef.current

    try {
      setLoading(true)
      setError(null)

      // Fetch roadmap
      const queryUrl = `/learning/roadmap?resume_id=${targetResumeId}&language=${targetLanguage}`
      const roadmapRes = await api.get(queryUrl)

      // Stale response guard
      if (currentReqId !== activeRequestIdRef.current) return

      const fetchedRoadmap = roadmapRes.data

      if (!fetchedRoadmap || !fetchedRoadmap.has_resume) {
        setRoadmapData(null)
        setBookmarks([])
        setActiveSkillId(null)
        return
      }

      setRoadmapData(fetchedRoadmap)

      if (fetchedRoadmap.skills && fetchedRoadmap.skills.length > 0) {
        setActiveSkillId(fetchedRoadmap.skills[0].id)
        setAiSkillTarget(fetchedRoadmap.skills[0].skill_name)
      } else {
        setActiveSkillId(null)
      }

      // Fetch bookmarks for this specific resume_id
      const bookmarkUrl = `/learning/bookmarks?resume_id=${targetResumeId}`
      const bookmarkRes = await api.get(bookmarkUrl)

      // Stale response guard
      if (currentReqId !== activeRequestIdRef.current) return
      setBookmarks(bookmarkRes.data?.bookmarks || [])

    } catch (err) {
      if (currentReqId !== activeRequestIdRef.current) return
      console.error('Error fetching learning data:', err)
      setError(err.response?.data?.error || 'Failed to load resume-specific learning path.')
      setRoadmapData(null)
      setBookmarks([])
      setActiveSkillId(null)
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (activeResumeId) {
      fetchLearningData(activeResumeId, selectedLanguage)
    } else {
      setLoading(false)
    }
  }, [activeResumeId, selectedLanguage, fetchLearningData])

  // Resume switch handler
  const handleSelectResume = (newResumeId) => {
    if (newResumeId === activeResumeId) return

    // 1. Clear previous state completely
    setRoadmapData(null)
    setBookmarks([])
    setActiveSkillId(null)
    setActiveResumeId(newResumeId)

    // 2. Sync URL query params
    setSearchParams({ resume_id: newResumeId, language: selectedLanguage })
  }

  // Language switch handler
  const handleSelectLanguage = (newLanguage) => {
    setSelectedLanguage(newLanguage)
    if (activeResumeId) {
      setSearchParams({ resume_id: activeResumeId, language: newLanguage })
    }
  }

  // Progress update handler
  const handleUpdateStageProgress = async (skillName, stage, isCompleted) => {
    if (!roadmapData || !roadmapData.resume_id) return

    try {
      await api.post('/learning/progress', {
        resume_id: roadmapData.resume_id,
        skill_name: skillName,
        stage: stage,
        is_completed: isCompleted
      })

      // Check if skill completed 100%
      if (stage === 'complete' || stage === 'assess') {
        const currSkill = roadmapData.skills.find(s => s.skill_name === skillName)
        const nextSkill = roadmapData.skills.find(s => s.skill_name !== skillName && !s.is_completed)
        if (currSkill) {
          setCelebrationSkill({
            name: skillName,
            nextName: nextSkill ? nextSkill.skill_name : null
          })
        }
      }

      // Refresh state for current active resume
      fetchLearningData(activeResumeId, selectedLanguage)
    } catch (err) {
      console.error('Error updating progress:', err)
    }
  }

  // Bookmark handlers
  const handleAddBookmark = async (bookmarkPayload) => {
    if (!roadmapData || !roadmapData.resume_id) return
    try {
      await api.post('/learning/bookmarks', {
        ...bookmarkPayload,
        resume_id: roadmapData.resume_id
      })
      // Refresh bookmarks for current active resume
      const bookmarkRes = await api.get(`/learning/bookmarks?resume_id=${roadmapData.resume_id}`)
      setBookmarks(bookmarkRes.data.bookmarks || [])
      alert(`Saved "${bookmarkPayload.title}" to your bookmarks!`)
    } catch (err) {
      console.error('Error saving bookmark:', err)
    }
  }

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await api.delete(`/learning/bookmarks/${bookmarkId}`)
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    } catch (err) {
      console.error('Error deleting bookmark:', err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center space-y-4">
        <RefreshIcon className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-600">Generating resume-specific personalized learning path...</p>
      </div>
    )
  }

  // Empty state if no resume selected or no resumes uploaded yet
  if (!activeResumeId || !roadmapData || !roadmapData.has_resume) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 space-y-5">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <AcademicCapIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">No Resume Selected</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Upload or select a resume to generate your personalized Learning Path.
          </p>
          
          {resumes && resumes.length > 0 && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-gray-600">Select an uploaded resume:</span>
              <select
                onChange={(e) => handleSelectResume(Number(e.target.value))}
                className="bg-indigo-50 text-indigo-900 font-bold text-xs rounded-xl px-3 py-2 border border-indigo-200 cursor-pointer"
              >
                <option value="">-- Choose Resume --</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>
                    📄 {r.filename}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3">
            <button
              onClick={() => navigate('/resume/upload')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <UploadIcon className="w-5 h-5" />
              Upload New Resume
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Filter skills based on search query and status
  const filteredSkills = (roadmapData.skills || []).filter(skillItem => {
    // Status filter
    if (filterStatus === 'in-progress' && (skillItem.is_completed || skillItem.progress_percent === 0)) return false
    if (filterStatus === 'not-started' && skillItem.progress_percent > 0) return false
    if (filterStatus === 'completed' && !skillItem.is_completed) return false

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = skillItem.skill_name.toLowerCase().includes(q)
      const matchCourse = skillItem.courses && skillItem.courses.some(c => c.title.toLowerCase().includes(q))
      return matchName || matchCourse
    }

    return true
  })

  const activeSkillObj = (roadmapData.skills || []).find(s => s.id === activeSkillId) || filteredSkills[0]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Top Header with Active Resume & Language Selectors */}
      <LearningDashboardHeader
        targetRole={roadmapData.target_role}
        matchPercentage={roadmapData.match_percentage}
        progressPercent={roadmapData.learning_progress_percent}
        skillsToMaster={roadmapData.skills_to_master_count}
        estimatedWeeks={roadmapData.estimated_weeks}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onOpenAiAssistant={() => setIsAiOpen(true)}
        resumes={resumes}
        activeResumeId={activeResumeId}
        onSelectResume={handleSelectResume}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
      />

      {/* Main Section Navigation Tabs (Roadmap vs Bookmarks) */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveMainTab('roadmap')}
          className={`px-4 py-2 font-extrabold text-sm rounded-xl transition-all ${
            activeMainTab === 'roadmap'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🎓 Interactive Learning Roadmap
        </button>

        <button
          onClick={() => setActiveMainTab('bookmarks')}
          className={`px-4 py-2 font-extrabold text-sm rounded-xl transition-all flex items-center gap-1.5 ${
            activeMainTab === 'bookmarks'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookmarkIcon className="w-4 h-4" />
          Saved Resources ({bookmarks.length})
        </button>
      </div>

      {activeMainTab === 'bookmarks' ? (
        <BookmarksSection 
          bookmarks={bookmarks}
          onDeleteBookmark={handleDeleteBookmark}
        />
      ) : (
        <>
          {/* Daily Goal & Continue Learning Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyLearningPlan 
              dailyPlan={roadmapData.daily_plan}
              onStartLesson={() => {
                if (roadmapData.daily_plan) {
                  const targetSkill = (roadmapData.skills || []).find(s => s.skill_name === roadmapData.daily_plan.skill_name)
                  if (targetSkill) setActiveSkillId(targetSkill.id)
                }
              }}
            />

            <ContinueLearningWidget 
              continueData={roadmapData.continue_learning}
              onContinue={() => {
                if (roadmapData.continue_learning) {
                  const targetSkill = (roadmapData.skills || []).find(s => s.skill_name === roadmapData.continue_learning.skill_name)
                  if (targetSkill) setActiveSkillId(targetSkill.id)
                }
              }}
            />
          </div>

          {/* Categorized Skills & Learning Section */}
          <YourSkillsLearningSection
            skills={roadmapData.skills}
            activeSkillId={activeSkillId}
            onSelectSkill={(id) => {
              setActiveSkillId(id)
              const sk = roadmapData.skills.find(s => s.id === id)
              if (sk) setAiSkillTarget(sk.skill_name)
            }}
          />

          {/* Interactive Flowchart Roadmap */}
          <InteractiveRoadmap 
            skills={roadmapData.skills}
            activeSkillId={activeSkillId}
            onSelectSkill={(id) => {
              setActiveSkillId(id)
              const sk = roadmapData.skills.find(s => s.id === id)
              if (sk) setAiSkillTarget(sk.skill_name)
            }}
          />

          {/* Selected Skill Card View */}
          {activeSkillObj ? (
            <SkillLearningCard
              skill={activeSkillObj}
              targetRole={roadmapData.target_role}
              onUpdateStageProgress={handleUpdateStageProgress}
              onBookmark={handleAddBookmark}
              onOpenAiForSkill={(skillName) => {
                setAiSkillTarget(skillName)
                setIsAiOpen(true)
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
              <p className="text-sm font-semibold text-gray-500">No skills match your current search/filter criteria.</p>
            </div>
          )}
        </>
      )}

      {/* AI Assistant Drawer */}
      {isAiOpen && (
        <AILearningAssistant
          skillName={aiSkillTarget}
          targetRole={roadmapData.target_role}
          stage={activeSkillObj?.stage || 'learn'}
          onClose={() => setIsAiOpen(false)}
        />
      )}

      {/* Completion Celebration Modal */}
      {celebrationSkill && (
        <CompletionCelebrationModal
          skillName={celebrationSkill.name}
          nextSkillName={celebrationSkill.nextName}
          onClose={() => setCelebrationSkill(null)}
        />
      )}
    </div>
  )
}

export default LearningPath