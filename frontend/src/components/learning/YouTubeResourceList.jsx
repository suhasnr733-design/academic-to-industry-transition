// src/components/learning/YouTubeResourceList.jsx

import React, { useState } from 'react'
import { PlayIcon, BookmarkIcon, ExternalLinkIcon, XIcon } from '@heroicons/react/outline'

export const YouTubeResourceList = ({ videos, skillName, onBookmark }) => {
  const [activeVideoModal, setActiveVideoModal] = useState(null)

  if (!videos || videos.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Recommended YouTube Video Tutorials ({videos.length})
        </h4>
        <span className="text-xs text-gray-500">Contextually selected for your target role</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((vid, idx) => (
          <div 
            key={vid.id || idx}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between"
          >
            {/* Thumbnail Header */}
            <div className="relative aspect-video bg-gray-900 group cursor-pointer" onClick={() => vid.embed_url ? setActiveVideoModal(vid) : window.open(vid.url, '_blank')}>
              <img 
                src={vid.thumbnail} 
                alt={vid.title} 
                className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <PlayIcon className="w-6 h-6 ml-0.5" />
                </div>
              </div>

              {/* Duration badge */}
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                {vid.duration || '20+ mins'}
              </span>

              {vid.badge && (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  {vid.badge}
                </span>
              )}
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-red-600 transition-colors">
                  {vid.title}
                </h5>
                <p className="text-xs text-gray-500 mt-1 font-medium">{vid.channel}</p>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <a
                  href={vid.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Watch on YouTube
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>

                {onBookmark && (
                  <button
                    onClick={() => onBookmark({
                      title: vid.title,
                      url: vid.url,
                      thumbnail: vid.thumbnail,
                      resource_type: 'youtube',
                      provider: vid.channel,
                      skill_name: skillName
                    })}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Bookmark video"
                  >
                    <BookmarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Embed Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm truncate pr-4">{activeVideoModal.title}</h4>
              <button 
                onClick={() => setActiveVideoModal(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={`${activeVideoModal.embed_url}?autoplay=1`}
                title={activeVideoModal.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
