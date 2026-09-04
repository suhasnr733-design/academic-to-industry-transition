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
  'Programming Languages': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Web Technologies / Frameworks': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Databases': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'AI / Machine Learning': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Cloud': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Development Tools': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Other': 'bg-gray-700/40 text-gray-300 border-gray-700'
}

export const YourSkillsLearningSection = ({ skills, activeSkillId, onSelectSkill, onOpenRevision, onStartLesson }) => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')

  if (!skills || skills.length === 0) return null

  const categoriesPresent = Array.from(new Set(skills.map(s => s.category || 'Other')))
  const categoryOptions = ['All', ...categoriesPresent]

  const filteredSkills = skills.filter(skill => {
    if (selectedCategory !== 'All' && (skill.category || 'Other') !== selectedCategory) {
      return false
    }

    if (statusFilter === 'matching' && !skill.is_existing && skill.status !== 'matching') {
      return false
    }
    if (statusFilter === 'missing' && (skill.is_existing || skill.status === 'matching')) {
      return false
    }

    return true
  })

  return (
    <div id="skills-section" className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 mb-8 scroll-mt-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Your Skills & Learning</h3>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
              {skills.length} Extracted Skills
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Categorized technical breakdown derived from your active resume and target role gap analysis.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-[#0F172A] p-1 rounded-xl text-xs font-semibold border border-gray-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-[#1E293B] text-white shadow-sm border border-gray-700'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Skills ({skills.length})
          </button>
          <button
            onClick={() => setStatusFilter('matching')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              statusFilter === 'matching'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-emerald-400'
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
                : 'text-gray-400 hover:text-amber-400'
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
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-[#1E293B] text-gray-300 border-gray-700/80 hover:bg-[#334155] hover:text-white'
              }`}
            >
              {cat !== 'All' && <IconComponent className="w-3.5 h-3.5" />}
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#0F172A] text-gray-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Skill Cards Grid */}
      {filteredSkills.length === 0 ? (
        <div className="py-8 text-center bg-[#0F172A]/50 rounded-xl border border-dashed border-gray-800">
          <p className="text-xs font-semibold text-gray-400">No skills match the selected category and status filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map(skillItem => {
            const isActive = skillItem.id === activeSkillId
            const isExisting = skillItem.is_existing || skillItem.status === 'matching'
            const IconComp = CATEGORY_ICONS[skillItem.category] || FolderIcon
            const catBadgeClass = CATEGORY_COLORS[skillItem.category] || 'bg-gray-800 text-gray-300 border-gray-700'

            return (
              <div
                key={skillItem.id}
                onClick={() => onSelectSkill(skillItem.id)}
                className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-950/60 via-[#1E293B] to-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/30'
                    : isExisting
                    ? 'bg-[#111827] border-gray-800 hover:border-emerald-500/40 hover:shadow-lg'
                    : 'bg-[#111827] border-gray-800 hover:border-amber-500/40 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Top Glowing Accent Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                      isActive
                        ? 'bg-indigo-500 shadow-sm shadow-indigo-500'
                        : isExisting
                        ? 'bg-emerald-500/60 group-hover:bg-emerald-400'
                        : 'bg-amber-500/60 group-hover:bg-amber-400'
                    }`}
                  />

                  {/* Card Header: Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${catBadgeClass}`}>
                      <IconComp className="w-3 h-3" />
                      {skillItem.category || 'Other'}
                    </span>

                    {isExisting ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shadow-sm">
                        <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
                        Existing Skill
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 shadow-sm">
                        <ExclamationCircleIcon className="w-3 h-3 text-amber-400" />
                        Priority Gap
                      </span>
                    )}
                  </div>

                  {/* Skill Name & Tech Brand Icon */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#1E293B] text-base flex items-center justify-center border border-gray-700 shadow-xs group-hover:scale-105 transition-transform p-1.5">
                      <SkillBrandLogo skillName={skillItem.skill_name} className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-base text-white flex-1 flex items-center justify-between">
                      <span>{skillItem.skill_name}</span>
                      {isActive && <SparklesIcon className="w-4 h-4 text-indigo-400 animate-pulse" />}
                    </h4>
                  </div>

                  {/* Progress & Stage */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                      <span className="capitalize text-[11px] font-bold text-gray-400">Stage: {skillItem.stage}</span>
                      <span className="text-indigo-400 font-extrabold">{skillItem.progress_percent}%</span>
                    </div>

                    <div className="w-full bg-[#0F172A] rounded-full h-1.5 overflow-hidden border border-gray-800">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          skillItem.is_completed
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                        }`}
                        style={{ width: `${skillItem.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Personalized Rationale Snippet */}
                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-2.5 leading-relaxed font-medium">
                    {skillItem.why_recommended}
                  </p>
                </div>

                {/* 1-Click Action Footer Bar */}
                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectSkill(skillItem.id)
                      if (onOpenRevision) onOpenRevision(skillItem)
                    }}
                    className="flex-1 py-1.5 px-2 bg-[#1E293B] hover:bg-gray-700 text-gray-300 font-bold text-[10px] rounded-xl border border-gray-700 transition-all cursor-pointer flex items-center justify-center gap-1"
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
                    className="flex-1 py-1.5 px-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-[10px] rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-1"
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
