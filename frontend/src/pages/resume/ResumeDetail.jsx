// src/pages/resume/ResumeDetail.jsx

import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResume } from '../../hooks/useResume'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  ArrowLeftIcon, 
  ExternalLinkIcon, 
  CheckCircleIcon, 
  ExclamationIcon, 
  AcademicCapIcon, 
  SparklesIcon, 
  DocumentTextIcon 
} from '@heroicons/react/outline'

export const ResumeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getResume, deleteResume, isLoading } = useResume()
  
  const [resume, setResume] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`swr_resume_detail_${id}`)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!id) return
    getResume(id)
      .then(data => setResume(data))
      .catch(err => setFetchError(err.message || 'Failed to load resume details'))
  }, [id, getResume])

  const candidateName = useMemo(() => {
    if (resume?.candidate_name) return resume.candidate_name
    if (user?.full_name) return user.full_name
    return 'Candidate Resume'
  }, [resume, user])

  if (isLoading && !resume) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  if (fetchError || !resume) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h3 className="text-xl font-bold text-white">Resume Not Found</h3>
        <p className="text-gray-400 mt-2 text-sm">{fetchError || 'Could not find the requested resume.'}</p>
        <Button className="mt-6 text-sm" onClick={() => navigate('/resume')}>Back to Resumes</Button>
      </div>
    )
  }

  const breakdown = resume.ats_breakdown || {}
  const links = resume.links || {}

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <button onClick={() => navigate('/resume')} className="flex items-center text-gray-400 hover:text-white text-sm font-medium transition-colors">
        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back to Resumes
      </button>

      {/* Header Card */}
      <div className="bg-[#111827] rounded-2xl shadow-xl border border-gray-800/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{candidateName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {breakdown.tier || 'Verified Profile'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {resume.education?.[0]?.degree || 'B.E. Candidate'} • {resume.education?.[0]?.institution || 'Engineering Institution'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/skills/${resume.id}`)}>
              Skill Gap Analysis
            </Button>
            <Button variant="danger" size="sm" onClick={async () => {
              if (window.confirm('Delete this resume?')) { await deleteResume(id); navigate('/resume'); }
            }}>
              Delete
            </Button>
          </div>
        </div>

        {/* Multi-Domain Platform Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-800">
          {links.github && (
            <a href={links.github.startsWith('http') ? links.github : `https://${links.github}`} target="_blank" rel="noreferrer"
               className="inline-flex items-center px-3 py-1 bg-[#1E293B] border border-gray-700 text-gray-200 rounded-lg text-xs font-medium hover:bg-gray-800 hover:text-white transition-colors">
              GitHub <ExternalLinkIcon className="h-3.5 w-3.5 ml-1" />
            </a>
          )}
          {links.linkedin && (
            <a href={links.linkedin.startsWith('http') ? links.linkedin : `https://${links.linkedin}`} target="_blank" rel="noreferrer"
               className="inline-flex items-center px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors">
              LinkedIn <ExternalLinkIcon className="h-3.5 w-3.5 ml-1" />
            </a>
          )}
          {links.leetcode && (
            <a href={links.leetcode.startsWith('http') ? links.leetcode : `https://${links.leetcode}`} target="_blank" rel="noreferrer"
               className="inline-flex items-center px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors">
              LeetCode <ExternalLinkIcon className="h-3.5 w-3.5 ml-1" />
            </a>
          )}
          {links.kaggle && (
            <a href={links.kaggle.startsWith('http') ? links.kaggle : `https://${links.kaggle}`} target="_blank" rel="noreferrer"
               className="inline-flex items-center px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium hover:bg-cyan-500/20 transition-colors">
              Kaggle <ExternalLinkIcon className="h-3.5 w-3.5 ml-1" />
            </a>
          )}
          {links.portfolio && (
            <a href={links.portfolio.startsWith('http') ? links.portfolio : `https://${links.portfolio}`} target="_blank" rel="noreferrer"
               className="inline-flex items-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
              Live Portfolio <ExternalLinkIcon className="h-3.5 w-3.5 ml-1" />
            </a>
          )}
        </div>
      </div>

      {/* Main Grid: Score Gauge vs Actionable Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: ATS Score & 11-Pillar Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111827] rounded-2xl shadow-xl border border-gray-800/80 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h3 className="text-base font-bold text-white">ATS Employability Readiness</h3>
              <p className="text-xs text-gray-400">11-Pillar Calibrated Evaluation</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-indigo-400">{resume.employability_score || 0}%</span>
              <p className="text-[11px] font-semibold text-emerald-400">Top Candidate Match</p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3 pt-2">
            {[
              { label: 'Technical Skills Depth', score: breakdown.skills_score || 0, max: 18 },
              { label: 'Hands-on Projects & Stack', score: breakdown.projects_score || 0, max: 15 },
              { label: 'Google XYZ Impact Metrics', score: breakdown.impact_metrics_score || 0, max: 10 },
              { label: 'Digital Footprint & Profiles', score: breakdown.digital_footprint_score || 0, max: 8 },
              { label: 'Work & Internships', score: breakdown.experience_score || 0, max: 10 },
              { label: 'Academic & Branch Alignment', score: breakdown.education_score || 0, max: 10 },
              { label: 'Hackathons & Competitions', score: breakdown.achievements_score || 0, max: 5 },
              { label: 'Industry Certifications', score: breakdown.certifications_score || 0, max: 4 },
              { label: 'Personal Info & Hygiene', score: breakdown.personal_info_score || 0, max: 5 },
            ].map((p, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-gray-300">
                  <span>{p.label}</span>
                  <span className="text-gray-400">{p.score} / {p.max} pts</span>
                </div>
                <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min((p.score / p.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actionable ATS Suggestions & Checklist (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111827] rounded-2xl shadow-xl border border-gray-800/80 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">ATS Optimization Checklist</h3>
            <p className="text-xs text-gray-400 mb-4">Complete missing steps to reach 95%+ readiness</p>

            <div className="space-y-2.5">
              {breakdown.missing_elements && breakdown.missing_elements.length > 0 ? (
                breakdown.missing_elements.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 font-medium">
                    <ExclamationIcon className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                  <span>All major ATS criteria successfully met!</span>
                </div>
              )}
            </div>
          </div>

          {/* Target Role Benchmarks */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recommended Career Paths</h4>
            <div className="flex flex-wrap gap-1.5">
              {resume.recommended_roles?.map((role, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-medium">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Cards: Achievements & Research Publications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hackathons & Honors */}
        <div className="bg-[#111827] rounded-2xl shadow-xl border border-gray-800/80 p-6">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Hackathons & Competitive Honors</h3>
          </div>
          {resume.achievements && resume.achievements.length > 0 ? (
            <ul className="space-y-2 text-xs text-gray-300">
              {resume.achievements.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">No hackathon or competition records detected</p>
          )}
        </div>

        {/* Research Publications & Patents */}
        <div className="bg-[#111827] rounded-2xl shadow-xl border border-gray-800/80 p-6">
          <div className="flex items-center gap-2 mb-3">
            <DocumentTextIcon className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Research & Academic Publications</h3>
          </div>
          {resume.publications && resume.publications.length > 0 ? (
            <ul className="space-y-2 text-xs text-gray-300">
              {resume.publications.map((paper, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
                  <span>{paper}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">No IEEE/academic publications indexed</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumeDetail