// frontend/src/components/learning/ProjectModal.jsx

import React, { useState } from 'react'
import { 
  XIcon, 
  ExternalLinkIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  SparklesIcon, 
  LightningBoltIcon,
  RefreshIcon,
  BadgeCheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/outline'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

export const ProjectModal = ({ isOpen, onClose, project, skillName, resumeId, onSuccess }) => {
  const [repoUrl, setRepoUrl] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState(null)

  if (!isOpen || !project) return null

  const handleEvaluateSolution = async (e) => {
    e.preventDefault()
    if (!repoUrl.startsWith('http://') && !repoUrl.startsWith('https://')) {
      toast.error('Please enter a valid GitHub repository URL (e.g. https://github.com/user/repo)')
      return
    }

    try {
      setIsEvaluating(true)
      setEvaluationResult(null)

      const searchParams = new URLSearchParams(window.location.search)
      const urlResumeId = searchParams.get('resume_id')
      const targetResumeId = resumeId || (urlResumeId ? Number(urlResumeId) : null) || 1

      const res = await api.post('/learning/projects/evaluate-solution', {
        resume_id: targetResumeId,
        skill_name: skillName,
        github_url: repoUrl,
        problem_statement: project.problem_statement || project.description,
        criteria: project.criteria || project.learnings || []
      })

      const evalData = res.data.evaluation
      setEvaluationResult(evalData)

      if (evalData.is_problem_solved) {
        toast.success(`🎉 Problem Solved! Verified score: ${evalData.solution_score}%`)
        if (onSuccess) onSuccess(skillName, 'build', true)
      } else {
        toast.error(`Solution criteria not fully met. Score: ${evalData.solution_score}%`)
      }

    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to evaluate repository')
    } finally {
      setIsEvaluating(false)
    }
  }

  const starterUrl = project.github_url || project.search_url || `https://github.com/search?q=${encodeURIComponent(skillName + ' starter template')}&type=repositories`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border border-slate-100 dark:border-gray-800 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200/80 shrink-0">
            <LightningBoltIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                Real-World Industry Problem Challenge
              </span>
              <span className="px-2 py-0.2 text-[9px] font-bold bg-purple-100 text-purple-800 rounded-md">
                AI Evaluated
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
              {project.title}
            </h3>
          </div>
        </div>

        {/* Problem Statement Card */}
        {project.problem_statement && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-1">
            <h4 className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <ExclamationCircleIcon className="w-4 h-4 text-amber-600" />
              Real-World Industry Problem Statement:
            </h4>
            <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
              {project.problem_statement}
            </p>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {project.description}
        </p>

        {/* Acceptance Criteria Checklist */}
        {(project.criteria || project.learnings) && (
          <div className="bg-slate-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-gray-700 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
              Required Acceptance Criteria to Pass:
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {(project.criteria || project.learnings).map((criterion, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-normal">
                  <BadgeCheckIcon className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Open Starter Code Button */}
        <div className="flex items-center justify-between p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900">
          <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            Need a starter template or reference code?
          </span>
          <a
            href={starterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            Open Starter Code <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Submission & AI Evaluation Form */}
        <form onSubmit={handleEvaluateSolution} className="pt-2 space-y-3">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Submit Your Completed Repository URL for AI Evaluation:
          </label>
          <input
            type="url"
            placeholder="https://github.com/your-username/my-project-repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
            required
          />
          <button
            type="submit"
            disabled={isEvaluating}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isEvaluating ? (
              <>
                <RefreshIcon className="w-4 h-4 animate-spin" />
                AI Ingesting Codebase & Evaluating Solution...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Submit Repo & Run AI Solution Evaluation
              </>
            )}
          </button>
        </form>

        {/* AI Code Review Evaluation Results Banner */}
        {evaluationResult && (
          <div className={`p-4 rounded-2xl border space-y-2 mt-4 animate-fadeIn ${
            evaluationResult.is_problem_solved 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200' 
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {evaluationResult.is_problem_solved ? (
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ExclamationCircleIcon className="w-5 h-5 text-amber-600" />
                )}
                {evaluationResult.is_problem_solved ? '🟢 Problem Solved' : '⚠️ Revision Required'}
              </span>
              <span className="text-sm font-black px-2.5 py-0.5 rounded-md bg-white/80 dark:bg-gray-800 shadow-2xs">
                Score: {evaluationResult.solution_score}%
              </span>
            </div>

            <p className="text-xs leading-relaxed font-medium pt-1">
              {evaluationResult.engineering_feedback}
            </p>

            {evaluationResult.passed_criteria && evaluationResult.passed_criteria.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-emerald-800 dark:text-emerald-300">
                  Passed Acceptance Criteria:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {evaluationResult.passed_criteria.map((c, i) => (
                    <span key={i} className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
