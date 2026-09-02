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
  RefreshIcon,
  XIcon,
  PlayIcon
} from '@heroicons/react/outline'

export const LearningPath = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { resumes, fetchResumes } = useResume()

  const urlResumeId = searchParams.get('resume_id')
  const urlLanguage = searchParams.get('language') || 'en'
  const urlTargetDate = searchParams.get('target_date') || '2026-09-15'

  const [activeResumeId, setActiveResumeId] = useState(urlResumeId ? Number(urlResumeId) : null)
  const [selectedLanguage, setSelectedLanguage] = useState(urlLanguage)
  const [targetDate, setTargetDate] = useState(urlTargetDate)

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

  // Completion modal & Quick Video Modal state
  const [celebrationSkill, setCelebrationSkill] = useState(null)
  const [quickVideoModal, setQuickVideoModal] = useState(null)
  const [videoRevisionModal, setVideoRevisionModal] = useState(null)
  const [videoStartTime, setVideoStartTime] = useState(0)
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const [isPracticeQuizOpen, setIsPracticeQuizOpen] = useState(false)
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null)

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

  // Fetch learning data for activeResumeId & selectedLanguage & targetDate
  const fetchLearningData = useCallback(async (targetResumeId, targetLanguage, dateTarget) => {
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
      let queryUrl = `/learning/roadmap?resume_id=${targetResumeId}&language=${targetLanguage}`
      if (dateTarget) {
        queryUrl += `&target_date=${dateTarget}`
      }
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
      fetchLearningData(activeResumeId, selectedLanguage, targetDate)
    } else {
      setLoading(false)
    }
  }, [activeResumeId, selectedLanguage, targetDate, fetchLearningData])

  // Resume switch handler
  const handleSelectResume = (newResumeId) => {
    if (newResumeId === activeResumeId) return

    // 1. Clear previous state completely
    setRoadmapData(null)
    setBookmarks([])
    setActiveSkillId(null)
    setActiveResumeId(newResumeId)

    // 2. Sync URL query params
    const newParams = { resume_id: newResumeId, language: selectedLanguage }
    if (targetDate) newParams.target_date = targetDate
    setSearchParams(newParams)
  }

  // Language switch handler
  const handleSelectLanguage = (newLanguage) => {
    setSelectedLanguage(newLanguage)
    if (activeResumeId) {
      const newParams = { resume_id: activeResumeId, language: newLanguage }
      if (targetDate) newParams.target_date = targetDate
      setSearchParams(newParams)
    }
  }

  // Target Date switch handler
  const handleSelectTargetDate = (newDate) => {
    setTargetDate(newDate)
    if (activeResumeId) {
      const newParams = { resume_id: activeResumeId, language: selectedLanguage }
      if (newDate) newParams.target_date = newDate
      setSearchParams(newParams)
    }
  }

  // Progress update handler
  const handleUpdateStageProgress = async (skillName, stage, isCompleted) => {
    if (!roadmapData || !roadmapData.resume_id) return

    // Optimistic local state update
    setRoadmapData(prev => {
      if (!prev || !prev.skills) return prev
      const updatedSkills = prev.skills.map(s => {
        if (s.skill_name === skillName) {
          const newStages = { ...s.stages_status, [stage]: isCompleted }
          const completedCount = Object.values(newStages).filter(Boolean).length
          const newPercent = Math.round((completedCount / 5) * 100)
          return {
            ...s,
            stage: stage,
            progress_percent: newPercent,
            is_completed: isCompleted && stage === 'complete',
            stages_status: newStages
          }
        }
        return s
      })
      const totalProgress = Math.round(updatedSkills.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) / (updatedSkills.length || 1))
      return {
        ...prev,
        learning_progress_percent: totalProgress,
        skills: updatedSkills
      }
    })

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

  const displayDailyPlan = activeSkillObj ? {
    skill_name: activeSkillObj.skill_name,
    goal_title: `Mastering ${activeSkillObj.skill_name} — ${activeSkillObj.stage ? (activeSkillObj.stage.charAt(0).toUpperCase() + activeSkillObj.stage.slice(1)) : 'Learn'} Phase`,
    estimated_minutes: roadmapData?.daily_plan?.estimated_minutes || 45,
    task_description: `Watch 1 core video tutorial and study ${activeSkillObj.skill_name} fundamentals for ${roadmapData?.target_role || 'your target role'}.`,
    stage: activeSkillObj.stage || 'learn',
    pace_label: roadmapData?.pace_label || 'Standard Pace'
  } : roadmapData?.daily_plan

  const displayContinueLearning = activeSkillObj ? {
    skill_name: activeSkillObj.skill_name,
    stage: activeSkillObj.stage || 'learn',
    progress_percent: activeSkillObj.progress_percent || 0,
    priority: activeSkillObj.priority || 'High'
  } : roadmapData?.continue_learning

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
        onOpenAiAssistant={() => {
          const defaultSkill = activeSkillObj?.skill_name || (roadmapData?.skills && roadmapData.skills.length > 0 ? roadmapData.skills[0].skill_name : 'General')
          setAiSkillTarget(defaultSkill)
          setIsAiOpen(true)
        }}
        activeResumeId={activeResumeId}
        onSelectResume={handleSelectResume}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        targetDate={targetDate}
        onSelectTargetDate={handleSelectTargetDate}
        daysRemaining={roadmapData?.days_remaining}
        paceLabel={roadmapData?.pace_label}
        skills={roadmapData?.skills || []}
        matchingSkills={roadmapData?.matching_skills || []}
        missingSkills={roadmapData?.missing_skills || []}
        onSelectSkill={(id) => setActiveSkillId(id)}
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
              dailyPlan={displayDailyPlan}
              onQuickWatch={() => {
                setVideoStartTime(0)
                setActiveChapterIndex(0)

                const videoMap = {
                  'Problem Solving': { title: 'Problem Solving & Algorithmic Thinking Masterclass', embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME' },
                  'Data Structures': { title: 'Data Structures Complete Masterclass', embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME' },
                  'Algorithms': { title: 'Algorithms & Data Structures Masterclass', embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME' },
                  'Java': { title: 'Java Tutorial for Beginners - Full Course', embed_url: 'https://www.youtube.com/embed/eIrMbAQSU34' },
                  'Python': { title: 'Python for Beginners - Full Course', embed_url: 'https://www.youtube.com/embed/rfscVS0vtbw' },
                  'C++': { title: 'C++ Programming Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/vLnPwxZdW4Y' },
                  'C#': { title: 'C# Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/gfkTfcpWqAY' },
                  'JavaScript': { title: 'JavaScript Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/W6NZfCO5SIk' },
                  'HTML': { title: 'HTML Full Course for Beginners', embed_url: 'https://www.youtube.com/embed/pQN-pnXPaVg' },
                  'CSS': { title: 'CSS Flexbox & Responsive Design Masterclass', embed_url: 'https://www.youtube.com/embed/1Rs2ND1ryYc' },
                  'SQL': { title: 'SQL & Relational Databases Masterclass', embed_url: 'https://www.youtube.com/embed/HXV3zeQKqGY' },
                  'Git': { title: 'Git Version Control & Workflow Masterclass', embed_url: 'https://www.youtube.com/embed/8JJ101D3knE' },
                  'React.js': { title: 'React.js Complete Masterclass', embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8' },
                  'React': { title: 'React.js Complete Masterclass', embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8' },
                  'System Design': { title: 'System Design Fundamentals', embed_url: 'https://www.youtube.com/embed/m8Icp_Cid5o' },
                  'OOP': { title: 'Object-Oriented Programming Masterclass', embed_url: 'https://www.youtube.com/embed/pTB0EiLXUC8' },
                  'Object-Oriented Programming': { title: 'Object-Oriented Programming Masterclass', embed_url: 'https://www.youtube.com/embed/pTB0EiLXUC8' },
                  'DBMS': { title: 'Database Management Systems Masterclass', embed_url: 'https://www.youtube.com/embed/HXV3zeQKqGY' },
                  'Web Development': { title: 'Full-Stack Web Development Course', embed_url: 'https://www.youtube.com/embed/nu_pCVPKzTk' }
                }

                const sName = activeSkillObj?.skill_name || 'Problem Solving'
                const vid = videoMap[sName] || (activeSkillObj?.youtube_videos?.[0]?.embed_url ? activeSkillObj.youtube_videos[0] : {
                  title: `${sName} Complete Masterclass`,
                  embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME'
                })

                setQuickVideoModal({
                  skillName: sName,
                  ...vid
                })
              }}
              onStartLesson={() => {
                if (displayDailyPlan) {
                  const targetSkill = (roadmapData.skills || []).find(s => s.skill_name === displayDailyPlan.skill_name) || activeSkillObj
                  if (targetSkill) {
                    setActiveSkillId(targetSkill.id)
                    setTimeout(() => {
                      const el = document.getElementById('active-skill-card') || document.getElementById('skills-section')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }
                }
              }}
            />

            <ContinueLearningWidget 
              continueData={displayContinueLearning}
              onVideoRevision={() => setVideoRevisionModal(activeSkillObj)}
              onContinue={() => {
                if (displayContinueLearning) {
                  const targetSkill = (roadmapData.skills || []).find(s => s.skill_name === displayContinueLearning.skill_name) || activeSkillObj
                  if (targetSkill) {
                    setActiveSkillId(targetSkill.id)

                    // Saved timestamp and video per skill
                    const savedSecs = localStorage.getItem(`video_ts_${targetSkill.skill_name}`) || (targetSkill.skill_name === 'Data Structures' ? 870 : (targetSkill.skill_name === 'CSS' ? 420 : (targetSkill.skill_name === 'SQL' ? 1250 : 0)))
                    const startSecs = parseInt(savedSecs, 10) || 0
                    setVideoStartTime(startSecs)
                    setActiveChapterIndex(startSecs >= 1515 ? 2 : (startSecs >= 750 ? 1 : 0))

                    // Curated direct YouTube video embed mapping
                    const videoMap = {
                      'Problem Solving': { title: 'Problem Solving & Algorithmic Thinking Masterclass', embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME' },
                      'Data Structures': { title: 'Data Structures Complete Masterclass', embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME' },
                      'Algorithms': { title: 'Algorithms & Data Structures Masterclass', embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME' },
                      'Java': { title: 'Java Tutorial for Beginners - Full Course', embed_url: 'https://www.youtube.com/embed/eIrMbAQSU34' },
                      'Python': { title: 'Python for Beginners - Full Course', embed_url: 'https://www.youtube.com/embed/rfscVS0vtbw' },
                      'C++': { title: 'C++ Programming Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/vLnPwxZdW4Y' },
                      'C#': { title: 'C# Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/gfkTfcpWqAY' },
                      'JavaScript': { title: 'JavaScript Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/W6NZfCO5SIk' },
                      'HTML': { title: 'HTML Full Course for Beginners', embed_url: 'https://www.youtube.com/embed/pQN-pnXPaVg' },
                      'CSS': { title: 'CSS Flexbox & Responsive Design Masterclass', embed_url: 'https://www.youtube.com/embed/1Rs2ND1ryYc' },
                      'SQL': { title: 'SQL & Relational Databases Masterclass', embed_url: 'https://www.youtube.com/embed/HXV3zeQKqGY' },
                      'Git': { title: 'Git Version Control & Workflow Masterclass', embed_url: 'https://www.youtube.com/embed/8JJ101D3knE' },
                      'React.js': { title: 'React.js Complete Masterclass', embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8' },
                      'React': { title: 'React.js Complete Masterclass', embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8' },
                      'System Design': { title: 'System Design Fundamentals', embed_url: 'https://www.youtube.com/embed/m8Icp_Cid5o' },
                      'OOP': { title: 'Object-Oriented Programming Masterclass', embed_url: 'https://www.youtube.com/embed/pTB0EiLXUC8' },
                      'Object-Oriented Programming': { title: 'Object-Oriented Programming Masterclass', embed_url: 'https://www.youtube.com/embed/pTB0EiLXUC8' },
                      'DBMS': { title: 'Database Management Systems Masterclass', embed_url: 'https://www.youtube.com/embed/HXV3zeQKqGY' },
                      'Web Development': { title: 'Full-Stack Web Development Course', embed_url: 'https://www.youtube.com/embed/nu_pCVPKzTk' }
                    }

                    const sName = targetSkill.skill_name
                    const vid = videoMap[sName] || (targetSkill.youtube_videos?.[0]?.embed_url ? targetSkill.youtube_videos[0] : {
                      title: `${sName} Complete Masterclass`,
                      embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME'
                    })

                    setQuickVideoModal({
                      skillName: sName,
                      ...vid
                    })
                  }
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
            onOpenRevision={(sk) => setVideoRevisionModal(sk)}
            onStartLesson={(sk) => {
              const savedSecs = localStorage.getItem(`video_ts_${sk.skill_name}`) || (sk.skill_name === 'Data Structures' ? 870 : (sk.skill_name === 'CSS' ? 420 : (sk.skill_name === 'SQL' ? 1250 : 0)))
              const startSecs = parseInt(savedSecs, 10) || 0
              setVideoStartTime(startSecs)
              setActiveChapterIndex(startSecs >= 1515 ? 2 : (startSecs >= 750 ? 1 : 0))

              const videoMap = {
                'Problem Solving': { title: 'Problem Solving & Algorithmic Thinking Masterclass', embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME' },
                'Data Structures': { title: 'Data Structures Complete Masterclass', embed_url: 'https://www.youtube.com/embed/bbT_bV0Cc-0' },
                'Algorithms': { title: 'Algorithms & Data Structures Masterclass', embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME' },
                'Java': { title: 'Java Tutorial for Beginners - Full Course', embed_url: 'https://www.youtube.com/embed/eIrMbAQSU34' },
                'Python': { title: 'Python for Beginners - Full Course', embed_url: 'https://www.youtube.com/embed/rfscVS0vtbw' },
                'C++': { title: 'C++ Programming Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/vLnPwxZdW4Y' },
                'C#': { title: 'C# Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/gfkTfcpWqAY' },
                'JavaScript': { title: 'JavaScript Tutorial for Beginners', embed_url: 'https://www.youtube.com/embed/W6NZfCO5SIk' },
                'HTML': { title: 'HTML Full Course for Beginners', embed_url: 'https://www.youtube.com/embed/pQN-pnXPaVg' },
                'CSS': { title: 'CSS Flexbox & Responsive Design Masterclass', embed_url: 'https://www.youtube.com/embed/1Rs2ND1ryYc' },
                'SQL': { title: 'SQL & Relational Databases Masterclass', embed_url: 'https://www.youtube.com/embed/HXV3zeQKqGY' },
                'Git': { title: 'Git Version Control & Workflow Masterclass', embed_url: 'https://www.youtube.com/embed/8JJ101D3knE' },
                'React.js': { title: 'React.js Complete Masterclass', embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8' },
                'React': { title: 'React.js Complete Masterclass', embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8' },
                'System Design': { title: 'System Design Fundamentals', embed_url: 'https://www.youtube.com/embed/m8Icp_Cid5o' },
                'OOP': { title: 'Object-Oriented Programming Masterclass', embed_url: 'https://www.youtube.com/embed/pTB0EiLXUC8' },
                'Object-Oriented Programming': { title: 'Object-Oriented Programming Masterclass', embed_url: 'https://www.youtube.com/embed/pTB0EiLXUC8' },
                'DBMS': { title: 'Database Management Systems Masterclass', embed_url: 'https://www.youtube.com/embed/HXV3zeQKqGY' },
                'Web Development': { title: 'Full-Stack Web Development Course', embed_url: 'https://www.youtube.com/embed/nu_pCVPKzTk' }
              }

              const sName = sk.skill_name
              const vid = videoMap[sName] || (sk.youtube_videos?.[0]?.embed_url ? sk.youtube_videos[0] : {
                title: `${sName} Complete Masterclass`,
                embed_url: 'https://www.youtube.com/embed/0IAPZzGSbME'
              })

              setQuickVideoModal({
                skillName: sName,
                ...vid
              })
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
            <div id="active-skill-card" className="scroll-mt-6">
              <SkillLearningCard
                skill={activeSkillObj}
                targetRole={roadmapData.target_role}
                resumeId={roadmapData.resume_id}
                onUpdateStageProgress={handleUpdateStageProgress}
                onBookmark={handleAddBookmark}
                onOpenAiForSkill={(skillName) => {
                  setAiSkillTarget(skillName)
                  setIsAiOpen(true)
                }}
              />
            </div>
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

      {/* Quick Video Watch Modal */}
      {quickVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-indigo-100 space-y-4 relative">
            <button
              onClick={() => setQuickVideoModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <XIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 rounded-md border border-amber-200">
                🎬 Quick Watch Tutorial
              </span>
              <span className="text-xs font-bold text-gray-500">
                • {quickVideoModal.skillName}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 line-clamp-1 pr-8">
              {quickVideoModal.title}
            </h3>

            {/* Video Player Container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-gray-200">
              {(() => {
                let activeEmbedUrl = quickVideoModal.embed_url
                if (!activeEmbedUrl && quickVideoModal.url) {
                  const match = quickVideoModal.url.match(/(?:v=|\/embed\/|\/watch\?v=)([^&?/]+)/)
                  if (match && match[1]) {
                    activeEmbedUrl = `https://www.youtube.com/embed/${match[1]}`
                  }
                }
                if (!activeEmbedUrl) {
                  activeEmbedUrl = 'https://www.youtube.com/embed/RBSGKlAvoiM'
                }

                const finalSrc = activeEmbedUrl.includes('autoplay')
                  ? activeEmbedUrl
                  : `${activeEmbedUrl}${activeEmbedUrl.includes('?') ? '&' : '?'}start=${videoStartTime || 0}&autoplay=1`

                return (
                  <iframe
                    key={`${finalSrc}`}
                    src={finalSrc}
                    title={quickVideoModal.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              })()}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                Recommended for {roadmapData?.target_role || 'Software Engineer'} preparation
              </span>
              <button
                onClick={() => setQuickVideoModal(null)}
                className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Video Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video-Specific Revision Sheet Modal */}
      {videoRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-indigo-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setVideoRevisionModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <XIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl border border-indigo-200">
                📄
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                  Video Revision Cheat-Sheet
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {videoRevisionModal.skill_name || 'Skill'} Masterclass Summary
                </h3>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 text-gray-700">
              <p className="font-extrabold text-gray-900">
                📺 Video Source: <span className="text-indigo-600 font-bold">{videoRevisionModal.youtube_videos?.[0]?.title || `${videoRevisionModal.skill_name} Complete Masterclass`}</span>
              </p>
              <p className="text-[11px] text-gray-500 font-medium">
                Tailored for {roadmapData?.target_role || 'Software Engineer'} placement interviews
              </p>
            </div>

            {/* Revision Sheet Body */}
            <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
              <div className="space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <h4 className="font-extrabold text-indigo-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  📌 1. Core Definition & Concepts
                </h4>
                <ul className="space-y-1.5 list-disc pl-4 text-gray-800">
                  <li><strong>Primary Function:</strong> Provides the foundational architecture required for efficient code execution in production systems.</li>
                  <li><strong>Memory & Structure:</strong> Optimized to reduce space complexity and maximize CPU/query runtime execution.</li>
                  <li><strong>Key Trade-off:</strong> Balancing time complexity $O(1) / O(\log n)$ against memory allocation overhead.</li>
                </ul>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  💻 2. Key Syntax & Video Timestamps
                </h4>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <span>⏱️ [ 05:20 ] Fundamentals & Setup</span>
                    <span className="text-indigo-600 font-bold">Standard Setup Rule</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <span>⏱️ [ 18:40 ] Core Code Implementation</span>
                    <span className="text-indigo-600 font-bold">Main Class & Logic</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <span>⏱️ [ 32:10 ] Optimization & Scaling</span>
                    <span className="text-indigo-600 font-bold">Production Edge Cases</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                <h4 className="font-extrabold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  🎙️ 3. Top Interview Questions & Model Answers
                </h4>
                <div className="space-y-2 text-gray-800">
                  <p>
                    <strong>Q: How do you explain the trade-offs of {videoRevisionModal.skill_name} in an interview?</strong><br />
                    <span className="text-gray-600">A: Compare time vs space complexity and explain why this pattern scales better under high load.</span>
                  </p>
                  <p>
                    <strong>Q: What is a common pitfall candidates make with {videoRevisionModal.skill_name}?</strong><br />
                    <span className="text-gray-600">A: Failing to account for boundary edge cases or unnecessary re-computations in loops.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-all"
              >
                🖨️ Print / Save PDF Cheat-Sheet
              </button>
              <button
                onClick={() => setVideoRevisionModal(null)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Revision Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Interactive Practice Quiz Modal */}
      {isPracticeQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-indigo-100 space-y-5 relative">
            <button
              onClick={() => {
                setIsPracticeQuizOpen(false)
                setCurrentQuizIndex(0)
                setQuizScore(0)
                setSelectedAnswerIndex(null)
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <XIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl border border-purple-200">
                🧠
              </div>
              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                  {activeSkillObj?.skill_name || 'Skill'} Practice Quiz
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  Question {currentQuizIndex + 1} of 5
                </h3>
              </div>
            </div>

            {/* Quiz Question Body */}
            {(() => {
              const quizQuestions = activeSkillObj?.quiz_questions && activeSkillObj.quiz_questions.length > 0 
                ? activeSkillObj.quiz_questions 
                : [
                    {
                      question: `What is the primary function of ${activeSkillObj?.skill_name || 'this skill'} in software development?`,
                      options: [
                        `To structure and optimize ${activeSkillObj?.skill_name || 'core code'} for production deployment`,
                        'To style UI components only',
                        'To manage database transactions exclusively',
                        'To configure server network routes'
                      ],
                      correct: 0,
                      explanation: `${activeSkillObj?.skill_name || 'This skill'} provides the foundational architecture required for efficient execution.`
                    },
                    {
                      question: `Which key best-practice is essential when working with ${activeSkillObj?.skill_name || 'this skill'}?`,
                      options: [
                        'Ignoring code modularity',
                        'Writing clean, documented, and reusable code',
                        'Hardcoding sensitive API keys in source files',
                        'Avoiding version control'
                      ],
                      correct: 1,
                      explanation: 'Clean, modular, and documented code ensures maintainability across engineering teams.'
                    },
                    {
                      question: `What is a common performance bottleneck associated with ${activeSkillObj?.skill_name || 'this skill'}?`,
                      options: [
                        'Using proper indexing and data structures',
                        'Unoptimized loops or excessive re-renders',
                        'Minifying production assets',
                        'Caching static responses'
                      ],
                      correct: 1,
                      explanation: 'Unoptimized loops or redundant calculations heavily degrade overall runtime performance.'
                    },
                    {
                      question: `In a technical interview, how should you explain the trade-offs of ${activeSkillObj?.skill_name || 'this skill'}?`,
                      options: [
                        'Focus strictly on syntax without mentioning time/space complexity',
                        'Compare time vs space complexity and real-world scalability',
                        'State that there are no trade-offs',
                        'Defer the answer to framework defaults'
                      ],
                      correct: 1,
                      explanation: 'Engineering interviewers expect candidate evaluation of time vs space complexity trade-offs.'
                    },
                    {
                      question: `Which tool or framework commonly integrates with ${activeSkillObj?.skill_name || 'this skill'} in modern stacks?`,
                      options: [
                        'Standard CI/CD and automated testing pipelines',
                        'Legacy MS-DOS scripts',
                        'Manual FTP transfers',
                        'Unencrypted plain-text logs'
                      ],
                      correct: 0,
                      explanation: 'Automated CI/CD testing pipelines ensure continuous quality and integration.'
                    }
                  ]

              const currentQ = quizQuestions[currentQuizIndex % quizQuestions.length]

              if (currentQuizIndex >= 5) {
                return (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold shadow-inner border border-emerald-200">
                      🏆
                    </div>
                    <h4 className="text-2xl font-extrabold text-gray-900">Quiz Completed!</h4>
                    <p className="text-sm text-gray-600">
                      You scored <strong className="text-emerald-600 font-extrabold">{quizScore} out of 5</strong> on **{activeSkillObj?.skill_name}**!
                    </p>
                    <button
                      onClick={() => {
                        setIsPracticeQuizOpen(false)
                        setCurrentQuizIndex(0)
                        setQuizScore(0)
                        setSelectedAnswerIndex(null)
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                    >
                      Return to Learning Dashboard ➔
                    </button>
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-900 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {currentQ.question}
                  </p>

                  <div className="space-y-2">
                    {currentQ.options.map((opt, idx) => {
                      let btnStyle = 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50 hover:border-indigo-300'
                      if (selectedAnswerIndex !== null) {
                        if (idx === currentQ.correct) {
                          btnStyle = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                        } else if (idx === selectedAnswerIndex) {
                          btnStyle = 'bg-rose-50 text-rose-900 border-rose-300 font-bold'
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={selectedAnswerIndex !== null}
                          onClick={() => {
                            setSelectedAnswerIndex(idx)
                            if (idx === currentQ.correct) setQuizScore(prev => prev + 1)
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {selectedAnswerIndex !== null && idx === currentQ.correct && (
                            <span className="text-emerald-600 font-extrabold text-xs">✓ Correct</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {selectedAnswerIndex !== null && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 font-medium">
                      💡 <strong>Explanation:</strong> {currentQ.explanation}
                    </div>
                  )}

                  {selectedAnswerIndex !== null && (
                    <button
                      onClick={() => {
                        setSelectedAnswerIndex(null)
                        setCurrentQuizIndex(prev => prev + 1)
                      }}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer hover:shadow-md transition-all"
                    >
                      {currentQuizIndex < 4 ? 'Next Question ➔' : 'View Final Score 🏆'}
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default LearningPath