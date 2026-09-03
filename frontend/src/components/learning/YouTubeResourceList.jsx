// src/components/learning/YouTubeResourceList.jsx

import React from 'react'
import { SkillBrandLogo } from './SkillBrandLogo'
import { PlayIcon, ExternalLinkIcon, SearchIcon } from '@heroicons/react/outline'

const getYouTubeThumbnail = (vid) => {
  let videoId = null

  // 1. Direct YouTube video ID (must be a valid 11-character ID)
  if (vid.id && typeof vid.id === 'string' && !vid.id.startsWith('fallback') && !vid.id.startsWith('search_')) {
    videoId = vid.id
  }

  // 2. Extract from embed URL
  if (!videoId && vid.embed_url) {
    const match = vid.embed_url.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
    if (match) videoId = match[1]
  }

  // 3. Extract from watch URL
  if (!videoId && vid.url) {
    const match = vid.url.match(/(?:v=|\/embed\/|\/watch\?v=|\.be\/)([a-zA-Z0-9_-]{11})/)
    if (match) videoId = match[1]
  }

  // mqdefault.jpg is 100% guaranteed by YouTube to exist for valid videos
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
  }

  return vid.thumbnail || 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80'
}

export const YouTubeResourceList = ({ videos, skillName }) => {
  if (!videos || videos.length === 0) return null

  const featuredVid = videos[0]
  const ytThumbnail = getYouTubeThumbnail(featuredVid)
  const fallbackImage = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80'
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' full course tutorial for software engineer')}`

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          Recommended YouTube Video Tutorial for {skillName}
        </h4>

        {/* Explore All Videos Button */}
        <a
          href={youtubeSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition-all"
        >
          <SearchIcon className="w-3.5 h-3.5" />
          <span>Explore All {skillName} Tutorials on YouTube</span>
          <ExternalLinkIcon className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Single Clean Featured Card */}
      <div 
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-red-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col sm:flex-row"
        onClick={() => window.open(featuredVid.url, '_blank')}
      >
        {/* Banner Header Image */}
        <div className="relative aspect-video sm:w-1/2 bg-gray-900 overflow-hidden shrink-0">
          <img 
            src={ytThumbnail} 
            alt={featuredVid.title} 
            className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-85 transition-all duration-300"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = fallbackImage
            }}
          />
          
          {/* Red Play Overlay */}
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-all">
            <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
              <PlayIcon className="w-7 h-7 ml-0.5" />
            </div>
          </div>

          {/* Option B: Tech Brand Banner Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1 rounded-lg border border-white/20 shadow-md z-10">
            <SkillBrandLogo skillName={skillName} className="w-4 h-4" />
            <span>{skillName}</span>
          </div>

          {/* Duration Badge */}
          <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-semibold px-2.5 py-0.5 rounded z-10">
            {featuredVid.duration || '20+ mins'}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {featuredVid.badge || '⭐ Highly Recommended'}
              </span>
              <span className="text-xs text-gray-500 font-medium">{featuredVid.channel}</span>
            </div>

            <h5 className="font-extrabold text-base text-gray-900 group-hover:text-red-600 transition-colors leading-snug">
              {featuredVid.title}
            </h5>

            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
              Watch this masterclass on YouTube to gain deep practical skills and technical interview mastery for {skillName}.
            </p>
          </div>

          {/* Card Footer Actions */}
          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(featuredVid.url, '_blank')
              }}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <span>Watch Masterclass on YouTube</span>
              <ExternalLinkIcon className="w-4 h-4" />
            </button>

            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-extrabold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <span>View All {skillName} Videos ➔</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default YouTubeResourceList
