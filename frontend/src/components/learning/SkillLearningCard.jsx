// src/components/learning/SkillLearningCard.jsx

import React, { useState } from 'react'
import { SkillBrandLogo } from './SkillBrandLogo'
import { SkillQuizModal } from './SkillQuizModal'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  SparklesIcon, 
  AcademicCapIcon, 
  PlayIcon, 
  CodeIcon, 
  LightningBoltIcon, 
  ClipboardCheckIcon,
  ExternalLinkIcon,
  BookmarkIcon
} from '@heroicons/react/outline'

import { RecommendedResourceHighlight } from './RecommendedResourceHighlight'
import { YouTubeResourceList } from './YouTubeResourceList'
import { PracticeSection } from './PracticeSection'
import { ProjectRecommendations } from './ProjectRecommendations'

export const SkillLearningCard = ({ 
  skill, 
  targetRole, 
  resumeId,
  onUpdateStageProgress,
  onBookmark,
  onOpenAiForSkill
}) => {
  const [activeTab, setActiveTab] = useState('all') // all, youtube, courses, practice, project, assessment
  const [showQuizModal, setShowQuizModal] = useState(false)

  if (!skill) return null

  const topCourse = skill.courses && skill.courses.length > 0 ? skill.courses[0] : null
  const otherCourses = skill.courses && skill.courses.length > 1 ? skill.courses.slice(1) : []

  const handleStageClick = (stageKey, nextState) => {
    onUpdateStageProgress(skill.skill_name, stageKey, nextState)
    
    if (stageKey === 'learn') setActiveTab('youtube')
    else if (stageKey === 'practice') setActiveTab('practice')
    else if (stageKey === 'build') setActiveTab('project')
    else if (stageKey === 'assess') setActiveTab('assessment')
    else if (stageKey === 'complete') setActiveTab('all')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 hover:border-indigo-200 transition-all">
      {/* Skill Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {skill.category && (
              <span className="px-2.5 py-0.5 text-xs rounded-md font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                {skill.category}
              </span>
            )}

            {(skill.is_existing || skill.status === 'matching') ? (
              <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-green-100 text-green-800">
                ✓ Existing Skill
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-amber-100 text-amber-900">
                ⚡ Priority Learning Gap
              </span>
            )}

            <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold uppercase tracking-wider ${
              skill.priority === 'High' ? 'bg-red-100 text-red-800' :
              skill.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              skill.priority === 'Developing' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {skill.priority}
            </span>

            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              Est. {skill.estimated_duration}
            </span>
          </div>

          {/* Official Vector Brand Logo in Header Title */}
          <div className="flex items-center gap-3 pt-0.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-2 shadow-2xs shrink-0">
              <SkillBrandLogo skillName={skill.skill_name} className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {skill.skill_name}
            </h3>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 p-2.5 rounded-xl text-xs text-indigo-900 font-medium">
            <span className="font-bold text-indigo-700 block mb-0.5">Why recommended for you:</span>
            {skill.why_recommended}
          </div>
        </div>

        {/* Progress & Quick Actions */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
          <div className="text-right">
            <span className="text-xs text-gray-500 font-semibold block">Progress</span>
            <span className="text-2xl font-black text-indigo-600">
              {skill.progress_percent || 0}%
            </span>
          </div>

          {onOpenAiForSkill && (
            <button
              onClick={() => onOpenAiForSkill(skill.skill_name)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors border border-purple-200"
            >
              <SparklesIcon className="w-4 h-4 text-purple-600" />
              Ask AI Assistant
            </button>
          )}
        </div>
      </div>

      {/* Stage Progression Tabs (Learn -> Practice -> Build -> Assess -> Complete) */}
      <div className="flex items-center justify-between border-b border-gray-100 my-4 overflow-x-auto py-2">
        <div className="flex items-center space-x-1">
          {[
            { id: 'all', label: 'All Resources', icon: AcademicCapIcon },
            { id: 'youtube', label: 'YouTube', icon: PlayIcon },
            { id: 'courses', label: 'Courses', icon: AcademicCapIcon },
            { id: 'practice', label: 'Practice', icon: CodeIcon },
            { id: 'project', label: 'Mini Project', icon: LightningBoltIcon },
            { id: 'assessment', label: 'Assessment', icon: ClipboardCheckIcon }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Learning Content Area */}
      <div className="space-y-6">
        {/* Recommended Top Course Highlight */}
        {(activeTab === 'all' || activeTab === 'courses') && topCourse && (
          <RecommendedResourceHighlight 
            course={topCourse} 
            skillName={skill.skill_name}
            onBookmark={onBookmark}
          />
        )}

        {/* YouTube Video Resources */}
        {(activeTab === 'all' || activeTab === 'youtube') && (
          <YouTubeResourceList 
            videos={skill.youtube_videos} 
            skillName={skill.skill_name}
            onBookmark={onBookmark}
          />
        )}

        {/* Practice Questions Section */}
        {(activeTab === 'all' || activeTab === 'practice') && (
          <PracticeSection 
            questions={skill.practice_questions} 
            skillName={skill.skill_name}
            onCompletePractice={() => handleStageClick('practice', true)}
          />
        )}

        {/* Project Section */}
        {(activeTab === 'all' || activeTab === 'project') && (
          <ProjectRecommendations 
            project={skill.project}
            skillName={skill.skill_name}
            resumeId={resumeId}
            onBookmark={onBookmark}
            onSuccess={(sk, st, val) => onUpdateStageProgress(sk, st, val)}
          />
        )}

        {/* Other Courses List - Only in Courses Tab */}
        {activeTab === 'courses' && otherCourses.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Additional Courses for {skill.skill_name}:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherCourses.map((c, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {c.provider}
                    </span>
                    <h5 className="font-bold text-xs text-gray-900 mt-1">{c.title}</h5>
                  </div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-indigo-600"
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YouTube Section */}
        {(activeTab === 'all' || activeTab === 'youtube') && (
          <YouTubeResourceList 
            videos={skill.youtube_videos}
            skillName={skill.skill_name}
            onBookmark={onBookmark}
          />
        )}

        {/* Practice Section */}
        {(activeTab === 'all' || activeTab === 'practice') && (
          <PracticeSection 
            questions={skill.practice_questions}
            skillName={skill.skill_name}
            onCompletePractice={() => handleStageClick('practice', true)}
          />
        )}

        {/* Project Section */}
        {(activeTab === 'all' || activeTab === 'project') && (
          <ProjectRecommendations 
            project={skill.project}
            skillName={skill.skill_name}
            onBookmark={onBookmark}
          />
        )}

        {/* Assessment Section (10-Question Mastery Evaluation Quiz) */}
        {(activeTab === 'all' || activeTab === 'assessment') && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase bg-purple-200 text-purple-900 px-2.5 py-0.5 rounded">
                Readiness Assessment
              </span>
              <h4 className="font-bold text-base text-gray-900 mt-1">
                {skill.skill_name} Mastery Evaluation Quiz
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                10 Questions • 15 Mins • Test your readiness before completing the skill.
              </p>
            </div>

            <button
              onClick={() => setShowQuizModal(true)}
              className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow transition-all whitespace-nowrap cursor-pointer ${
                skill.stages_status.assess
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {skill.stages_status.assess ? '✓ Quiz Passed (Click to Retake)' : 'Take Quiz & Mark Complete'}
            </button>
          </div>
        )}
      </div>

      {/* Interactive 10-Question Evaluation Quiz Modal */}
      {showQuizModal && (
        <SkillQuizModal 
          skillName={skill.skill_name}
          onClose={() => setShowQuizModal(false)}
          onPassQuiz={() => {
            handleStageClick('assess', true)
          }}
        />
      )}
    </div>
  )
}
