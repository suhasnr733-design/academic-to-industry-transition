// src/components/learning/YourSkillsLearningSection.jsx

import React, { useState } from 'react'
import { SkillBrandLogo } from './SkillBrandLogo'
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  CodeIcon, 
  DatabaseIcon, 
  CloudIcon, 
  TerminalIcon, 
  ChipIcon, 
  GlobeIcon, 
  FolderIcon,
  SearchIcon,
  SparklesIcon
} from '@heroicons/react/outline'

const CATEGORY_ICONS = {
  'Programming Languages': CodeIcon,
  'Web Technologies / Frameworks': GlobeIcon,
  'Databases': DatabaseIcon,
  'AI / Machine Learning': ChipIcon,
  'Cloud': CloudIcon,
  'Development Tools': TerminalIcon,
  'Other': FolderIcon
}

const CATEGORY_COLORS = {
  'Programming Languages': 'bg-blue-50 text-blue-700 border-blue-200',
  'Web Technologies / Frameworks': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Databases': 'bg-purple-50 text-purple-700 border-purple-200',
  'AI / Machine Learning': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cloud': 'bg-sky-50 text-sky-700 border-sky-200',
  'Development Tools': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Other': 'bg-gray-50 text-gray-700 border-gray-200'
}

const SKILL_BRAND_ICONS = {
  'Data Structures': '🏗️',
  'Algorithms': '⚡',
  'Git': '🐙',
  'Java': '☕',
  'Python': '🐍',
  'C++': '⚙️',
  'C#': '🎯',
  'JavaScript': '🟨',
  'HTML': '🌐',
  'CSS': '🎨',
  'SQL': '🗄️',
  'React': '⚛️',
  'React.js': '⚛️',
  'Problem Solving': '🧩',
  'System Design': '🏛️',
  'DBMS': '💾',
  'Web Development': '💻'
}

export const YourSkillsLearningSection = ({ skills, activeSkillId, onSelectSkill, onOpenRevision, onStartLesson }) => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all') // all, matching, missing

  if (!skills || skills.length === 0) return null

  // Collect available categories present in the skills array
  const categoriesPresent = Array.from(new Set(skills.map(s => s.category || 'Other')))
  const categoryOptions = ['All', ...categoriesPresent]

  // Filter skills by category and status
  const filteredSkills = skills.filter(skill => {
    // Category match
    if (selectedCategory !== 'All' && (skill.category || 'Other') !== selectedCategory) {
      return false
    }

    // Status match
    if (statusFilter === 'matching' && !skill.is_existing && skill.status !== 'matching') {
      return false
    }
    if (statusFilter === 'missing' && (skill.is_existing || skill.status === 'matching')) {
      return false
    }

    return true
  })

  return (
    <div id="skills-section" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 scroll-mt-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-gray-900">Your Skills & Learning</h3>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {skills.length} Extracted Skills
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Categorized technical breakdown derived from your active resume and target role gap analysis.
          </p>
        </div>

        {/* Status Filter (All, Existing Skills, Priority Gaps) */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Skills ({skills.length})
          </button>
          <button
            onClick={() => setStatusFilter('matching')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              statusFilter === 'matching'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-green-700'
            }`}
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Existing ({skills.filter(s => s.is_existing || s.status === 'matching').length})
          </button>
          <button
            onClick={() => setStatusFilter('missing')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              statusFilter === 'missing'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-amber-700'
            }`}
          >
            <ExclamationCircleIcon className="w-3.5 h-3.5" />
            Priority Gaps ({skills.filter(s => !s.is_existing && s.status !== 'matching').length})
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 text-xs">
        {categoryOptions.map(cat => {
          const IconComponent = CATEGORY_ICONS[cat] || FolderIcon
          const isActive = selectedCategory === cat
          const count = cat === 'All' ? skills.length : skills.filter(s => (s.category || 'Other') === cat).length

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat !== 'All' && <IconComponent className="w-3.5 h-3.5" />}
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Skill Cards Grid */}
      {filteredSkills.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-xs font-semibold text-gray-500">No skills match the selected category and status filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map(skillItem => {
            const isActive = skillItem.id === activeSkillId
            const isExisting = skillItem.is_existing || skillItem.status === 'matching'
            const IconComp = CATEGORY_ICONS[skillItem.category] || FolderIcon
            const catBadgeClass = CATEGORY_COLORS[skillItem.category] || 'bg-gray-50 text-gray-700 border-gray-200'
            const brandIcon = SKILL_BRAND_ICONS[skillItem.skill_name] || '💡'

            return (
              <div
                key={skillItem.id}
                onClick={() => onSelectSkill(skillItem.id)}
                className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/60 border-indigo-500 shadow-lg ring-2 ring-indigo-500/30'
                    : isExisting
                    ? 'bg-gradient-to-b from-emerald-50/15 via-white to-white border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10'
                    : 'bg-gradient-to-b from-amber-50/20 via-white to-white border-amber-300/80 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10'
                }`}
              >
                <div>
                  {/* Top Glowing Accent Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                      isActive
                        ? 'bg-indigo-600'
                        : isExisting
                        ? 'bg-emerald-400 group-hover:bg-emerald-500'
                        : 'bg-amber-400 group-hover:bg-amber-500'
                    }`}
                  />

                  {/* Card Header: Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${catBadgeClass}`}>
                      <IconComp className="w-3 h-3" />
                      {skillItem.category || 'Other'}
                    </span>

                    {isExisting ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-200 flex items-center gap-1 shadow-sm">
                        <CheckCircleIcon className="w-3 h-3 text-emerald-700" />
                        Existing Skill
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-950 border border-amber-300/80 flex items-center gap-1 shadow-sm">
                        <ExclamationCircleIcon className="w-3 h-3 text-amber-700" />
                        Priority Gap
                      </span>
                    )}
                  </div>

                  {/* Skill Name & Tech Brand Icon */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-base flex items-center justify-center border border-slate-200/80 shadow-xs group-hover:scale-105 transition-transform p-1.5">
                      <SkillBrandLogo skillName={skillItem.skill_name} className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-base text-gray-900 flex-1 flex items-center justify-between">
                      <span>{skillItem.skill_name}</span>
                      {isActive && <SparklesIcon className="w-4 h-4 text-indigo-600 animate-pulse" />}
                    </h4>
                  </div>

                  {/* Progress & Stage */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                      <span className="capitalize text-[11px] font-bold text-gray-500">Stage: {skillItem.stage}</span>
                      <span className="text-indigo-700 font-extrabold">{skillItem.progress_percent}%</span>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          skillItem.is_completed
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                            : 'bg-gradient-to-r from-indigo-500 to-blue-600'
                        }`}
                        style={{ width: `${skillItem.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Personalized Rationale Snippet */}
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-2.5 leading-relaxed font-medium">
                    {skillItem.why_recommended}
                  </p>
                </div>

                {/* Glassmorphic 1-Click Action Footer Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectSkill(skillItem.id)
                      if (onOpenRevision) onOpenRevision(skillItem)
                    }}
                    className="flex-1 py-1.5 px-2 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-xl border border-indigo-200/80 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-center gap-1"
                    title="Open 1-Page Revision Cheat-Sheet for this skill"
                  >
                    📄 Revision
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectSkill(skillItem.id)
                      if (onStartLesson) onStartLesson(skillItem)
                    }}
                    className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                    title="Stream tutorial video starting from saved timestamp"
                  >
                    ▶ Start Lesson
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default YourSkillsLearningSection
