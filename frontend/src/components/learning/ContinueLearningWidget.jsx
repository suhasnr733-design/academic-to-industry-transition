// src/components/learning/ContinueLearningWidget.jsx

import React from 'react'
import { PlayIcon } from '@heroicons/react/outline'

export const ContinueLearningWidget = ({ continueData, onContinue, onPracticeQuiz, onVideoRevision }) => {
  if (!continueData) return null

  return (
    <div className="bg-[#111827] border border-gray-800/80 rounded-2xl p-5 shadow-xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
          {continueData.progress_percent}%
        </div>
        <div>
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
            Continue Learning
          </span>
          <h4 className="font-bold text-sm text-white">
            {continueData.skill_name} — <span className="capitalize text-gray-400">{continueData.stage} Phase</span>
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
        {onVideoRevision && (
          <button
            onClick={onVideoRevision}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1E293B] hover:bg-[#334155] text-indigo-300 font-bold text-xs rounded-xl border border-gray-700 transition-all cursor-pointer whitespace-nowrap"
            title="Open video-specific revision cheat-sheet"
          >
            📄 Video Revision Sheet
          </button>
        )}

        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <PlayIcon className="w-4 h-4 fill-white" />
          Continue {continueData.skill_name}
        </button>
      </div>
    </div>
  )
}
