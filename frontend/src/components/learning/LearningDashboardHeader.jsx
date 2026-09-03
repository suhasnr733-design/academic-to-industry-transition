import React, { useState } from 'react'
import { SkillBrandLogo } from './SkillBrandLogo'
import {
  AcademicCapIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  SearchIcon,
  FilterIcon,
  SparklesIcon,
  XIcon
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
  onOpenAiAssistant,
  resumes = [],
  activeResumeId = null,
  onSelectResume = () => { },
  selectedLanguage = 'en',
  onSelectLanguage = () => { },
  targetDate = '',
  onSelectTargetDate = () => { },
  daysRemaining = null,
  paceLabel = null,
  skills = [],
  matchingSkills = [],
  missingSkills = [],
  onSelectSkill = () => { }
}) => {
  const [isPaceModalOpen, setIsPaceModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
  const [isSkillGapsModalOpen, setIsSkillGapsModalOpen] = useState(false)
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [isAlignmentModalOpen, setIsAlignmentModalOpen] = useState(false)

  const targetRoleOptions = [
    'Software Engineer',
    'Data Analyst',
    'Full Stack Engineer',
    'Backend Engineer',
    'Machine Learning Engineer',
    'Frontend Developer',
    'DevOps Engineer'
  ]

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl mb-8 border border-indigo-700/30 relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Header Left Info */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 rounded-full text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 shadow-sm"
              title="Click to view target role details"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-indigo-300" />
              Target Role: {targetRole || 'N/A'} ℹ️
            </button>
            <button
              onClick={() => setIsMatchModalOpen(true)}
              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-sm"
              title="Click to view Skill Match breakdown"
            >
              {matchPercentage}% Skill Match ℹ️
            </button>
            <button
              onClick={() => setIsPaceModalOpen(true)}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer transform hover:scale-105 shadow-sm"
              title="Click to view full pace breakdown"
            >
              ⏰ {daysRemaining !== null && daysRemaining !== undefined ? `${daysRemaining} Days Remaining` : 'Target Schedule'} ({paceLabel || 'Crash Course Pace'}) ℹ️
            </button>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Your Personalized Learning Roadmap
          </h1>
          <p className="text-indigo-200/80 text-sm md:text-base leading-relaxed">
            Tailored career preparation path derived from your active resume analysis. Complete priority skill gaps to reach full industry readiness.
          </p>

          {/* Active Resume, Language & Target Date Selectors */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {resumes && resumes.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/15">
                <span className="text-xs font-extrabold text-indigo-200 pl-2">Active Resume:</span>
                <select
                  value={activeResumeId || ''}
                  onChange={(e) => onSelectResume(Number(e.target.value))}
                  className="bg-indigo-950/80 text-white font-bold text-xs rounded-lg px-2.5 py-1.5 border border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id} className="text-gray-900 font-semibold">
                      📄 {r.filename} {r.target_role ? `— ${r.target_role}` : (r.recommended_roles && r.recommended_roles[0] ? `— ${r.recommended_roles[0]}` : '')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/15">
              <span className="text-xs font-extrabold text-indigo-200 pl-2">Target Interview Date:</span>
              <input
                type="date"
                value={targetDate || ''}
                onChange={(e) => onSelectTargetDate(e.target.value)}
                className="bg-indigo-950/80 text-white font-bold text-xs rounded-lg px-2.5 py-1.5 border border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/15">
              <span className="text-xs font-extrabold text-indigo-200 pl-2">Learning Language:</span>
              <select
                value={selectedLanguage || 'en'}
                onChange={(e) => onSelectLanguage(e.target.value)}
                className="bg-indigo-950/80 text-white font-bold text-xs rounded-lg px-2.5 py-1.5 border border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              >
                <option value="en" className="text-gray-900 font-semibold">🌐 English</option>
                <option value="hi" className="text-gray-900 font-semibold">🇮🇳 Hindi</option>
                <option value="en+hi" className="text-gray-900 font-semibold">🗣️ English + Hindi</option>
              </select>
            </div>
          </div>
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

      {/* Metrics Row (All Clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-indigo-700/40">
        {/* Metric 1: Overall Progress */}
        <div
          onClick={() => setIsProgressModalOpen(true)}
          className="bg-white/5 hover:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 cursor-pointer transition-all hover:scale-[1.02] shadow-md group"
          title="Click to view overall progress breakdown"
        >
          <div className="flex items-center justify-between text-indigo-300 text-xs font-medium gap-1.5 mb-1">
            <span className="flex items-center gap-1.5"><ChartBarIcon className="w-4 h-4" /> Overall Progress</span>
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-indigo-200 font-bold">Details ➔</span>
          </div>
          <div className="text-2xl font-bold text-white">{progressPercent}%</div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
            <div
              className="bg-gradient-to-r from-blue-400 to-green-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Skills to Master */}
        <div
          onClick={() => setIsSkillGapsModalOpen(true)}
          className="bg-white/5 hover:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 cursor-pointer transition-all hover:scale-[1.02] shadow-md group"
          title="Click to view all priority skill gaps"
        >
          <div className="flex items-center justify-between text-indigo-300 text-xs font-medium gap-1.5 mb-1">
            <span className="flex items-center gap-1.5"><AcademicCapIcon className="w-4 h-4" /> Skills to Master</span>
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-300 font-bold">View Skills ➔</span>
          </div>
          <div className="text-2xl font-bold text-white">{skillsToMaster}</div>
          <p className="text-[11px] text-indigo-200/60 mt-1">Priority skill gaps</p>
        </div>

        {/* Metric 3: Est. Completion */}
        <div
          onClick={() => setIsDurationModalOpen(true)}
          className="bg-white/5 hover:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 cursor-pointer transition-all hover:scale-[1.02] shadow-md group"
          title="Click to view estimated duration breakdown"
        >
          <div className="flex items-center justify-between text-indigo-300 text-xs font-medium gap-1.5 mb-1">
            <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4" /> Est. Completion</span>
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-indigo-200 font-bold">Details ➔</span>
          </div>
          <div className="text-2xl font-bold text-white">~{estimatedWeeks} Weeks</div>
          <p className="text-[11px] text-indigo-200/60 mt-1">Estimated duration</p>
        </div>

        {/* Metric 4: Career Alignment */}
        <div
          onClick={() => setIsAlignmentModalOpen(true)}
          className="bg-white/5 hover:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 cursor-pointer transition-all hover:scale-[1.02] shadow-md group"
          title="Click to view Career Alignment Report"
        >
          <div className="flex items-center justify-between text-indigo-300 text-xs font-medium gap-1.5 mb-1">
            <span className="flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4 text-green-400" /> Career Alignment</span>
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-green-300 font-bold">Report ➔</span>
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

        {/* Status Filters & AI Assistant Trigger */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <FilterIcon className="w-4 h-4 text-indigo-300 mr-1 hidden sm:inline" />
          {['all', 'in-progress', 'not-started', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${filterStatus === status
                  ? 'bg-white text-indigo-950 font-bold shadow'
                  : 'bg-white/10 text-indigo-200 hover:bg-white/20'
                }`}
            >
              {status.replace('-', ' ')}
            </button>
          ))}
          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-indigo-500/40 transition-all hover:scale-105 cursor-pointer border border-indigo-300/40 ml-1 whitespace-nowrap"
              title="Open AI Study Assistant"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Assistant</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. Target Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-indigo-100 space-y-5 relative">
            <button
              onClick={() => setIsRoleModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100">
                ✨
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">Target Role Setup</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">Active Role: {targetRole}</h3>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Your personalized learning roadmap is customized specifically for <strong>{targetRole}</strong> requirements.
            </p>

            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                Target Roles for Career Roadmap:
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {targetRoleOptions.map(role => (
                  <div
                    key={role}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                      role.toLowerCase() === (targetRole || '').toLowerCase()
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <span>🎯 {role}</span>
                    {role.toLowerCase() === (targetRole || '').toLowerCase() && (
                      <span className="text-indigo-600 text-xs font-extrabold">Active</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsRoleModalOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Close Target Role Details
            </button>
          </div>
        </div>
      )}

      {/* 2. Skill Match Breakdown Modal */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-indigo-100 space-y-5 relative">
            <button
              onClick={() => setIsMatchModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-xl border border-green-100">
                🎯
              </div>
              <div>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded">Career Readiness</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">{matchPercentage}% Skill Match Breakdown</h3>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full" style={{ width: `${matchPercentage}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                <span className="font-extrabold text-green-800 block mb-1">✓ Matched Skills ({matchingSkills.length}):</span>
                <p className="text-green-700 font-medium">
                  {matchingSkills.length > 0 ? matchingSkills.join(', ') : 'Resume skills detected'}
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="font-extrabold text-amber-800 block mb-1">⚡ Skill Gaps ({missingSkills.length}):</span>
                <p className="text-amber-700 font-medium">
                  {missingSkills.length > 0 ? missingSkills.join(', ') : 'No missing skills'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMatchModalOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Close Match Report
            </button>
          </div>
        </div>
      )}

      {/* 3. Skills to Master (8 Skill Gaps) Breakdown Modal */}
      {isSkillGapsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-indigo-100 space-y-5 relative">
            <button
              onClick={() => setIsSkillGapsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl border border-amber-100">
                🎓
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">Priority Skill Gaps</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">{skillsToMaster} Skills to Master</h3>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              These <strong>{skillsToMaster} priority skills</strong> were identified from your target role analysis. Click <strong>Start Learning</strong> on any skill to jump directly to its videos & practice workspace!
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {skills && skills.length > 0 ? (
                skills.map((s, i) => (
                  <div key={s.id || i} className="p-3 bg-gray-50 hover:bg-indigo-50/50 rounded-xl border border-gray-200 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                        <SkillBrandLogo skillName={s.skill_name} className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-gray-900 block">{i + 1}. {s.skill_name}</span>
                        <span className="text-[10px] text-gray-500">{s.category || 'Technical Skill'} • Priority: {s.priority}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsSkillGapsModalOpen(false)
                        onSelectSkill(s.id)
                        setTimeout(() => {
                          const el = document.getElementById('active-skill-card') || document.getElementById('skills-section')
                          if (el) el.scrollIntoView({ behavior: 'smooth' })
                        }, 100)
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Start Skill ➔
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No skill gaps detected.</p>
              )}
            </div>

            <button
              onClick={() => setIsSkillGapsModalOpen(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close Skills List
            </button>
          </div>
        </div>
      )}

      {/* 4. Est. Completion Duration Modal */}
      {isDurationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-indigo-100 space-y-5 relative">
            <button
              onClick={() => setIsDurationModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100">
                ⏱️
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">Duration Estimate</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">~{estimatedWeeks} Weeks Recommended</h3>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Based on <strong>{skillsToMaster} missing skills</strong>, completing your roadmap at a standard pace (30-45 mins per day) will take approximately <strong>~{estimatedWeeks} weeks</strong>.
            </p>

            <button
              onClick={() => setIsDurationModalOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Close Duration Details
            </button>
          </div>
        </div>
      )}

      {/* 5. Overall Progress Modal */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-indigo-100 space-y-5 relative">
            <button
              onClick={() => setIsProgressModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-100">
                📊
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">Overall Progress</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">{progressPercent}% Roadmap Completed</h3>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>

            <button
              onClick={() => setIsProgressModalOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Close Progress Details
            </button>
          </div>
        </div>
      )}

      {/* 6. Career Alignment Modal */}
      {isAlignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-indigo-100 space-y-5 relative">
            <button
              onClick={() => setIsAlignmentModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-xl border border-green-100">
                ✅
              </div>
              <div>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded">Career Alignment Report</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">Status: Active Alignment</h3>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Your active resume is synchronized with current <strong>{targetRole}</strong> hiring requirements across top technology companies.
            </p>

            <button
              onClick={() => setIsAlignmentModalOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Close Alignment Report
            </button>
          </div>
        </div>
      )}

      {/* 7. Pace Breakdown Explanation Modal */}
      {isPaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn text-gray-900">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-indigo-100 space-y-5 relative">
            <button
              onClick={() => setIsPaceModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl border border-amber-200">
                ⚡
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  {paceLabel || 'Crash Course Pace'}
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  Study Pace Breakdown
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs text-gray-700">
              <div className="flex items-center justify-between font-bold border-b border-gray-200 pb-2">
                <span>Target Interview Date:</span>
                <span className="text-indigo-600">{targetDate || 'Not Set'}</span>
              </div>
              <div className="flex items-center justify-between font-bold border-b border-gray-200 pb-2">
                <span>Time Remaining:</span>
                <span className="text-amber-600">{daysRemaining !== null ? `${daysRemaining} Days` : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>Priority Skills to Master:</span>
                <span className="text-indigo-600">{skillsToMaster} Skills</span>
              </div>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-gray-600">
              <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px]">
                Understanding Pace Schedules:
              </h4>
              <ul className="space-y-2 pt-1">
                <li className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-900 font-medium">
                  <strong className="block text-red-700">⚡ Crash Course Pace (≥ 60 mins/day)</strong>
                  Triggered when target date is under 3 weeks away (≤ 21 days remaining).
                </li>
                <li className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 font-medium">
                  <strong className="block text-amber-700">🎯 Standard Pace (35-55 mins/day)</strong>
                  Balanced pace for deadlines between 3 to 8 weeks away (22 to 60 days remaining).
                </li>
                <li className="p-2.5 rounded-xl bg-green-50 border border-green-100 text-green-900 font-medium">
                  <strong className="block text-green-700">☕ Relaxed Pace (15-30 mins/day)</strong>
                  Comfortable pace for target dates beyond 8 weeks away (&gt; 60 days remaining).
                </li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsPaceModalOpen(false)
                  const el = document.getElementById('daily-goal')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Go to Today's Goal Schedule ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
