// src/components/learning/BookmarksSection.jsx

import React from 'react'
import { BookmarkIcon, TrashIcon, ExternalLinkIcon } from '@heroicons/react/outline'

export const BookmarksSection = ({ bookmarks, onDeleteBookmark }) => {
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
        <BookmarkIcon className="w-12 h-12 text-gray-300 mx-auto" />
        <h4 className="font-bold text-base text-gray-900">No saved resources yet</h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Bookmark YouTube videos, courses, projects, and articles while studying to quickly reference them anytime.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
          <BookmarkIcon className="w-5 h-5 text-indigo-600" />
          My Saved Resources ({bookmarks.length})
        </h3>
        <span className="text-xs text-gray-500 font-medium">Persisted per resume</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="p-3.5 rounded-xl border border-gray-200 hover:border-indigo-200 bg-gray-50/50 flex items-start justify-between gap-3 group">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {bm.resource_type} • {bm.skill_name}
              </span>
              <h5 className="font-bold text-xs text-gray-900 line-clamp-2 leading-snug">
                {bm.title}
              </h5>
              {bm.url && (
                <a
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  Open Resource
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              onClick={() => onDeleteBookmark(bm.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove bookmark"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
