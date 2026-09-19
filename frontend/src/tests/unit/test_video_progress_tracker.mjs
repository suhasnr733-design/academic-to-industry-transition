/**
 * Unit tests for Video Progress Tracker Utility
 * 
 * Verifies:
 * - Interval union and merging without double counting
 * - Continuous percentage calculation (0%, 10%, 35%, 62%, 89%, 100%)
 * - Forward seeking protection (skipped segments not counted)
 * - Backward seeking protection and replaying previously watched segments
 * - Video completion logic (100% genuine watched content required with boundary technical tolerance)
 * - Seeking directly to end does NOT mark completion
 */

import {
  mergeIntervals,
  calculateWatchedDuration,
  calculateWatchedPercentage,
  detectSeeking,
  isVideoCompleted,
  formatDuration
} from '../../services/videoProgressTracker.js'

let passedCount = 0
let failedCount = 0

function assert(condition, message) {
  if (condition) {
    passedCount++
    console.log(`  ✅ PASS: ${message}`)
  } else {
    failedCount++
    console.error(`  ❌ FAIL: ${message}`)
  }
}

function assertClose(actual, expected, tolerance = 0.5, message = '') {
  const diff = Math.abs(actual - expected)
  if (diff <= tolerance) {
    passedCount++
    console.log(`  ✅ PASS: ${message} (actual: ${actual}, expected: ${expected})`)
  } else {
    failedCount++
    console.error(`  ❌ FAIL: ${message} (actual: ${actual}, expected: ${expected}, diff: ${diff})`)
  }
}

console.log('\n--- 1. Testing Interval Union & Merging ---')
{
  // Disjoint intervals
  const intervals = [[0, 120], [300, 420], [600, 720]]
  const merged = mergeIntervals(intervals)
  assert(merged.length === 3, 'Disjoint intervals keep 3 separate segments')
  assertClose(calculateWatchedDuration(intervals), 360, 0.1, 'Union of 120s + 120s + 120s = 360s')

  // Overlapping intervals
  const overlapping = [[0, 100], [50, 150], [140, 200]]
  const mergedOverlap = mergeIntervals(overlapping)
  assert(mergedOverlap.length === 1, 'Overlapping intervals merge into 1 contiguous segment')
  assert(mergedOverlap[0][0] === 0 && mergedOverlap[0][1] === 200, 'Merged range spans [0, 200]')
  assertClose(calculateWatchedDuration(overlapping), 200, 0.1, 'Overlapping duration is 200s, not 260s (no double count)')

  // Out of order intervals
  const outOfOrder = [[300, 400], [0, 50], [20, 100]]
  const mergedOrder = mergeIntervals(outOfOrder)
  assert(mergedOrder.length === 2, 'Out of order intervals sorted and merged correctly')
  assertClose(calculateWatchedDuration(outOfOrder), 200, 0.1, 'Out of order watched duration is 100s + 100s = 200s')

  // Rewatched interval (exact duplicate or subset)
  const rewatched = [[0, 60], [10, 50], [0, 60], [20, 40]]
  assertClose(calculateWatchedDuration(rewatched), 60, 0.1, 'Re-watching same segment yields exactly 60s, not 180s')
}

console.log('\n--- 2. Testing Continuous Percentage Calculation ---')
{
  const totalDuration = 1000 // 1000 seconds video

  // 0%
  assertClose(calculateWatchedPercentage(0, totalDuration), 0, 0.1, '0s watched is 0%')

  // 10%
  assertClose(calculateWatchedPercentage(100, totalDuration), 10, 0.1, '100s watched is 10%')

  // 35%
  assertClose(calculateWatchedPercentage(350, totalDuration), 35, 0.1, '350s watched is 35%')

  // 50%
  assertClose(calculateWatchedPercentage(500, totalDuration), 50, 0.1, '500s watched is 50%')

  // 62%
  assertClose(calculateWatchedPercentage(620, totalDuration), 62, 0.1, '620s watched is 62%')

  // 89%
  assertClose(calculateWatchedPercentage(890, totalDuration), 89, 0.1, '890s watched is 89%')

  // 100%
  assertClose(calculateWatchedPercentage(1000, totalDuration), 100, 0.1, '1000s watched is 100%')

  // Clamping above 100%
  assertClose(calculateWatchedPercentage(1200, totalDuration), 100, 0.1, 'Duration exceeding total clamps to 100%')

  // Edge cases: total duration 0 or negative
  assert(calculateWatchedPercentage(100, 0) === 0, 'Zero total duration safely returns 0%')
  assert(calculateWatchedPercentage(-10, 100) === 0, 'Negative watched duration returns 0%')
}

console.log('\n--- 3. Testing Seeking Protection ---')
{
  // Case A: Normal playback (0.5s real time, 0.5s playback progress)
  const normal = detectSeeking(10.0, 10.5, 0.5)
  assert(!normal.isSeek, 'Normal playback of 0.5s is not flagged as seeking')

  // Case B: Forward seek (0.5s real time, playback jumps from 100s to 1000s)
  const forwardSeek = detectSeeking(100.0, 1000.0, 0.5)
  assert(forwardSeek.isSeek && forwardSeek.reason === 'forward_seek', 'Forward seek from 100s to 1000s is flagged')

  // Case C: Backward seek (0.5s real time, playback jumps from 500s back to 100s)
  const backwardSeek = detectSeeking(500.0, 100.0, 0.5)
  assert(backwardSeek.isSeek && backwardSeek.reason === 'backward_seek', 'Backward seek from 500s to 100s is flagged')

  // Case D: User watches 0-100s, then seeks 100s -> 1000s (video end)
  // Intervals should ONLY contain [0, 100], NOT the skipped [100, 1000]
  const intervals = [[0, 100]]
  const total = 1000
  const watched = calculateWatchedDuration(intervals)
  const pct = calculateWatchedPercentage(watched, total)
  assertClose(pct, 10, 0.1, 'Seeking to end after watching 100s preserves 10% progress, NOT 100%')
  assert(!isVideoCompleted(watched, total), 'Seeking to end does NOT complete video')
}

console.log('\n--- 4. Testing Completion Logic ---')
{
  const totalDuration = 1000 // 1000 seconds video

  // 10% watched -> not complete
  assert(!isVideoCompleted(100, totalDuration), '10% watched is not completed')

  // 35% watched -> not complete
  assert(!isVideoCompleted(350, totalDuration), '35% watched is not completed')

  // 50% watched -> not complete
  assert(!isVideoCompleted(500, totalDuration), '50% watched is not completed')

  // 89% watched -> not complete
  assert(!isVideoCompleted(890, totalDuration), '89% watched is not completed')

  // 94% watched -> not complete
  assert(!isVideoCompleted(940, totalDuration), '94% watched is not completed')

  // 95% watched -> not complete (user requires 100% genuine completion, NOT 95%)
  assert(!isVideoCompleted(950, totalDuration), '95% watched is NOT completed')

  // 99% watched -> not complete (10s unwatched is not complete)
  assert(!isVideoCompleted(990, totalDuration), '99% watched is NOT completed')

  // 99.8% (missing 2s on 1000s, default 1.0s tolerance) -> not complete
  assert(!isVideoCompleted(998, totalDuration), '99.8% (missing 2s) is not completed')

  // Genuine full coverage (1000s / 1000s) -> completed
  assert(isVideoCompleted(1000, totalDuration), '100% genuine coverage is completed')

  // Genuine full coverage within boundary technical tolerance (e.g. 999.5s on 1000s with 1.0s tolerance)
  assert(isVideoCompleted(999.5, totalDuration), 'Genuine coverage within boundary tolerance (999.5s / 1000s) is completed')
}

console.log('\n--- 5. Testing Duration Formatting ---')
{
  assert(formatDuration(0) === '0:00', '0s formats to 0:00')
  assert(formatDuration(65) === '1:05', '65s formats to 1:05')
  assert(formatDuration(600) === '10:00', '600s formats to 10:00')
  assert(formatDuration(3665) === '1:01:05', '3665s formats to 1:01:05')
}

console.log(`\n===========================================`)
console.log(`Results: ${passedCount} passed, ${failedCount} failed`)
console.log(`===========================================\n`)

if (failedCount > 0) {
  process.exit(1)
}
