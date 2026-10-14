// src/components/learning/ContinueLearningWidget.jsx

import React from 'react'
import { PlayIcon, RefreshIcon, AcademicCapIcon, SparklesIcon } from '@heroicons/react/outline'

export const ContinueLearningWidget = ({ continueData, onContinue, onPracticeQuiz, onVideoRevision }) => {
  // Empty state when student has no prior learning activity yet
  if (!continueData || !continueData.hasActivity) {
    const targetSkillName = continueData?.skill_name || 'JavaScript'
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4 h-full">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            🚀
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Get Started
              </span>
              <span className="text-xs text-gray-400 font-medium">Ready to Begin</span>
            </div>
            <h4 className="font-extrabold text-base text-gray-900 leading-snug">
              Ready to Start Your Roadmap?
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Begin with {targetSkillName} to kick off your personalized industry transition. Your continuous watch time and practice notes will appear here.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-end pt-2 border-t border-gray-100 sm:border-0 sm:pt-0">
          <button
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all hover:shadow-md cursor-pointer whitespace-nowrap"
          >
            <PlayIcon className="w-4 h-4 fill-white" />
            Start First Milestone ➔
          </button>
        </div>
      </div>
    )
  }

  // Active in-progress learning state
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4 h-full">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex flex-col items-center justify-center font-bold text-sm shadow-xs shrink-0">
          <span>{continueData.progress_percent}%</span>
          <span className="text-[9px] uppercase tracking-tighter text-blue-500 font-medium">Done</span>
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Continue Learning
            </span>
            {continueData.priority && (
              <span className="text-[10px] font-bold text-gray-500">
                {continueData.priority} Priority
              </span>
            )}
          </div>
          <h4 className="font-extrabold text-base text-gray-900 leading-snug">
            {continueData.skill_name} — <span className="capitalize">{continueData.stage} Phase</span>
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Pick up right where you left off. Watch next lessons, review cheat-sheets, or test your skills.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-end pt-2 border-t border-gray-100 sm:border-0 sm:pt-0">
        {onVideoRevision && (
          <button
            onClick={onVideoRevision}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-all hover:shadow-md cursor-pointer whitespace-nowrap"
            title="Open video-specific revision cheat-sheet"
          >
            📄 Video Revision Sheet
          </button>
        )}

        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer whitespace-nowrap"
        >
          <PlayIcon className="w-4 h-4 fill-white" />
          Continue {continueData.skill_name}
        </button>
      </div>
    </div>
  )
}
