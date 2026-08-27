// src/components/learning/YourSkillsLearningSection.jsx

import React, { useState } from 'react'
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

export const YourSkillsLearningSection = ({ skills, activeSkillId, onSelectSkill }) => {
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

            return (
              <div
                key={skillItem.id}
                onClick={() => onSelectSkill(skillItem.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all transform hover:-translate-y-0.5 ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-50/90 to-blue-50 border-indigo-400 shadow-md ring-2 ring-indigo-400/30'
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                {/* Card Header: Category & Status */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${catBadgeClass}`}>
                    <IconComp className="w-3 h-3" />
                    {skillItem.category || 'Other'}
                  </span>

                  {isExisting ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 flex items-center gap-0.5">
                      <CheckCircleIcon className="w-3 h-3" />
                      Existing Skill
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-0.5">
                      <ExclamationCircleIcon className="w-3 h-3" />
                      Priority Gap
                    </span>
                  )}
                </div>

                {/* Skill Name */}
                <h4 className="font-extrabold text-base text-gray-900 flex items-center justify-between">
                  <span>{skillItem.skill_name}</span>
                  {isActive && <SparklesIcon className="w-4 h-4 text-indigo-600 animate-pulse" />}
                </h4>

                {/* Progress & Stage */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span className="capitalize text-[11px]">Stage: {skillItem.stage}</span>
                    <span className="text-indigo-700 font-bold">{skillItem.progress_percent}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        skillItem.is_completed ? 'bg-green-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${skillItem.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* Personalized Rationale Snippet */}
                <p className="text-[11px] text-gray-500 line-clamp-2 mt-2.5 leading-relaxed">
                  {skillItem.why_recommended}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default YourSkillsLearningSection
