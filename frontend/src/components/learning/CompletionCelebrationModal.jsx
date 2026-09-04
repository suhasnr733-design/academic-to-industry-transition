// src/components/learning/CompletionCelebrationModal.jsx

import React from 'react'
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/solid'

export const CompletionCelebrationModal = ({ skillName, nextSkillName, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative overflow-hidden border border-emerald-800/60">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircleIcon className="w-10 h-10" />
        </div>

        <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
          <SparklesIcon className="w-3.5 h-3.5" /> 🎉 Skill Mastered!
        </span>

        <h3 className="text-2xl font-extrabold text-white">
          Congratulations on mastering {skillName}!
        </h3>

        <p className="text-xs text-gray-400 leading-relaxed">
          You have completed all learning stages for <span className="font-bold text-white">{skillName}</span> (Learn, Practice, Project, and Assessment).
        </p>

        {nextSkillName && (
          <div className="bg-[#1E293B] border border-gray-800 p-4 rounded-2xl text-left">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Next Recommended Skill</span>
            <h4 className="font-bold text-sm text-white mt-0.5">{nextSkillName}</h4>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
        >
          Continue Learning Path
        </button>
      </div>
    </div>
  )
}
