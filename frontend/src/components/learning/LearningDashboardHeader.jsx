// src/components/learning/LearningDashboardHeader.jsx

import React from 'react'
import { 
  AcademicCapIcon, 
  ChartBarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  SearchIcon,
  FilterIcon,
  SparklesIcon
} from '@heroicons/react/outline'

export const LearningDashboardHeader = ({ 
  targetRole, 
  matchPercentage, 
  progressPercent, 
  skillsToMaster, 
  estimatedWeeks,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  onOpenAiAssistant
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl mb-8 border border-indigo-700/30 relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Header Left Info */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 rounded-full text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-indigo-300" />
              Target Role: {targetRole || 'Software Engineer'}
            </span>
            <span className="px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-300 rounded-full text-xs font-semibold">
              {matchPercentage}% Skill Match
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Your Personalized Learning Roadmap
          </h1>
          <p className="text-indigo-200/80 text-sm md:text-base leading-relaxed">
            Tailored career preparation path derived from your active resume analysis. Complete priority skill gaps to reach full industry readiness.
          </p>
        </div>

        {/* Header Right Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAiAssistant}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <SparklesIcon className="w-5 h-5" />
            AI Study Assistant
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-indigo-700/40">
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <div className="flex items-center text-indigo-300 text-xs font-medium gap-1.5 mb-1">
            <ChartBarIcon className="w-4 h-4" /> Overall Progress
          </div>
          <div className="text-2xl font-bold text-white">{progressPercent}%</div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-green-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <div className="flex items-center text-indigo-300 text-xs font-medium gap-1.5 mb-1">
            <AcademicCapIcon className="w-4 h-4" /> Skills to Master
          </div>
          <div className="text-2xl font-bold text-white">{skillsToMaster}</div>
          <p className="text-[11px] text-indigo-200/60 mt-1">Priority skill gaps</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <div className="flex items-center text-indigo-300 text-xs font-medium gap-1.5 mb-1">
            <ClockIcon className="w-4 h-4" /> Est. Completion
          </div>
          <div className="text-2xl font-bold text-white">~{estimatedWeeks} Weeks</div>
          <p className="text-[11px] text-indigo-200/60 mt-1">Estimated duration</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <div className="flex items-center text-indigo-300 text-xs font-medium gap-1.5 mb-1">
            <CheckCircleIcon className="w-4 h-4 text-green-400" /> Career Alignment
          </div>
          <div className="text-2xl font-bold text-green-400">Active</div>
          <p className="text-[11px] text-indigo-200/60 mt-1">Based on resume analysis</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
          <input
            type="text"
            placeholder="Search skills, courses, videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/15 rounded-xl text-white placeholder-indigo-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <FilterIcon className="w-4 h-4 text-indigo-300 mr-1 hidden sm:inline" />
          {['all', 'in-progress', 'not-started', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-white text-indigo-950 font-bold shadow'
                  : 'bg-white/10 text-indigo-200 hover:bg-white/20'
              }`}
            >
              {status.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
