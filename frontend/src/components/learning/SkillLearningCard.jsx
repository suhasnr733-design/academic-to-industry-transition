// src/components/learning/SkillLearningCard.jsx

import React, { useState } from 'react'
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
  onUpdateStageProgress,
  onBookmark,
  onOpenAiForSkill
}) => {
  const [activeTab, setActiveTab] = useState('all') // all, youtube, courses, practice, project, assessment

  if (!skill) return null

  const topCourse = skill.courses && skill.courses.length > 0 ? skill.courses[0] : null
  const otherCourses = skill.courses && skill.courses.length > 1 ? skill.courses.slice(1) : []

  const handleStageClick = (stageName, nextState) => {
    onUpdateStageProgress(skill.skill_name, stageName, nextState)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 hover:border-indigo-200 transition-all">
      {/* Skill Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold uppercase tracking-wider ${
              skill.priority === 'High' ? 'bg-red-100 text-red-800' :
              skill.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {skill.priority} Priority
            </span>
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              Est. {skill.estimated_duration}
            </span>
          </div>

          <h3 className="text-2xl font-extrabold text-gray-900">
            {skill.skill_name}
          </h3>

          <p className="text-xs text-gray-600">
            {skill.why_recommended}
          </p>
        </div>

        {/* Progress & AI Helper Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-gray-500 font-medium block">Progress</span>
            <span className="text-lg font-bold text-indigo-700">{skill.progress_percent}%</span>
          </div>

          <button
            onClick={() => onOpenAiForSkill(skill.skill_name)}
            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-colors"
            title="Ask AI Assistant about this skill"
          >
            <SparklesIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 5-Stage Learning Cycle Tracker */}
      <div className="my-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
          Learning Cycle Stages:
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { key: 'learn', label: '1. Learn', done: skill.stages_status.learn },
            { key: 'practice', label: '2. Practice', done: skill.stages_status.practice },
            { key: 'build', label: '3. Build', done: skill.stages_status.build },
            { key: 'assess', label: '4. Assess', done: skill.stages_status.assess },
            { key: 'complete', label: '5. Complete', done: skill.is_completed }
          ].map((stg) => (
            <button
              key={stg.key}
              onClick={() => handleStageClick(stg.key, !stg.done)}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                stg.done
                  ? 'bg-green-600 text-white border-green-700 shadow-sm'
                  : skill.stage === stg.key
                  ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
              }`}
            >
              <span>{stg.label}</span>
              {stg.done && <CheckCircleIcon className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-resource Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 mb-6 pb-2 text-xs">
        {[
          { id: 'all', label: 'All Resources', icon: AcademicCapIcon },
          { id: 'youtube', label: '📺 YouTube', icon: PlayIcon },
          { id: 'courses', label: '🎓 Courses', icon: AcademicCapIcon },
          { id: 'practice', label: '💻 Practice', icon: CodeIcon },
          { id: 'project', label: '🚀 Mini Project', icon: LightningBoltIcon },
          { id: 'assessment', label: '📝 Assessment', icon: ClipboardCheckIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resource Contents */}
      <div className="space-y-6">
        {/* Highlighted Top Recommendation */}
        {(activeTab === 'all' || activeTab === 'courses') && topCourse && (
          <RecommendedResourceHighlight 
            course={topCourse}
            skillName={skill.skill_name}
            targetRole={targetRole}
            onBookmark={onBookmark}
          />
        )}

        {/* Other Courses List */}
        {(activeTab === 'all' || activeTab === 'courses') && otherCourses.length > 0 && (
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

        {/* Assessment Section */}
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
                5 Questions • 10 Mins • Test your readiness before completing the skill.
              </p>
            </div>

            <button
              onClick={() => handleStageClick('assess', true)}
              className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow transition-all whitespace-nowrap ${
                skill.stages_status.assess
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {skill.stages_status.assess ? '✓ Quiz Passed' : 'Take Quiz & Mark Complete'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
