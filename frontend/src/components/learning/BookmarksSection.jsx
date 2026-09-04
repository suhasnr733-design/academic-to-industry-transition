// src/components/learning/BookmarksSection.jsx

import React from 'react'
import { BookmarkIcon, TrashIcon, ExternalLinkIcon } from '@heroicons/react/outline'

export const BookmarksSection = ({ bookmarks, onDeleteBookmark }) => {
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="bg-[#111827] rounded-3xl border border-gray-800/90 p-8 text-center space-y-3 shadow-2xl">
        <BookmarkIcon className="w-12 h-12 text-gray-600 mx-auto" />
        <h4 className="font-bold text-base text-white">No saved resources yet</h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Bookmark YouTube videos, courses, projects, and articles while studying to quickly reference them anytime.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#111827] rounded-3xl border border-gray-800/90 p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <BookmarkIcon className="w-5 h-5 text-indigo-400" />
          My Saved Resources ({bookmarks.length})
        </h3>
        <span className="text-xs text-gray-400 font-semibold">Persisted per resume</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="p-4 rounded-2xl border border-gray-800 hover:border-gray-700 bg-[#1E293B] flex items-start justify-between gap-3 group transition-all">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {bm.resource_type} • {bm.skill_name}
              </span>
              <h5 className="font-bold text-xs text-white line-clamp-2 leading-snug">
                {bm.title}
              </h5>
              {bm.url && (
                <a
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Open Resource
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              onClick={() => onDeleteBookmark(bm.id)}
              className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
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
