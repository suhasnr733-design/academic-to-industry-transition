// frontend/src/tests/unit/test_youtube_duration_integrity.mjs

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatVideoDuration,
  resolveSkillVideo,
  CURATED_FRONTEND_FALLBACKS
} from '../../utils/videoResolver.js'

import {
  formatStageVideos,
  clearStageVideoCache,
  fetchStageVideos,
  setApiClient
} from '../../services/youtubeVideoService.js'

test('PHASE 3.2 — YouTube Duration & Metadata Integrity Regression Suite', async (t) => {

  // =========================================================================
  // TEST 1: W6NZfCO5SIk has the canonical duration (2896 seconds / 48:16)
  // =========================================================================
  await t.test('TEST 1: W6NZfCO5SIk has canonical duration 48:16 and 2896 seconds', () => {
    // 1. Check curated fallback catalog
    const jsFallback = CURATED_FRONTEND_FALLBACKS['javascript']
    assert.equal(jsFallback.id, 'W6NZfCO5SIk')
    assert.equal(jsFallback.channel, 'Programming with Mosh')
    assert.equal(jsFallback.duration, '48:16')
    assert.equal(jsFallback.duration_seconds, 2896)

    // 2. Check formatStageVideos normalization
    const stageVids = formatStageVideos([
      {
        id: 'W6NZfCO5SIk',
        title: 'JavaScript Tutorial for Beginners',
        channel: 'Programming with Mosh',
        url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
        embed_url: 'https://www.youtube.com/embed/W6NZfCO5SIk',
        duration: '48:16',
        duration_seconds: 2896
      }
    ], 'JavaScript')

    assert.equal(stageVids.length, 1)
    assert.equal(stageVids[0].id, 'W6NZfCO5SIk')
    assert.equal(stageVids[0].duration, '48:16')
    assert.equal(stageVids[0].duration_seconds, 2896)
    assert.equal(stageVids[0].channel, 'Programming with Mosh')
  })

  // =========================================================================
  // TEST 2: Incorrect duration 68 minutes / "1 hr 8 mins" must never be returned
  // =========================================================================
  await t.test('TEST 2: Incorrect duration 68 minutes / "1 hr 8 mins" is never returned or displayed', () => {
    // Simulated bad payload with old '1 hr 8 mins'
    const badInput = [
      {
        id: 'W6NZfCO5SIk',
        title: 'JavaScript Tutorial',
        duration: '1 hr 8 mins',
        duration_seconds: 4080,
        url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk'
      }
    ]

    const formatted = formatStageVideos(badInput, 'JavaScript')
    assert.equal(formatted.length, 1)
    // Canonical defense enforces 48:16 and 2896
    assert.equal(formatted[0].duration, '48:16')
    assert.equal(formatted[0].duration_seconds, 2896)
    assert.notEqual(formatted[0].duration, '1 hr 8 mins')

    // formatVideoDuration must also reject "1 hr 8 mins"
    assert.equal(formatVideoDuration('1 hr 8 mins', null), null)
    assert.equal(formatVideoDuration('68 mins', null), null)
  })

  // =========================================================================
  // TEST 3: Frontend correctly formats 2896 seconds to "48:16"
  // =========================================================================
  await t.test('TEST 3: Frontend duration formatter correctly handles seconds', () => {
    // 2896 seconds -> 48:16
    assert.equal(formatVideoDuration(null, 2896), '48:16')
    assert.equal(formatVideoDuration('48:16', 2896), '48:16')

    // String seconds "2896"
    assert.equal(formatVideoDuration('2896', null), '48:16')

    // Multi-hour videos
    // 4803 seconds -> 1:20:03
    assert.equal(formatVideoDuration(null, 4803), '1:20:03')
    // 15638 seconds -> 4:20:38
    assert.equal(formatVideoDuration(null, 15638), '4:20:38')

    // Sub-hour videos
    // 699 seconds -> 11:39
    assert.equal(formatVideoDuration(null, 699), '11:39')
    // 1798 seconds -> 29:58
    assert.equal(formatVideoDuration(null, 1798), '29:58')
  })

  // =========================================================================
  // TEST 4: Unknown duration does not generate a fake duration (returns null)
  // =========================================================================
  await t.test('TEST 4: Unknown duration returns null (Option A: badge hidden)', () => {
    // Null/undefined values
    assert.equal(formatVideoDuration(null, null), null)
    assert.equal(formatVideoDuration(undefined, undefined), null)
    assert.equal(formatVideoDuration('', null), null)

    // Fabricated strings that must NOT be displayed
    assert.equal(formatVideoDuration('45 mins', null), null)
    assert.equal(formatVideoDuration('40 mins', null), null)
    assert.equal(formatVideoDuration('1 hr', null), null)
    assert.equal(formatVideoDuration('Duration unavailable', null), null)

    // In formatStageVideos, unknown video without duration has null duration
    const unknownVids = formatStageVideos([
      {
        id: 'dQw4w9WgXcQ',
        title: 'Unknown Tech Topic',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      }
    ], 'Unknown')

    assert.equal(unknownVids.length, 1)
    assert.equal(unknownVids[0].duration, null)
    assert.equal(unknownVids[0].duration_seconds, null)
  })

  // =========================================================================
  // TEST 5: Backend and frontend use the same duration representation
  // =========================================================================
  await t.test('TEST 5: Backend and frontend use identical canonical duration for W6NZfCO5SIk', () => {
    const backendSimulated = {
      id: 'W6NZfCO5SIk',
      title: 'JavaScript Tutorial for Beginners',
      channel: 'Programming with Mosh',
      url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
      embed_url: 'https://www.youtube.com/embed/W6NZfCO5SIk',
      duration: '48:16',
      duration_seconds: 2896
    }

    const resolved = resolveSkillVideo({
      skill_name: 'JavaScript',
      youtube_videos: [backendSimulated]
    })

    assert.equal(resolved.id, 'W6NZfCO5SIk')
    assert.equal(resolved.duration, '48:16')
    assert.equal(resolved.duration_seconds, 2896)
    assert.equal(resolved.channel, 'Programming with Mosh')

    // Formatted UI string matches
    const uiDuration = formatVideoDuration(resolved.duration, resolved.duration_seconds)
    assert.equal(uiDuration, '48:16')
  })

  // =========================================================================
  // TEST 6: Metadata integrity test
  // =========================================================================
  await t.test('TEST 6: Metadata integrity across id, title, channel, thumbnail, URL, duration', () => {
    const stageVids = formatStageVideos([
      {
        id: 'W6NZfCO5SIk',
        title: 'JavaScript Tutorial for Beginners',
        channel: 'Programming with Mosh',
        duration: '48:16',
        duration_seconds: 2896,
        url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
        embed_url: 'https://www.youtube.com/embed/W6NZfCO5SIk',
        thumbnail: 'https://i.ytimg.com/vi/W6NZfCO5SIk/mqdefault.jpg'
      }
    ], 'JavaScript')

    const video = stageVids[0]
    assert.equal(video.id, 'W6NZfCO5SIk')
    assert.equal(video.channel, 'Programming with Mosh')
    assert.equal(video.duration, '48:16')
    assert.equal(video.duration_seconds, 2896)
    assert.ok(video.url.includes('W6NZfCO5SIk'))
    assert.ok(video.embed_url.includes('W6NZfCO5SIk'))
    assert.ok(video.thumbnail.includes('W6NZfCO5SIk'))
  })

  // =========================================================================
  // TEST 7: Duplicate video records must not have conflicting durations
  // =========================================================================
  await t.test('TEST 7: Duplicate video records deduplicate and enforce canonical duration', () => {
    const raw = [
      {
        id: 'W6NZfCO5SIk',
        title: 'JS Tutorial 1',
        duration: '1 hr 8 mins',
        url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk'
      },
      {
        id: 'W6NZfCO5SIk',
        title: 'JS Tutorial 2',
        duration: '30 mins',
        url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk'
      }
    ]

    const deduped = formatStageVideos(raw, 'JavaScript')
    assert.equal(deduped.length, 1)
    assert.equal(deduped[0].id, 'W6NZfCO5SIk')
    assert.equal(deduped[0].duration, '48:16')
    assert.equal(deduped[0].duration_seconds, 2896)
  })

  // =========================================================================
  // TEST 8: Cached metadata must pass duration validation
  // =========================================================================
  await t.test('TEST 8: fetchStageVideos returns verified duration and updates cache', async () => {
    clearStageVideoCache()

    // Mock API client returning W6NZfCO5SIk
    setApiClient({
      get: async () => ({
        data: {
          videos: [
            {
              id: 'W6NZfCO5SIk',
              title: 'JavaScript Tutorial for Beginners',
              channel: 'Programming with Mosh',
              duration: '48:16',
              duration_seconds: 2896,
              url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
              embed_url: 'https://www.youtube.com/embed/W6NZfCO5SIk'
            }
          ]
        }
      })
    })

    const fetched = await fetchStageVideos({
      skill: 'JavaScript',
      targetRole: 'Software Engineer',
      stage: 'learn',
      language: 'en'
    })

    assert.equal(fetched.length, 1)
    assert.equal(fetched[0].id, 'W6NZfCO5SIk')
    assert.equal(fetched[0].duration, '48:16')
    assert.equal(fetched[0].duration_seconds, 2896)

    // Second call reads from cache
    const fromCache = await fetchStageVideos({
      skill: 'JavaScript',
      targetRole: 'Software Engineer',
      stage: 'learn',
      language: 'en'
    })

    assert.equal(fromCache.length, 1)
    assert.equal(fromCache[0].id, 'W6NZfCO5SIk')
    assert.equal(fromCache[0].duration, '48:16')
    assert.equal(fromCache[0].duration_seconds, 2896)
  })
})
