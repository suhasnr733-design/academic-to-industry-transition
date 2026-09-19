// frontend/src/components/learning/YouTubePlayerWithProgress.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { 
  XIcon, 
  BookmarkIcon, 
  ExternalLinkIcon, 
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/solid'
import {
  mergeIntervals,
  calculateWatchedDuration,
  calculateWatchedPercentage,
  detectSeeking,
  isVideoCompleted,
  formatDuration,
  DEFAULT_TECHNICAL_TOLERANCE_SECONDS
} from '../../services/videoProgressTracker.js'
import api from '../../services/api'

// Singleton promise to ensure YouTube IFrame API is loaded exactly once
let ytApiPromise = null
function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'))

  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT)
  }

  if (ytApiPromise) return ytApiPromise

  ytApiPromise = new Promise((resolve) => {
    const prevOnReady = window.onYouTubeIframeAPIReady

    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevOnReady === 'function') prevOnReady()
      resolve(window.YT)
    }

    // Check if script tag already added
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]')
    if (!existingScript) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      document.body.appendChild(tag)
    }
  })

  return ytApiPromise
}

export const YouTubePlayerWithProgress = ({
  video = {},
  skillName = '',
  targetRole = 'Data Scientist',
  stage = 'learn',
  resumeId = null,
  initialProgress = null,
  isBookmarked = false,
  onBookmark = null,
  onProgressUpdate = null,
  onClose = null
}) => {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const tickIntervalRef = useRef(null)
  const lastSaveTimeRef = useRef(0)

  // Tracking references (survives render loop without stale closures)
  const trackingRef = useRef({
    videoId: video.id,
    lastPlaybackTime: 0,
    lastWallTime: 0,
    intervals: [],
    watchedDuration: 0,
    totalDuration: Number(video.duration_seconds) || 0,
    progressPercent: 0,
    isCompleted: false,
    isPlaying: false
  })

  // State for UI display
  const [progressState, setProgressState] = useState({
    percentage: 0,
    watchedDuration: 0,
    totalDuration: Number(video.duration_seconds) || 0,
    isCompleted: false,
    isReady: false
  })

  // Parse YouTube video ID safely
  const resolveVideoId = useCallback(() => {
    if (video.id && typeof video.id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(video.id)) {
      return video.id
    }
    const url = video.url || video.embed_url || ''
    const match = url.match(/(?:v=|\/embed\/|\/watch\?v=|\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : 'RBSGKlAvoiM'
  }, [video])

  const videoId = resolveVideoId()

  // Initialize tracking data from initialProgress or localStorage
  useEffect(() => {
    let savedIntervals = []
    let savedWatchedSec = 0
    let savedTotalSec = Number(video.duration_seconds) || 0
    let savedPercent = 0
    let savedCompleted = false
    let savedLastTime = 0

    // 1. Try initialProgress prop passed from backend / parent
    if (initialProgress) {
      savedIntervals = initialProgress.watched_intervals || []
      savedWatchedSec = Number(initialProgress.watched_duration) || 0
      savedTotalSec = Number(initialProgress.total_duration) || savedTotalSec
      savedPercent = Number(initialProgress.progress_percent) || 0
      savedCompleted = Boolean(initialProgress.is_completed)
      savedLastTime = Number(initialProgress.last_playback_time) || 0
    } else {
      // 2. Fallback to localStorage
      try {
        const localKey = `video_progress_${resumeId || 'default'}_${videoId}`
        const localRaw = localStorage.getItem(localKey)
        if (localRaw) {
          const parsed = JSON.parse(localRaw)
          savedIntervals = parsed.watched_intervals || []
          savedWatchedSec = parsed.watched_duration || 0
          savedTotalSec = parsed.total_duration || savedTotalSec
          savedPercent = parsed.progress_percent || 0
          savedCompleted = parsed.is_completed || false
          savedLastTime = parsed.last_playback_time || 0
        }
      } catch (_) {}
    }

    trackingRef.current = {
      videoId,
      lastPlaybackTime: savedLastTime,
      lastWallTime: performance.now(),
      intervals: mergeIntervals(savedIntervals),
      watchedDuration: savedWatchedSec,
      totalDuration: savedTotalSec,
      progressPercent: savedPercent,
      isCompleted: savedCompleted,
      isPlaying: false
    }

    setProgressState({
      percentage: savedPercent,
      watchedDuration: savedWatchedSec,
      totalDuration: savedTotalSec,
      isCompleted: savedCompleted,
      isReady: false
    })
  }, [videoId, initialProgress, resumeId, video.duration_seconds])

  // Save progress helper (persists to backend and notifies parent)
  const persistProgress = useCallback(async (isFinal = false) => {
    const cur = trackingRef.current
    if (!cur.videoId || cur.totalDuration <= 0) return

    const payload = {
      video_id: cur.videoId,
      video_title: video.title || `${skillName} Tutorial`,
      skill_name: skillName || video.skill_name || 'General',
      target_role: targetRole || 'Data Scientist',
      stage: stage || 'learn',
      resume_id: resumeId,
      watched_intervals: cur.intervals,
      watched_duration: cur.watchedDuration,
      total_duration: cur.totalDuration,
      progress_percent: cur.progressPercent,
      is_completed: cur.isCompleted,
      last_playback_time: cur.lastPlaybackTime,
      technical_tolerance: DEFAULT_TECHNICAL_TOLERANCE_SECONDS
    }

    // Save locally
    try {
      const localKey = `video_progress_${resumeId || 'default'}_${cur.videoId}`
      localStorage.setItem(localKey, JSON.stringify(payload))

      if (cur.isCompleted) {
        const watchedKey = `watched_videos_${resumeId || 'default'}`
        const rawWatched = localStorage.getItem(watchedKey)
        const set = rawWatched ? new Set(JSON.parse(rawWatched)) : new Set()
        set.add(cur.videoId)
        localStorage.setItem(watchedKey, JSON.stringify(Array.from(set)))
      }
    } catch (_) {}

    // Notify parent component
    if (onProgressUpdate) {
      onProgressUpdate(payload)
    }

    // Persist to backend
    try {
      await api.post('/learning/video-progress', payload)
    } catch (err) {
      // Graceful offline fallback
      console.debug('[YouTubePlayerWithProgress] Auto-save backend synced locally:', err?.message)
    }
  }, [video.title, video.skill_name, skillName, targetRole, stage, resumeId, onProgressUpdate])

  // Periodic and state-driven tracker tick
  const handleTrackerTick = useCallback(() => {
    const player = playerRef.current
    if (!player || typeof player.getCurrentTime !== 'function') return

    const cur = trackingRef.current
    const currTime = player.getCurrentTime()
    const now = performance.now()
    const elapsedWallSeconds = (now - cur.lastWallTime) / 1000

    // Ensure total duration is accurate from player
    if (typeof player.getDuration === 'function') {
      const liveDuration = player.getDuration()
      if (liveDuration > 0 && liveDuration !== cur.totalDuration) {
        cur.totalDuration = Math.round(liveDuration)
      }
    }

    // Seek detection
    const seekResult = detectSeeking(cur.lastPlaybackTime, currTime, elapsedWallSeconds)

    if (seekResult.isSeek) {
      // Seek jump detected: reset sample markers without counting skipped time
      cur.lastPlaybackTime = currTime
      cur.lastWallTime = now
      return
    }

    // Genuine playback interval
    if (currTime > cur.lastPlaybackTime) {
      cur.intervals.push([cur.lastPlaybackTime, currTime])
      cur.intervals = mergeIntervals(cur.intervals)
      cur.watchedDuration = calculateWatchedDuration(cur.intervals)
      
      const newPercent = calculateWatchedPercentage(cur.watchedDuration, cur.totalDuration)
      cur.progressPercent = newPercent

      // Check genuine 100% completion
      const newlyCompleted = isVideoCompleted(
        cur.watchedDuration,
        cur.totalDuration,
        DEFAULT_TECHNICAL_TOLERANCE_SECONDS
      )

      if (newlyCompleted && !cur.isCompleted) {
        cur.isCompleted = true
        cur.progressPercent = 100.0
      }

      // Update React state for real-time continuous rendering
      setProgressState({
        percentage: cur.progressPercent,
        watchedDuration: cur.watchedDuration,
        totalDuration: cur.totalDuration,
        isCompleted: cur.isCompleted,
        isReady: true
      })
    }

    cur.lastPlaybackTime = currTime
    cur.lastWallTime = now

    // Periodic auto-save every 6 seconds during playback
    if (now - lastSaveTimeRef.current > 6000) {
      lastSaveTimeRef.current = now
      persistProgress(false)
    }
  }, [persistProgress])

  // Stop polling loop
  const stopTrackingLoop = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current)
      tickIntervalRef.current = null
    }
    trackingRef.current.isPlaying = false
  }, [])

  // Start polling loop
  const startTrackingLoop = useCallback(() => {
    stopTrackingLoop()
    trackingRef.current.isPlaying = true
    trackingRef.current.lastWallTime = performance.now()
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      trackingRef.current.lastPlaybackTime = playerRef.current.getCurrentTime()
    }
    tickIntervalRef.current = setInterval(handleTrackerTick, 300)
  }, [handleTrackerTick, stopTrackingLoop])

  // Mount YouTube IFrame API Player
  useEffect(() => {
    let isSubscribed = true
    const containerId = `yt-player-${videoId}`

    loadYouTubeIframeApi().then((YT) => {
      if (!isSubscribed || !containerRef.current) return

      // Clean up prior player instance if any
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy()
        } catch (_) {}
      }

      // Create player mounting target div
      containerRef.current.innerHTML = `<div id="${containerId}" class="w-full h-full"></div>`

      playerRef.current = new YT.Player(containerId, {
        videoId,
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 1
        },
        events: {
          onReady: (event) => {
            if (!isSubscribed) return
            setProgressState(prev => ({ ...prev, isReady: true }))

            // If resuming from previous position
            const resumePos = trackingRef.current.lastPlaybackTime
            if (resumePos > 0 && resumePos < (trackingRef.current.totalDuration - 5)) {
              event.target.seekTo(resumePos, true)
            }
          },
          onStateChange: (event) => {
            if (!isSubscribed) return
            const state = event.data

            if (state === YT.PlayerState.PLAYING) {
              startTrackingLoop()
            } else if (state === YT.PlayerState.PAUSED) {
              stopTrackingLoop()
              handleTrackerTick()
              persistProgress(false)
            } else if (state === YT.PlayerState.ENDED) {
              stopTrackingLoop()
              handleTrackerTick()
              persistProgress(true)
            } else {
              stopTrackingLoop()
            }
          },
          onError: () => {
            stopTrackingLoop()
          }
        }
      })
    }).catch(err => {
      console.warn('[YouTubePlayerWithProgress] Failed loading YouTube iframe API:', err)
    })

    return () => {
      isSubscribed = false
      stopTrackingLoop()
      // Auto-save on unmount / modal close
      persistProgress(true)
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy()
        } catch (_) {}
      }
    }
  }, [videoId, startTrackingLoop, stopTrackingLoop, handleTrackerTick, persistProgress])

  // Calculate visual progress percentage display
  const displayPercent = Math.min(100, Math.max(0, Math.round(progressState.percentage)))

  return (
    <div 
      className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 flex flex-col max-w-4xl w-full mx-auto"
      data-testid="youtube-player-modal"
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3 truncate pr-4">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60">
                {stage.toUpperCase()} TUTORIAL
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {skillName} • {targetRole}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-100 truncate mt-0.5" title={video.title}>
              {video.title}
            </h3>
          </div>
        </div>

        {onClose && (
          <button
            onClick={() => {
              persistProgress(true)
              onClose()
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close video player"
          >
            <XIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Video Viewport Container */}
      <div className="relative aspect-video bg-black w-full overflow-hidden shadow-inner">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Automatic Real-Time Progress Bar & Metrics */}
      <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
        {/* Progress Metric Row */}
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span 
              data-testid="automatic-progress-badge"
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${
                progressState.isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
              }`}
            >
              {displayPercent}% Watched
            </span>

            {progressState.isCompleted ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-extrabold text-xs">
                <CheckCircleIcon className="w-4 h-4" />
                <span>Completed ✅</span>
              </span>
            ) : (
              <span className="text-slate-400 font-medium">
                Automatic playback tracking
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
            <ClockIcon className="w-4 h-4 text-slate-500" />
            <span data-testid="playback-duration-display">
              {formatDuration(progressState.watchedDuration)} / {formatDuration(progressState.totalDuration)}
            </span>
          </div>
        </div>

        {/* Real-Time Continuous Progress Bar */}
        <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div
            data-testid="playback-progress-bar-fill"
            className={`h-full transition-all duration-300 rounded-full ${
              progressState.isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-red-600 via-indigo-600 to-cyan-400'
            }`}
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        {/* Bottom Actions Row (strictly without manual completion buttons) */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <p className="text-[11px] text-slate-500 italic">
            Progress updates continuously as you genuinely watch video content. Skipping or seeking is protected.
          </p>

          <div className="flex items-center gap-2">
            {onBookmark && (
              <button
                onClick={() => {
                  onBookmark({
                    skill_name: skillName,
                    resource_type: 'youtube',
                    title: video.title,
                    url: video.url || `https://www.youtube.com/watch?v=${videoId}`,
                    thumbnail: video.thumbnail,
                    provider: 'YouTube'
                  })
                }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Video'}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkSolidIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <BookmarkIcon className="w-3.5 h-3.5" />
                    <span>Bookmark</span>
                  </>
                )}
              </button>
            )}

            {video.url && (
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold transition-all cursor-pointer"
                title="Open on YouTube"
                aria-label="Open on YouTube in new tab"
              >
                <ExternalLinkIcon className="w-3.5 h-3.5" />
                <span>YouTube</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default YouTubePlayerWithProgress
