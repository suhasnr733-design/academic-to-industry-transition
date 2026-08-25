// src/components/learning/CompletionCelebrationModal.jsx

import React from 'react'
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/solid'

export const CompletionCelebrationModal = ({ skillName, nextSkillName, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative overflow-hidden border border-green-200">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircleIcon className="w-10 h-10" />
        </div>

        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
          <SparklesIcon className="w-3.5 h-3.5" /> 🎉 Skill Mastered!
        </span>

        <h3 className="text-2xl font-extrabold text-gray-900">
          Congratulations on mastering {skillName}!
        </h3>

        <p className="text-xs text-gray-600 leading-relaxed">
          You have completed all learning stages for <span className="font-bold text-gray-900">{skillName}</span> (Learn, Practice, Project, and Assessment).
        </p>

        {nextSkillName && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 p-4 rounded-2xl text-left">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Next Recommended Skill</span>
            <h4 className="font-bold text-sm text-indigo-950 mt-0.5">{nextSkillName}</h4>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all"
        >
          Continue Learning Path
        </button>
      </div>
    </div>
  )
}
