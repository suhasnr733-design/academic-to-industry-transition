// src/components/learning/ProjectRecommendations.jsx

import React, { useState } from 'react'
import { LightningBoltIcon, ClockIcon, BadgeCheckIcon, ExternalLinkIcon, BookmarkIcon } from '@heroicons/react/outline'
import { ProjectModal } from './ProjectModal'

export const ProjectRecommendations = ({ project, skillName, resumeId, onBookmark, onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!project) return null

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-full flex items-center gap-1.5">
            <LightningBoltIcon className="w-4 h-4 text-indigo-400" />
            Recommended Portfolio Project
          </span>
          <span className="text-xs text-indigo-300 font-medium flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" />
            {project.estimated_time || '6-8 Hours'}
          </span>
        </div>

        <h4 className="text-xl font-extrabold text-white mb-2 leading-snug">
          {project.title}
        </h4>

        <p className="text-xs text-indigo-200/80 leading-relaxed mb-4">
          {project.description}
        </p>

        {/* Key Learnings List */}
        {project.learnings && project.learnings.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10 mb-4">
            <h5 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
              What you will master:
            </h5>
            <div className="flex flex-wrap gap-2">
              {project.learnings.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs text-white bg-white/10 px-2.5 py-1 rounded-lg">
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
          >
            Start Mini-Project
            <ExternalLinkIcon className="w-4 h-4" />
          </button>

          {onBookmark && (
            <button
              onClick={() => onBookmark({
                title: project.title,
                resource_type: 'project',
                provider: 'Portfolio Project',
                skill_name: skillName
              })}
              className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
