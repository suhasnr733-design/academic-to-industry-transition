/**
 * Video Progress Tracker Utility
 * 
 * Provides robust watched-interval union mathematics, continuous percentage calculation,
 * seeking detection, and duration formatting for genuine video playback tracking.
 */

/**
 * Normalizes and merges overlapping or adjacent time intervals.
 * 
 * Example:
 *   mergeIntervals([[0, 10], [5, 20], [25, 30]]) => [[0, 20], [25, 30]]
 * 
 * @param {Array<[number, number]>} intervals - List of [start, end] pairs in seconds.
 * @param {number} tolerance - Max gap in seconds to bridge (handles player clock jitter). Default: 1.0s.
 * @returns {Array<[number, number]>} Merged non-overlapping intervals.
 */
export const mergeIntervals = (intervals = [], tolerance = 1.0) => {
  if (!Array.isArray(intervals) || intervals.length === 0) {
    return []
  }

  // Filter valid numerical intervals and ensure start <= end and start >= 0
  const validIntervals = []
  for (const item of intervals) {
    if (!Array.isArray(item) || item.length < 2) continue
    let [s, e] = item
    s = Number(s)
    e = Number(e)
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue
    if (s < 0) s = 0
    if (e < s) continue // Invalid inverted interval
    if (e === s) continue // 0-duration point
    validIntervals.push([s, e])
  }

  if (validIntervals.length === 0) return []

  // Sort primarily by start ascending, then by end ascending
  validIntervals.sort((a, b) => a[0] - b[0] || a[1] - b[1])

  const merged = [validIntervals[0]]

  for (let i = 1; i < validIntervals.length; i++) {
    const current = validIntervals[i]
    const last = merged[merged.length - 1]

    // If current starts within last interval or within tolerance gap
    if (current[0] <= last[1] + tolerance) {
      last[1] = Math.max(last[1], current[1])
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * Calculates the unique watched duration from intervals without double-counting.
 * 
 * @param {Array<[number, number]>} intervals - List of [start, end] intervals.
 * @param {number} tolerance - Tolerance for merging in seconds.
 * @returns {number} Total unique seconds watched.
 */
export const calculateWatchedDuration = (intervals = [], tolerance = 1.0) => {
  const merged = mergeIntervals(intervals, tolerance)
  let total = 0
  for (const [start, end] of merged) {
    total += (end - start)
  }
  return Math.round(total * 100) / 100
}

/**
 * Calculates the exact watched percentage from unique watched duration and total duration.
 * 
 * Formula:
 *   watched_percentage = (unique_watched_duration / total_video_duration) * 100
 * 
 * @param {number} uniqueDuration - Genuinely watched unique duration in seconds.
 * @param {number} totalDuration - Total video duration in seconds.
 * @returns {number} Percentage between 0.0 and 100.0.
 */
export const calculateWatchedPercentage = (uniqueDuration, totalDuration) => {
  const uDur = Number(uniqueDuration)
  const tDur = Number(totalDuration)

  if (!Number.isFinite(uDur) || !Number.isFinite(tDur) || tDur <= 0 || uDur <= 0) {
    return 0.0
  }

  const rawPercent = (uDur / tDur) * 100.0

  if (rawPercent < 0) return 0.0
  if (rawPercent > 100.0) return 100.0

  return Math.round(rawPercent * 10) / 10
}

/**
 * Detects seeking jumps (forward or backward) between sample ticks.
 * 
 * @param {number} prevPlaybackTime - Player timestamp at previous sample in seconds.
 * @param {number} currPlaybackTime - Player timestamp at current sample in seconds.
 * @param {number} elapsedWallClockSeconds - Real-world seconds elapsed between samples.
 * @param {number} tolerance - Max allowable playback clock jitter before flagging seek. Default 1.2s.
 * @returns {{ isSeek: boolean, deltaPlayback: number, reason?: string }}
 */
export const detectSeeking = (
  prevPlaybackTime,
  currPlaybackTime,
  elapsedWallClockSeconds,
  tolerance = 1.2
) => {
  const prev = Number(prevPlaybackTime)
  const curr = Number(currPlaybackTime)
  const wall = Number(elapsedWallClockSeconds)

  if (!Number.isFinite(prev) || !Number.isFinite(curr)) {
    return { isSeek: true, deltaPlayback: 0, reason: 'invalid_timestamps' }
  }

  const deltaPlayback = curr - prev

  // Backward seek jump
  if (deltaPlayback < -0.3) {
    return { isSeek: true, deltaPlayback, reason: 'backward_seek' }
  }

  // Forward seek jump (playback advanced noticeably faster than wall clock allows)
  const maxAllowedForward = Math.max(wall * 2.2, 1.0) + tolerance
  if (deltaPlayback > maxAllowedForward) {
    return { isSeek: true, deltaPlayback, reason: 'forward_seek' }
  }

  return { isSeek: false, deltaPlayback }
}

/**
 * Configurable technical tolerance in seconds for normal playback timing inaccuracies at video boundaries.
 * For example, YouTube's player may fire onEnded when currentTime is within 1.0s of total duration.
 */
export const DEFAULT_TECHNICAL_TOLERANCE_SECONDS = 1.0

/**
 * Determines whether the video has been genuinely completed.
 * Requires 100% genuine content coverage across the video duration,
 * accounting only for a documented small technical tolerance (default 1.0s)
 * for player boundary jitter.
 * 
 * Notice: 94%, 95%, and 99% unwatched boundaries are strictly NOT marked completed.
 * 
 * @param {number} uniqueWatchedDuration - Unique seconds watched.
 * @param {number} totalDuration - Total video seconds.
 * @param {number} technicalToleranceSeconds - Boundary tolerance in seconds (default: 1.0s).
 * @returns {boolean} True only if genuine 100% coverage is achieved.
 */
export const isVideoCompleted = (
  uniqueWatchedDuration,
  totalDuration,
  technicalToleranceSeconds = DEFAULT_TECHNICAL_TOLERANCE_SECONDS
) => {
  const uDur = Number(uniqueWatchedDuration)
  const tDur = Number(totalDuration)

  if (!Number.isFinite(uDur) || !Number.isFinite(tDur) || tDur <= 0 || uDur <= 0) {
    return false
  }

  // Full 100% genuine coverage minus technical boundary tolerance
  const missingDuration = tDur - uDur
  return missingDuration <= Math.max(0, technicalToleranceSeconds)
}

/**
 * Formats seconds into human-readable duration strings (e.g. 75s => "1:15", 3665s => "1:01:05").
 * 
 * @param {number} seconds
 * @returns {string} Formatted duration.
 */
export const formatDuration = (seconds) => {
  const sec = Math.max(0, Math.floor(Number(seconds) || 0))
  const hrs = Math.floor(sec / 3600)
  const mins = Math.floor((sec % 3600) / 60)
  const remSec = sec % 60

  const paddedSec = remSec < 10 ? `0${remSec}` : `${remSec}`

  if (hrs > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`
    return `${hrs}:${paddedMins}:${paddedSec}`
  }

  return `${mins}:${paddedSec}`
}
