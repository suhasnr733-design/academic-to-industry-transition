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

  // Architecture Defense (Idea 3) State
  const [isDefenseOpen, setIsDefenseOpen] = useState(false)
  const [defenseQuestions, setDefenseQuestions] = useState([])
  const [defenseAnswers, setDefenseAnswers] = useState({})
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isSubmittingDefense, setIsSubmittingDefense] = useState(false)
  const [defenseResult, setDefenseResult] = useState(null)

  if (!isOpen || !project) return null

  const handleStartDefense = async () => {
    setIsDefenseOpen(true)
    if (defenseQuestions.length > 0) return
    
    setIsLoadingQuestions(true)
    try {
      const res = await api.post('/learning/projects/defense-questions', {
        skill_name: skillName,
        problem_statement: project.problem_statement || project.description
      })
      if (res.data?.questions) {
        setDefenseQuestions(res.data.questions)
      }
    } catch (err) {
      toast.error('Could not load defense questions. Please try again.')
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const handleSubmitDefense = async (e) => {
    e.preventDefault()
    setIsSubmittingDefense(true)
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const urlResumeId = searchParams.get('resume_id')
      const targetResumeId = resumeId || (urlResumeId ? Number(urlResumeId) : null) || 1

      const res = await api.post('/learning/projects/submit-defense', {
        resume_id: targetResumeId,
        skill_name: skillName,
        problem_statement: project.problem_statement || project.description,
        questions: defenseQuestions,
        user_answers: defenseAnswers
      })
      if (res.data?.defense_result) {
        setDefenseResult(res.data.defense_result)
        toast.success('Architecture defense evaluated by Bar Raiser!')
      }
    } catch (err) {
      toast.error('Failed to evaluate architecture defense.')
    } finally {
      setIsSubmittingDefense(false)
    }
  }

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
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 mt-4 animate-fadeIn ${
            evaluationResult.is_problem_solved 
              ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100' 
              : 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40 text-amber-950 dark:text-amber-100'
          }`}>
            
            {/* Header & Score */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                {evaluationResult.is_problem_solved ? (
                  <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <ExclamationCircleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">
                    {evaluationResult.is_problem_solved ? '🟢 Production Crisis Solved' : '⚠️ Code Revision Required'}
                  </span>
                  {evaluationResult.evaluated_files && evaluationResult.evaluated_files.length > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Evaluated: {evaluationResult.evaluated_files.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Score</span>
                <span className="text-lg font-black px-2.5 py-0.5 rounded-lg bg-white dark:bg-gray-800 shadow-xs">
                  {evaluationResult.solution_score}%
                </span>
              </div>
            </div>

            {/* Executive Assessment */}
            <div className="bg-white/60 dark:bg-white/5 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
                Staff Incident Commander Assessment:
              </h5>
              <p className="text-xs leading-relaxed font-medium text-slate-800 dark:text-gray-200">
                {evaluationResult.engineering_feedback}
              </p>
            </div>

            {/* Line-by-Line Criteria Review with Code Evidence */}
            {evaluationResult.criteria_review && evaluationResult.criteria_review.length > 0 ? (
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                  Acceptance Criteria Verification:
                </h5>
                <div className="space-y-2">
                  {evaluationResult.criteria_review.map((item, i) => (
                    <div key={i} className="p-3 bg-white/70 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {item.status === 'passed' ? '✅' : '❌'} {item.criterion}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                          item.status === 'passed' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      {item.evidence && (
                        <div className="font-mono text-[11px] bg-slate-100 dark:bg-black/40 px-2 py-1 rounded text-indigo-900 dark:text-amber-200/90 truncate">
                          Evidence: {item.evidence}
                        </div>
                      )}
                      {item.comment && (
                        <p className="text-[11px] text-slate-600 dark:text-gray-400">{item.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : evaluationResult.passed_criteria && evaluationResult.passed_criteria.length > 0 ? (
              <div className="pt-1">
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
            ) : null}

            {/* Git Commit Progression & Authenticity Audit Card */}
            {evaluationResult.commit_audit && evaluationResult.commit_audit.total_commits > 0 && (
              <div className="bg-slate-100/90 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <span>🛡️ Git Workflow:</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      evaluationResult.commit_audit.is_authentic 
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                    }`}>
                      {evaluationResult.commit_audit.is_authentic ? '✓ Verified Progression' : '⚠️ Single-Commit Dump'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    Progression: {evaluationResult.commit_audit.progression_score}%
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {evaluationResult.commit_audit.feedback}
                </p>

                {/* Hygiene & Timespan Mini-Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                  {evaluationResult.commit_audit.time_span && evaluationResult.commit_audit.time_span !== 'N/A' && (
                    <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 border border-slate-200 dark:border-white/5">
                      ⏱️ Timespan: {evaluationResult.commit_audit.time_span}
                    </span>
                  )}
                  {evaluationResult.commit_audit.conventional_commits_count > 0 && (
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-1 border border-purple-200 dark:border-purple-800/40">
                      ✨ {evaluationResult.commit_audit.conventional_commits_count} Conventional Commits
                    </span>
                  )}
                  {evaluationResult.commit_audit.rapid_burst_detected && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1 border border-amber-200 dark:border-amber-800/40">
                      ⚡ Rapid Burst Detected
                    </span>
                  )}
                </div>

                {evaluationResult.commit_audit.recent_commits && evaluationResult.commit_audit.recent_commits.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                      Recent Commits ({evaluationResult.commit_audit.total_commits} Total):
                    </span>
                    <div className="space-y-1">
                      {evaluationResult.commit_audit.recent_commits.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-black/20 px-2 py-0.5 rounded border border-slate-200/60 dark:border-white/5">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">{c.sha}</span>
                          <span className="truncate">{c.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Staff Engineer Recommendations */}
            {evaluationResult.staff_engineer_tips && evaluationResult.staff_engineer_tips.length > 0 && (
              <div className="bg-indigo-50/80 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-500/30 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 font-bold text-[11px] uppercase tracking-wider">
                  <SparklesIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  Staff Engineer Recommendations:
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-indigo-950 dark:text-indigo-100/90 font-medium">
                  {evaluationResult.staff_engineer_tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Idea 3: Architecture Defense Mock Interview Section */}
            {evaluationResult.is_problem_solved && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-3">
                {!isDefenseOpen ? (
                  <button
                    type="button"
                    onClick={handleStartDefense}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01]"
                  >
                    <ShieldCheckIcon className="w-4 h-4 text-amber-300" />
                    Round 2: Defend Your Architecture (Mock Tech Interview)
                  </button>
                ) : (
                  <div className="bg-white/80 dark:bg-slate-950/60 border border-indigo-300 dark:border-indigo-500/40 rounded-2xl p-4 space-y-4 shadow-sm animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Staff Bar Raiser Architecture Defense
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">Technical Interview</span>
                    </div>

                    {/* Loading State */}
                    {isLoadingQuestions && (
                      <div className="text-center py-6 text-xs text-indigo-600 dark:text-indigo-300 animate-pulse font-medium">
                        Generating Staff-level challenge questions based on your code...
                      </div>
                    )}

                    {/* Defense Questions & Input Form */}
                    {!isLoadingQuestions && defenseQuestions.length > 0 && !defenseResult && (
                      <form onSubmit={handleSubmitDefense} className="space-y-4">
                        {defenseQuestions.map((q) => (
                          <div key={q.id} className="space-y-1.5 bg-slate-50/80 dark:bg-black/20 p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                Q{q.id}: {q.question}
                              </span>
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 shrink-0">
                                {q.category}
                              </span>
                            </div>
                            {q.context_hint && (
                              <p className="text-[10px] text-slate-500 dark:text-gray-400 italic">💡 Hint: {q.context_hint}</p>
                            )}
                            <textarea
                              rows={3}
                              required
                              placeholder="Explain your architectural rationale, trade-offs, and runtime behavior..."
                              value={defenseAnswers[q.id] || ''}
                              onChange={(e) => setDefenseAnswers({ ...defenseAnswers, [q.id]: e.target.value })}
                              className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        ))}

                        <button
                          type="submit"
                          disabled={isSubmittingDefense}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                        >
                          {isSubmittingDefense ? (
                            <>
                              <RefreshIcon className="w-4 h-4 animate-spin" />
                              Bar Raiser Evaluating Defense...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="w-4 h-4 text-amber-300" />
                              Submit Architecture Defense to Bar Raiser
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Defense Evaluation Scorecard */}
                    {defenseResult && (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-100/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/40">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-indigo-900 dark:text-indigo-300 block">Verdict</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">{defenseResult.verdict}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-indigo-900 dark:text-indigo-300 block">Defense Score</span>
                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{defenseResult.defense_score}%</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-gray-200 leading-relaxed bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 font-medium">
                          {defenseResult.overall_coaching}
                        </p>

                        {/* Question Breakdown & Ideal Talking Points */}
                        <div className="space-y-2">
                          {defenseResult.question_evaluations?.map((evalItem, idx) => (
                            <div key={idx} className="p-3 bg-slate-50/90 dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5 text-xs">
                              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                                <span>Question {evalItem.question_id} Defense</span>
                                <span className="text-indigo-600 dark:text-indigo-300">{evalItem.score}%</span>
                              </div>
                              <p className="text-[11px] text-slate-700 dark:text-gray-300">{evalItem.critique}</p>
                              {evalItem.ideal_talking_points && (
                                <div className="pt-1.5 text-[10px] text-indigo-950 dark:text-indigo-200">
                                  <span className="font-bold block text-amber-600 dark:text-amber-300">💡 Principal Engineer Talking Points:</span>
                                  <ul className="list-disc list-inside space-y-0.5 pt-0.5 font-medium">
                                    {evalItem.ideal_talking_points.map((pt, pIdx) => (
                                      <li key={pIdx}>{pt}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
