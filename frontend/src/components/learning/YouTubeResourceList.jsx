// frontend/src/components/learning/YouTubeResourceList.jsx

import React from 'react'
import { SkillBrandLogo } from './SkillBrandLogo'
import { 
  PlayIcon, 
  ExternalLinkIcon, 
  SearchIcon, 
  BookmarkIcon, 
  CheckCircleIcon,
  RefreshIcon,
  ExclamationCircleIcon
} from '@heroicons/react/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/solid'
import { isValidYouTubeVideo, formatVideoDuration } from '../../utils/videoResolver'
import { STAGE_BADGES } from '../../services/youtubeVideoService'

/**
 * Extracts high-reliability YouTube thumbnail URL
 */
const getYouTubeThumbnail = (vid) => {
  if (!vid) return 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80'

  let videoId = null

  if (vid.id && typeof vid.id === 'string' && !vid.id.startsWith('fallback') && !vid.id.startsWith('search_') && /^[a-zA-Z0-9_-]{11}$/.test(vid.id)) {
    videoId = vid.id
  }

  if (!videoId && vid.embed_url) {
    const match = vid.embed_url.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
    if (match) videoId = match[1]
  }

  if (!videoId && vid.url) {
    const match = vid.url.match(/(?:v=|\/embed\/|\/watch\?v=|\.be\/)([a-zA-Z0-9_-]{11})/)
    if (match) videoId = match[1]
  }

  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
  }

  return vid.thumbnail || 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80'
}

/**
 * Badge style mapping
 */
const getBadgeClasses = (index, badgeText = '') => {
  const bLow = (badgeText || '').toLowerCase()
  if (bLow.includes('masterclass') || index === 0) {
    return 'bg-purple-100 text-purple-800 border-purple-200'
  }
  if (bLow.includes('concept') || index === 1) {
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }
  if (bLow.includes('practice') || index === 2) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
  return 'bg-amber-100 text-amber-800 border-amber-200'
}

export const YouTubeResourceList = ({
  videos = [],
  skillName = '',
  stage = 'learn',
  onSelectStage,
  isLoading = false,
  error = null,
  onRetry,
  bookmarks = [],
  isWatched = false,
  watchedVideoIds = null,
  onPlayVideo,
  onBookmark,
  onMarkWatched,
  onMarkVideoWatched
}) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80'
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial software engineer')}`

  // Stage selector configuration
  const stageOptions = [
    { id: 'learn', label: 'Learn (Masterclass)' },
    { id: 'practice', label: 'Practice Walkthroughs' },
    { id: 'build', label: 'Project Implementation' },
    { id: 'assess', label: 'Interview Prep' }
  ]

  // Filter valid embeddable videos with strict uniqueness
  const seenRenderIds = new Set()
  const validVideos = (Array.isArray(videos) ? videos.filter(isValidYouTubeVideo) : []).filter(vid => {
    let id = vid.id
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      const match = (vid.url || vid.embed_url || '').match(/(?:v=|\/embed\/|\/watch\?v=|\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
      if (match) id = match[1]
    }
    if (!id || seenRenderIds.has(id)) return false
    seenRenderIds.add(id)
    return true
  })

  return (
    <div className="space-y-4" data-testid="youtube-resource-list">
      {/* Section Header with Stage Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            Curated YouTube Tutorials for {skillName}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Hand-picked tutorials and interview walkthroughs matched to your learning stage.
          </p>
        </div>

        {/* Stage Toggle Pills */}
        {onSelectStage && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto text-xs font-bold shrink-0">
            {stageOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectStage(opt.id)}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  stage === opt.id
                    ? 'bg-red-600 text-white shadow-xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
                aria-label={`View ${opt.label} videos`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center space-y-3 bg-gray-50/70 rounded-2xl border border-gray-200">
          <RefreshIcon className="w-8 h-8 text-red-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-600">
            Loading {stage ? `${stage} stage` : ''} video resources for {skillName}...
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="py-8 px-6 text-center space-y-3 bg-red-50/70 rounded-2xl border border-red-200">
          <ExclamationCircleIcon className="w-8 h-8 text-red-500 mx-auto" />
          <h5 className="text-sm font-bold text-red-900">Unable to load resources right now.</h5>
          <p className="text-xs text-red-700 max-w-sm mx-auto">
            {typeof error === 'string' ? error : 'Network error or service temporarily unavailable.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              aria-label="Retry loading video resources"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State (Safe Empty — NEVER DSA Fallback) */}
      {!isLoading && !error && validVideos.length === 0 && (
        <div className="py-10 px-6 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-200 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 text-gray-500 flex items-center justify-center mx-auto text-xl">
            🎬
          </div>
          <h5 className="text-sm font-bold text-gray-900">
            No curated videos are available for this stage yet.
          </h5>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            We only recommend verified, high-accuracy tutorials to ensure relevant learning without distracting material.
          </p>
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl transition-all"
            aria-label={`Search YouTube for ${skillName} tutorials`}
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Search verified {skillName} tutorials on YouTube</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* 4-Video Responsive Grid (2 Columns Desktop, 1 Column Mobile) */}
      {!isLoading && !error && validVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validVideos.map((vid, idx) => {
            const ytThumbnail = getYouTubeThumbnail(vid)
            const badgeText = vid.badge || STAGE_BADGES[idx] || '⭐ Recommended'
            const badgeStyle = getBadgeClasses(idx, badgeText)

            const isBookmarked = (bookmarks || []).some(
              b => b.title === vid.title || (b.url && (b.url === vid.url || b.url.includes(vid.id)))
            )

            const isCardWatched = Boolean(
              (watchedVideoIds && (typeof watchedVideoIds.has === 'function' ? watchedVideoIds.has(vid.id) : watchedVideoIds.includes(vid.id))) ||
              vid.is_watched ||
              vid.watched ||
              (watchedVideoIds === null && isWatched)
            )

            const handleCardPlay = (e) => {
              e.stopPropagation()
              if (onMarkVideoWatched) {
                onMarkVideoWatched(vid.id, vid, skillName, stage)
              }
              if (onPlayVideo) {
                onPlayVideo(vid, skillName)
              } else if (vid.url) {
                window.open(vid.url, '_blank')
              }
            }

            const handleCardBookmark = (e) => {
              e.stopPropagation()
              if (onBookmark) {
                onBookmark({
                  skill_name: skillName,
                  resource_type: 'youtube',
                  title: vid.title,
                  url: vid.url || `https://www.youtube.com/watch?v=${vid.id}`,
                  thumbnail: ytThumbnail,
                  provider: 'YouTube',
                  extra_data: {
                    id: vid.id,
                    channel: vid.channel,
                    duration: vid.duration,
                    stage: stage
                  }
                })
              }
            }

            const handleCardMarkWatched = (e) => {
              e.stopPropagation()
              if (onMarkVideoWatched) {
                onMarkVideoWatched(vid.id, vid, skillName, stage)
              }
              if (onMarkWatched) {
                onMarkWatched(skillName, stage, vid)
              }
            }

            const displayDuration = formatVideoDuration(vid.duration, vid.duration_seconds)

            return (
              <div
                key={vid.id || idx}
                data-testid="youtube-video-card"
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Clickable Thumbnail with Play Overlay */}
                <div 
                  className="relative aspect-video bg-gray-900 overflow-hidden cursor-pointer shrink-0"
                  onClick={handleCardPlay}
                  title={`Watch ${vid.title} in-app`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCardPlay(e) }}
                  aria-label={`Play video: ${vid.title}`}
                >
                  <img
                    src={ytThumbnail}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = fallbackImage
                    }}
                  />

                  {/* Red Play Overlay */}
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-all">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <PlayIcon className="w-6 h-6 ml-0.5" />
                    </div>
                  </div>

                  {/* Top Left Brand Tag */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border border-white/20 shadow-xs z-10">
                    <SkillBrandLogo skillName={skillName} className="w-3.5 h-3.5" />
                    <span>{skillName}</span>
                  </div>

                  {/* Duration Tag */}
                  {displayDuration && (
                    <span 
                      data-testid="video-duration-badge"
                      className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded z-10"
                    >
                      {displayDuration}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                        {badgeText}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium truncate max-w-[130px]">
                        {vid.channel || 'Tech Academy'}
                      </span>
                    </div>

                    <h5
                      onClick={handleCardPlay}
                      className="font-extrabold text-sm text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                      title={vid.title}
                    >
                      {vid.title}
                    </h5>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    {/* Primary: Watch In-App */}
                    <button
                      onClick={handleCardPlay}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      aria-label={`Watch ${vid.title} in-app`}
                    >
                      <PlayIcon className="w-3.5 h-3.5" />
                      <span>Watch In-App</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Mark as Watched */}
                      {(onMarkWatched || onMarkVideoWatched) && (
                        <button
                          onClick={handleCardMarkWatched}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isCardWatched
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border-gray-200'
                          }`}
                          title={isCardWatched ? `${stage} video watched` : `Mark ${stage} video as watched`}
                          aria-label={isCardWatched ? `${vid.title} watched` : `Mark ${vid.title} as watched`}
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isCardWatched ? 'Watched' : 'Mark Watched'}</span>
                        </button>
                      )}

                      {/* Bookmark Button */}
                      {onBookmark && (
                        <button
                          onClick={handleCardBookmark}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isBookmarked
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                              : 'bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border-gray-200'
                          }`}
                          title={isBookmarked ? 'Saved to bookmarks' : 'Save to bookmarks'}
                          aria-label={isBookmarked ? `Remove ${vid.title} bookmark` : `Bookmark ${vid.title}`}
                        >
                          {isBookmarked ? (
                            <BookmarkSolidIcon className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <BookmarkIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Secondary Link: Open on YouTube */}
                      {vid.url && (
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                          title="Open on YouTube"
                          aria-label={`Open ${vid.title} directly on YouTube`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default YouTubeResourceList
