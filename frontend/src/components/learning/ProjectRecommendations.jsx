// src/components/learning/ProjectRecommendations.jsx

import React, { useState, useEffect } from 'react'
import { 
  LightningBoltIcon, 
  ClockIcon, 
  BadgeCheckIcon, 
  ExternalLinkIcon, 
  BookmarkIcon,
  RefreshIcon,
  ExclamationCircleIcon
} from '@heroicons/react/outline'
import { ProjectModal } from './ProjectModal'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

export const ProjectRecommendations = ({ project: initialProject, skillName, resumeId, targetRole = 'Software Engineer', onBookmark, onSuccess }) => {
  const [project, setProject] = useState(initialProject)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sync state when parent skill or project prop changes
  useEffect(() => {
    setProject(initialProject)
  }, [initialProject, skillName])

  if (!project) return null

  const handleRegenerate = async () => {
    if (isRegenerating) return
    try {
      setIsRegenerating(true)
      toast.loading('🧠 Formulating authentic real-world crisis with Gemini...', { id: 'crisis-gen' })

      const res = await api.post('/learning/projects/regenerate-challenge', {
        skill_name: skillName,
        target_role: targetRole || 'Software Engineer',
      })

      if (res.data?.project) {
        setProject(res.data.project)
        toast.success(`💥 Fresh Crisis Scenario Generated: ${res.data.project.domain || skillName}!`, { id: 'crisis-gen' })
      }
    } catch (e) {
      console.error('Failed to regenerate challenge:', e)
      toast.error('Could not refresh scenario, using existing project.', { id: 'crisis-gen' })
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-indigo-700/30 space-y-4">
        
        {/* Top Badges & Dynamic Regenerate Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/40 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold rounded-full flex items-center gap-1.5 shadow-sm">
              🚨 {project.domain || 'Real-World Production Incident'}
            </span>
            <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-full flex items-center gap-1">
              <LightningBoltIcon className="w-3.5 h-3.5 text-indigo-400" />
              AI Challenge
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-indigo-200 font-medium flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5 text-indigo-400" />
              {project.estimated_time || '6-8 Hours'}
            </span>

            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-indigo-200 hover:text-white text-xs font-extrabold rounded-lg border border-white/15 transition-all cursor-pointer disabled:opacity-50"
              title="Generate a completely new real-world scenario from another industry domain"
            >
              <RefreshIcon className={`w-3.5 h-3.5 text-amber-300 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Generating...' : '🔄 New Scenario'}</span>
            </button>
          </div>
        </div>

        {/* Project Title */}
        <div>
          <h4 className="text-xl font-extrabold text-white leading-snug tracking-tight">
            {project.title}
          </h4>
        </div>

        {/* Real-World Crisis Incident Box */}
        {project.problem_statement && (
          <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-xs tracking-wide uppercase">
              <ExclamationCircleIcon className="w-4 h-4 text-amber-400" />
              The Production Crisis / User Pain:
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
              {project.problem_statement}
            </p>
          </div>
        )}

        {/* Engineering Mission Description */}
        <p className="text-xs text-indigo-200/90 leading-relaxed">
          <strong>Mission:</strong> {project.description}
        </p>

        {/* Key Learnings List */}
        {project.learnings && project.learnings.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
            <h5 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
              What you will master:
            </h5>
            <div className="flex flex-wrap gap-2">
              {project.learnings.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs text-white bg-white/10 px-2.5 py-1 rounded-lg font-medium">
                  <BadgeCheckIcon className="w-3.5 h-3.5 text-green-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Card Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-indigo-700/40">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Start Mini-Project
            <ExternalLinkIcon className="w-4 h-4" />
          </button>

          {onBookmark && (
            <button
              onClick={() => onBookmark({
                title: project.title,
                resource_type: 'project',
                provider: project.domain || 'Portfolio Project',
                skill_name: skillName
              })}
              className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Bookmark project"
            >
              <BookmarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Project Guide & GitHub Submission Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={project}
        skillName={skillName}
        resumeId={resumeId}
        onSuccess={onSuccess}
      />
    </>
  )
}
