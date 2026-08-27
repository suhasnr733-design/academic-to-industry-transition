// src/components/learning/DailyLearningPlan.jsx

import React from 'react'
import { CalendarIcon, ClockIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/outline'

export const DailyLearningPlan = ({ dailyPlan, onStartLesson, onQuickWatch }) => {
  if (!dailyPlan) return null

  return (
    <div id="daily-goal" className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 scroll-mt-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              Today's Goal
            </span>
            {dailyPlan.pace_label && (
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                {dailyPlan.pace_label}
              </span>
            )}
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {dailyPlan.estimated_minutes} mins / day
            </span>
          </div>
          <h4 className="font-extrabold text-base text-gray-900 leading-snug">
            {dailyPlan.goal_title}
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            {dailyPlan.task_description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
        {onQuickWatch && (
          <button
            onClick={onQuickWatch}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow transition-all hover:shadow-md cursor-pointer whitespace-nowrap"
            title="Watch recommended YouTube tutorial in a pop-up modal right here"
          >
            🎬 Quick Watch
          </button>
        )}

        <button
          onClick={onStartLesson}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all hover:shadow-md cursor-pointer whitespace-nowrap"
        >
          <PlayIcon className="w-4 h-4 fill-white" />
          Start Learning
        </button>
      </div>
    </div>
  )
}
