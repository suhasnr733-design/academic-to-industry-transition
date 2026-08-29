// src/components/learning/InteractiveRoadmap.jsx

import React from 'react'
import { SkillBrandLogo } from './SkillBrandLogo'
import { CheckCircleIcon, ArrowRightIcon, LockClosedIcon, PlayIcon } from '@heroicons/react/solid'

export const InteractiveRoadmap = ({ skills, activeSkillId, onSelectSkill }) => {
  if (!skills || skills.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Career Skill Progression Roadmap</h3>
          <p className="text-xs text-gray-500 mt-0.5">Ordered by prerequisite dependencies and target career priority</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
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
                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                    : isCompleted
                    ? 'bg-green-50 border-green-200 text-green-950 hover:bg-green-100/80'
                    : isNext
                    ? 'bg-blue-50/60 border-blue-200 text-blue-950 hover:bg-blue-100/80'
                    : 'bg-gray-50 border-gray-200 text-gray-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' :
                    isCompleted ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    Phase {index + 1}
                  </span>

                  {isCompleted ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : isActive ? (
                    <PlayIcon className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-500">{skillItem.priority}</span>
                  )}
                </div>

                {/* Skill Name & Vector Brand Logo */}
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center p-1 shrink-0 ${
                    isActive ? 'bg-white/20 border border-white/30' : 'bg-white border border-gray-200/80 shadow-2xs'
                  }`}>
                    <SkillBrandLogo skillName={skillItem.skill_name} className="w-4 h-4" />
                  </div>
                  <h4 className={`font-extrabold text-sm truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {skillItem.skill_name}
                  </h4>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`capitalize text-[11px] ${isActive ? 'text-indigo-100' : 'text-gray-500'}`}>
                    Stage: {skillItem.stage}
                  </span>
                  <span className={`font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                    {skillItem.progress_percent}%
                  </span>
                </div>

                {/* Progress bar inside node */}
                <div className={`w-full rounded-full h-1 mt-1.5 ${isActive ? 'bg-white/20' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-1 rounded-full ${isActive ? 'bg-white' : isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${skillItem.progress_percent}%` }}
                  />
                </div>
              </button>

              {/* Connecting Arrow */}
              {index < skills.length - 1 && (
                <div className="hidden md:flex items-center justify-center text-gray-300 px-1">
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
