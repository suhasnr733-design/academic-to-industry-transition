// src/components/learning/RecommendedResourceHighlight.jsx

import React from 'react'
import { SparklesIcon, ExternalLinkIcon, BookmarkIcon } from '@heroicons/react/outline'

export const RecommendedResourceHighlight = ({ course, skillName, targetRole, onBookmark }) => {
  if (!course) return null

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 border-2 border-amber-400/40 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
              <SparklesIcon className="w-3.5 h-3.5" />
              {course.badge || '⭐ Highly Recommended'}
            </span>
            <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
              {course.provider || 'Coursera'}
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-gray-900 leading-snug">
            {course.title}
          </h3>

          {/* Rationale Box */}
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-amber-200/60 mt-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
              Why this resource was selected for you:
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed">
              {course.why_recommended || `Identified as a critical skill gap in ${skillName} required for your ${targetRole} target role.`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0">
          <a
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow transition-all hover:shadow-md"
          >
            Start Course
            <ExternalLinkIcon className="w-4 h-4" />
          </a>

          {onBookmark && (
            <button
              onClick={() => onBookmark({
                title: course.title,
                url: course.url,
                resource_type: 'course',
                provider: course.provider,
                skill_name: skillName
              })}
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-amber-700 bg-white/70 hover:bg-white px-3 py-1.5 rounded-lg border border-amber-200"
            >
              <BookmarkIcon className="w-4 h-4" /> Save Resource
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
