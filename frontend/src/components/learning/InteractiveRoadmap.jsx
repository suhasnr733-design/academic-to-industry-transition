// src/components/learning/InteractiveRoadmap.jsx

import React from 'react'
import { SkillBrandLogo } from './SkillBrandLogo'
import { CheckCircleIcon, ArrowRightIcon, LockClosedIcon, PlayIcon } from '@heroicons/react/solid'

export const InteractiveRoadmap = ({ skills, activeSkillId, onSelectSkill }) => {
  if (!skills || skills.length === 0) return null

  return (
    <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-white">Career Skill Progression Roadmap</h3>
          <p className="text-xs text-gray-400 mt-0.5">Ordered by prerequisite dependencies and target career priority</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
          {skills.length} Learning Phases
        </span>
      </div>

      {/* Horizontal Flowchart for Desktop, Vertical for Mobile */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 overflow-x-auto pb-4 pt-2">
        {skills.map((skillItem, index) => {
          const isCompleted = skillItem.is_completed
          const isActive = skillItem.id === activeSkillId
          const isNext = !isCompleted && !isActive && (index === 0 || skills[index - 1].is_completed)

          return (
            <React.Fragment key={skillItem.id}>
              {/* Roadmap Node Card */}
              <button
                onClick={() => onSelectSkill(skillItem.id)}
                className={`flex-1 min-w-[210px] p-4 rounded-xl text-left border transition-all transform hover:-translate-y-0.5 ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/30'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40'
                    : isNext
                    ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200 hover:bg-indigo-950/50'
                    : 'bg-[#1E293B]/60 border-gray-700/80 text-gray-400 opacity-70 hover:opacity-100 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' :
                    isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#0F172A] text-gray-400 border border-gray-700'
                  }`}>
                    Phase {index + 1}
                  </span>

                  {isCompleted ? (
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                  ) : isActive ? (
                    <PlayIcon className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-400">{skillItem.priority}</span>
                  )}
                </div>

                {/* Skill Name & Vector Brand Logo */}
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center p-1 shrink-0 ${
                    isActive ? 'bg-white/20 border border-white/30' : 'bg-[#0F172A] border border-gray-700'
                  }`}>
                    <SkillBrandLogo skillName={skillItem.skill_name} className="w-4 h-4" />
                  </div>
                  <h4 className={`font-extrabold text-sm truncate ${isActive ? 'text-white' : 'text-gray-100'}`}>
                    {skillItem.skill_name}
                  </h4>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`capitalize text-[11px] ${isActive ? 'text-indigo-100' : 'text-gray-400'}`}>
                    Stage: {skillItem.stage}
                  </span>
                  <span className={`font-bold ${isActive ? 'text-white' : 'text-gray-200'}`}>
                    {skillItem.progress_percent}%
                  </span>
                </div>

                {/* Progress bar inside node */}
                <div className={`w-full rounded-full h-1 mt-1.5 ${isActive ? 'bg-white/20' : 'bg-[#0F172A]'}`}>
                  <div 
                    className={`h-1 rounded-full ${isActive ? 'bg-white' : isCompleted ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                    style={{ width: `${skillItem.progress_percent}%` }}
                  />
                </div>
              </button>

              {/* Connecting Arrow */}
              {index < skills.length - 1 && (
                <div className="hidden md:flex items-center justify-center text-gray-600 px-1">
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
