// src/components/learning/ContinueLearningWidget.jsx

import React from 'react'
import { PlayIcon, RefreshIcon } from '@heroicons/react/outline'

export const ContinueLearningWidget = ({ continueData, onContinue, onPracticeQuiz, onVideoRevision }) => {
  if (!continueData) return null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
          {continueData.progress_percent}%
        </div>
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Continue Learning
          </span>
          <h4 className="font-bold text-sm text-gray-900">
            {continueData.skill_name} — <span className="capitalize">{continueData.stage} Phase</span>
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
        {onVideoRevision && (
          <button
            onClick={onVideoRevision}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-all hover:shadow-md cursor-pointer whitespace-nowrap"
            title="Open video-specific revision cheat-sheet"
          >
            📄 Video Revision Sheet
          </button>
        )}

        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer whitespace-nowrap"
        >
          <PlayIcon className="w-4 h-4 fill-white" />
          Continue {continueData.skill_name}
        </button>
      </div>
    </div>
  )
}
