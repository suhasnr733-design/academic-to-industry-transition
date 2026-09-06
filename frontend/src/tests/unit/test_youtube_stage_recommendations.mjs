// frontend/src/tests/unit/test_youtube_stage_recommendations.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  STAGE_BADGE_MAP,
  STAGE_BADGES,
  formatStageVideos,
  fetchStageVideos,
  setApiClient,
  getStageVideoCacheKey,
  clearStageVideoCache
} from '../../services/youtubeVideoService.js'

test.beforeEach(() => {
  clearStageVideoCache()
})

test('PHASE 3.3 — Stage-Specific Badges & Resolution', async (t) => {

  await t.test('TEST 1: formatStageVideos applies learn stage badges', () => {
    const rawVideos = [
      { id: 'W6NZfCO5SIk', title: 'JS Basics' },
      { id: 'jS4aFq5-91M', title: 'JS Full Course' }
    ]
    const formatted = formatStageVideos(rawVideos, 'JavaScript', 'learn')
    assert.equal(formatted.length, 2)
    assert.equal(formatted[0].badge, '⭐ Masterclass')
    assert.equal(formatted[1].badge, '📘 Core Concepts')
    assert.equal(formatted[0].stage, 'learn')
    assert.equal(formatted[1].stage, 'learn')
  })

  await t.test('TEST 2: formatStageVideos applies practice stage badges', () => {
    const rawVideos = [
      { id: 'dtKciwk_si4', title: '10 JS Projects' },
      { id: '3PHXvlpOkf4', title: '15 JS Projects' }
    ]
    const formatted = formatStageVideos(rawVideos, 'JavaScript', 'practice')
    assert.equal(formatted.length, 2)
    assert.equal(formatted[0].badge, '💻 Hands-on Practice')
    assert.equal(formatted[1].badge, '🛠️ Guided Exercise')
    assert.equal(formatted[0].stage, 'practice')
  })

  await t.test('TEST 3: formatStageVideos applies build stage badges', () => {
    const rawVideos = [
      { id: 'MIYQR-Ybrn4', title: 'Weather App' },
      { id: 'G0jO8kUrg-I', title: 'Todo App' }
    ]
    const formatted = formatStageVideos(rawVideos, 'JavaScript', 'build')
    assert.equal(formatted.length, 2)
    assert.equal(formatted[0].badge, '🚀 Project Implementation')
    assert.equal(formatted[1].badge, '🏗️ Architecture & Build')
    assert.equal(formatted[0].stage, 'build')
  })

  await t.test('TEST 4: formatStageVideos applies assess stage badges', () => {
    const rawVideos = [
      { id: 'MX48mv73jf8', title: 'Top 30 JS Questions' },
      { id: 'AUTO7ALJk2U', title: 'Top 100 JS Questions' }
    ]
    const formatted = formatStageVideos(rawVideos, 'JavaScript', 'assess')
    assert.equal(formatted.length, 2)
    assert.equal(formatted[0].badge, '🎯 Interview Prep')
    assert.equal(formatted[1].badge, '❓ Mock Technical Interview')
    assert.equal(formatted[0].stage, 'assess')
  })

  await t.test('TEST 5: fetchStageVideos passes stage parameter in query string and isolates cache', async () => {
    let capturedUrl = null
    const mockClient = {
      get: async (url) => {
        capturedUrl = url
        if (url.includes('stage=practice')) {
          return {
            data: {
              videos: [
                { id: 'dtKciwk_si4', title: '10 JS Projects', channel: 'Florin Pop', duration: '9:17:08', duration_seconds: 33428 }
              ]
            }
          }
        }
        return {
          data: {
            videos: [
              { id: 'W6NZfCO5SIk', title: 'JS Tutorial', channel: 'Programming with Mosh', duration: '48:16', duration_seconds: 2896 }
            ]
          }
        }
      }
    }

    setApiClient(mockClient)

    // Call for learn stage
    const learnVideos = await fetchStageVideos({ skill: 'JavaScript', stage: 'learn' })
    assert.ok(capturedUrl.includes('stage=learn'))
    assert.equal(learnVideos[0].id, 'W6NZfCO5SIk')

    // Call for practice stage
    const practiceVideos = await fetchStageVideos({ skill: 'JavaScript', stage: 'practice' })
    assert.ok(capturedUrl.includes('stage=practice'))
    assert.equal(practiceVideos[0].id, 'dtKciwk_si4')

    // Verify cache isolation between stages
    const keyLearn = getStageVideoCacheKey('JavaScript', 'Software Engineer', 'learn', 'en')
    const keyPractice = getStageVideoCacheKey('JavaScript', 'Software Engineer', 'practice', 'en')
    assert.notEqual(keyLearn, keyPractice)
  })

  await t.test('TEST 6: Canonical duration preservation for W6NZfCO5SIk across stages', () => {
    const raw = [{ id: 'W6NZfCO5SIk', title: 'JS', duration: '1 hr 8 mins' }]
    const formatted = formatStageVideos(raw, 'JavaScript', 'learn')
    assert.equal(formatted[0].duration, '48:16')
    assert.equal(formatted[0].duration_seconds, 2896)
  })
})
