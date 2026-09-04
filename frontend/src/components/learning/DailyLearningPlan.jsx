// src/components/learning/DailyLearningPlan.jsx

import React from 'react'
import { CalendarIcon, ClockIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/outline'

export const DailyLearningPlan = ({ dailyPlan, onStartLesson, onQuickWatch }) => {
  if (!dailyPlan) return null

  return (
    <div id="daily-goal" className="bg-[#111827] border border-gray-800/90 rounded-3xl p-6 shadow-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 scroll-mt-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-md flex-shrink-0">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
              Today's Goal
            </span>
            {dailyPlan.pace_label && (
              <span className="text-[10px] font-extrabold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-800/50">
                {dailyPlan.pace_label}
              </span>
            )}
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {dailyPlan.estimated_minutes} mins / day
            </span>
          </div>
          <h4 className="font-extrabold text-base text-white leading-snug">
            {dailyPlan.goal_title}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {dailyPlan.task_description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
        {onQuickWatch && (
          <button
            onClick={onQuickWatch}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
            title="Watch recommended YouTube tutorial in a pop-up modal right here"
          >
            🎬 Quick Watch
          </button>
        )}

        <button
          onClick={onStartLesson}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <PlayIcon className="w-4 h-4 fill-white" />
          Start Learning
        </button>
      </div>
    </div>
  )
}
