// frontend/src/tests/unit/test_frontend_video_resolver.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveSkillVideo, isValidYouTubeVideo, CURATED_FRONTEND_FALLBACKS } from '../../utils/videoResolver.js'

test('isValidYouTubeVideo validation helper', async (t) => {
  await t.test('accepts valid YouTube video with embed_url and 11-char id', () => {
    const video = {
      id: 'bMknfKXIFA8',
      title: 'React Tutorial',
      embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8',
      url: 'https://www.youtube.com/watch?v=bMknfKXIFA8'
    }
    assert.strictEqual(isValidYouTubeVideo(video), true)
  })

  await t.test('accepts valid video with only embed_url containing 11-char id', () => {
    const video = {
      title: 'React Tutorial',
      embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8'
    }
    assert.strictEqual(isValidYouTubeVideo(video), true)
  })

  await t.test('accepts valid video with only watch URL containing 11-char id', () => {
    const video = {
      title: 'React Tutorial',
      url: 'https://www.youtube.com/watch?v=bMknfKXIFA8'
    }
    assert.strictEqual(isValidYouTubeVideo(video), true)
  })

  await t.test('rejects null or non-object', () => {
    assert.strictEqual(isValidYouTubeVideo(null), false)
    assert.strictEqual(isValidYouTubeVideo(undefined), false)
    assert.strictEqual(isValidYouTubeVideo('not an object'), false)
  })

  await t.test('rejects video with missing urls and missing id', () => {
    assert.strictEqual(isValidYouTubeVideo({ title: 'No URLs' }), false)
  })

  await t.test('rejects search-result query embed URLs', () => {
    const searchVideo = {
      title: 'Search results',
      embed_url: 'https://www.youtube.com/embed?listType=search&list=React'
    }
    assert.strictEqual(isValidYouTubeVideo(searchVideo), false)
  })

  await t.test('rejects legacy dummy placeholder embed URLs', () => {
    const dummyVideo = {
      title: 'Dummy',
      embed_url: 'https://www.youtube.com/embed/8hly31xKLI0'
    }
    assert.strictEqual(isValidYouTubeVideo(dummyVideo), false)
  })
})

test('PHASE 2 - 10 Core Test Scenarios', async (t) => {
  // -------------------------------------------------------------
  // TEST 1 — Backend video wins
  // -------------------------------------------------------------
  await t.test('TEST 1 — Backend video wins over frontend fallback', () => {
    const backendVideo = {
      id: 'backend_react_123',
      title: 'Backend Custom React Masterclass 2026',
      channel: 'Custom Engineering Channel',
      embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      recommendation_source: 'backend_custom'
    }

    const skillObj = {
      skill_name: 'React',
      youtube_videos: [backendVideo]
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result, 'Expected a result')
    assert.strictEqual(result.title, 'Backend Custom React Masterclass 2026')
    assert.strictEqual(result.embed_url, 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    assert.strictEqual(result.recommendation_source, 'backend_custom')
  })

  // -------------------------------------------------------------
  // TEST 2 — Backend Hindi video wins
  // -------------------------------------------------------------
  await t.test('TEST 2 — Backend Hindi video wins over English static fallback', () => {
    const hindiBackendVideo = {
      id: '-mJFZp84TIY',
      title: 'React JS Tutorial in Hindi for Beginners',
      channel: 'CodeWithHarry',
      embed_url: 'https://www.youtube.com/embed/-mJFZp84TIY',
      url: 'https://www.youtube.com/watch?v=-mJFZp84TIY',
      language: 'hi',
      recommendation_source: 'backend_hindi'
    }

    const skillObj = {
      skill_name: 'React',
      youtube_videos: [hindiBackendVideo]
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result)
    assert.strictEqual(result.title, 'React JS Tutorial in Hindi for Beginners')
    assert.strictEqual(result.id, '-mJFZp84TIY')
    assert.strictEqual(result.embed_url, 'https://www.youtube.com/embed/-mJFZp84TIY')
    // Crucially: MUST NOT be the static English fallback 'bMknfKXIFA8'
    assert.notStrictEqual(result.id, 'bMknfKXIFA8')
  })

  // -------------------------------------------------------------
  // TEST 3 — Backend English video wins
  // -------------------------------------------------------------
  await t.test('TEST 3 — Backend English video wins', () => {
    const englishBackendVideo = {
      id: 'bMknfKXIFA8',
      title: 'React.js Complete Masterclass (English)',
      channel: 'freeCodeCamp.org',
      embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8',
      url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
      language: 'en',
      recommendation_source: 'backend_en'
    }

    const skillObj = {
      skill_name: 'React',
      youtube_videos: [englishBackendVideo]
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result)
    assert.strictEqual(result.title, 'React.js Complete Masterclass (English)')
    assert.strictEqual(result.id, 'bMknfKXIFA8')
  })

  // -------------------------------------------------------------
  // TEST 4 — Backend absent
  // -------------------------------------------------------------
  await t.test('TEST 4 — Backend absent: falls back to curated React fallback', () => {
    const skillObj = {
      skill_name: 'React',
      youtube_videos: []
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result, 'Expected curated fallback when backend array is empty')
    assert.strictEqual(result.id, CURATED_FRONTEND_FALLBACKS['react'].id)
    assert.strictEqual(result.recommendation_source, 'frontend_curated_fallback')
  })

  // -------------------------------------------------------------
  // TEST 5 — Backend malformed
  // -------------------------------------------------------------
  await t.test('TEST 5 — Backend malformed: falls back to curated React fallback', () => {
    const skillObj = {
      skill_name: 'React',
      youtube_videos: [
        { title: 'Broken video with no urls' },
        null,
        { embed_url: 'https://www.youtube.com/embed?listType=search&list=React' } // search embed
      ]
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result)
    assert.strictEqual(result.id, CURATED_FRONTEND_FALLBACKS['react'].id)
    assert.strictEqual(result.recommendation_source, 'frontend_curated_fallback')
  })

  // -------------------------------------------------------------
  // TEST 6 — System Design
  // -------------------------------------------------------------
  await t.test('TEST 6 — System Design: backend video wins and does NOT collide with UI/UX Design', () => {
    const systemDesignBackendVideo = {
      id: 'm8Icp_Cid5o',
      title: 'System Design Fundamentals for Engineers',
      channel: 'freeCodeCamp.org',
      embed_url: 'https://www.youtube.com/embed/m8Icp_Cid5o',
      url: 'https://www.youtube.com/watch?v=m8Icp_Cid5o',
      recommendation_source: 'backend_curated'
    }

    const skillObj = {
      skill_name: 'System Design',
      youtube_videos: [systemDesignBackendVideo]
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result)
    assert.strictEqual(result.title, 'System Design Fundamentals for Engineers')
    assert.strictEqual(result.id, 'm8Icp_Cid5o')
    // Must NOT be Figma UI/UX Design (c9Wg6Cb_YlU)
    assert.notStrictEqual(result.id, 'c9Wg6Cb_YlU')
  })

  // -------------------------------------------------------------
  // TEST 7 — Azure
  // -------------------------------------------------------------
  await t.test('TEST 7 — Azure: backend Azure video wins, NEVER AWS', () => {
    const azureBackendVideo = {
      id: '5abffC-K40c',
      title: 'Microsoft Azure Fundamentals AZ-900 Full Course',
      channel: 'freeCodeCamp.org',
      embed_url: 'https://www.youtube.com/embed/5abffC-K40c',
      url: 'https://www.youtube.com/watch?v=5abffC-K40c',
      recommendation_source: 'backend_azure'
    }

    const skillObj = {
      skill_name: 'Azure',
      youtube_videos: [azureBackendVideo]
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result)
    assert.strictEqual(result.id, '5abffC-K40c')
    // MUST NEVER BE AWS ('k1RI5locZE4')
    assert.notStrictEqual(result.id, 'k1RI5locZE4')
  })

  // -------------------------------------------------------------
  // TEST 8 — GCP
  // -------------------------------------------------------------
  await t.test('TEST 8 — GCP: backend GCP video wins, NEVER AWS', () => {
    const gcpBackendVideo = {
      id: 'cbcd6-m8sHg',
      title: 'Google Cloud Digital Leader Certification Course',
      channel: 'freeCodeCamp.org',
      embed_url: 'https://www.youtube.com/embed/cbcd6-m8sHg',
      url: 'https://www.youtube.com/watch?v=cbcd6-m8sHg',
      recommendation_source: 'backend_gcp'
    }

    const skillObj = {
      skill_name: 'GCP',
      youtube_videos: [gcpBackendVideo]
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result)
    assert.strictEqual(result.id, 'cbcd6-m8sHg')
    // MUST NEVER BE AWS ('k1RI5locZE4')
    assert.notStrictEqual(result.id, 'k1RI5locZE4')
  })

  // -------------------------------------------------------------
  // TEST 9 — Terraform
  // -------------------------------------------------------------
  await t.test('TEST 9 — Terraform: backend Terraform video wins, NEVER DSA', () => {
    const terraformBackendVideo = {
      id: 'YcJ9I87-TW8',
      title: 'Terraform Course - Automate your AWS Cloud Infrastructure',
      channel: 'freeCodeCamp.org',
      embed_url: 'https://www.youtube.com/embed/YcJ9I87-TW8',
      url: 'https://www.youtube.com/watch?v=YcJ9I87-TW8',
      recommendation_source: 'backend_terraform'
    }

    const skillObj = {
      skill_name: 'Terraform',
      youtube_videos: [terraformBackendVideo]
    }

    const result = resolveSkillVideo(skillObj)
    assert.ok(result)
    assert.strictEqual(result.id, 'YcJ9I87-TW8')
    // MUST NEVER BE DSA ('0IAPZzGSbME')
    assert.notStrictEqual(result.id, '0IAPZzGSbME')
  })

  // -------------------------------------------------------------
  // TEST 10 — Unknown skill
  // -------------------------------------------------------------
  await t.test('TEST 10 — Unknown skill: returns null / safe empty, NEVER DSA', () => {
    const unknownSkillObj = {
      skill_name: 'CompletelyMadeUpSkill12345',
      youtube_videos: []
    }

    const result = resolveSkillVideo(unknownSkillObj)
    // Must be null / safe empty response
    assert.strictEqual(result, null)
    // MUST NEVER BE DSA ('0IAPZzGSbME')
    if (result) {
      assert.notStrictEqual(result.id, '0IAPZzGSbME')
    }
  })
})

test('Frontend Curated Fallbacks Disambiguation (Backend Offline)', async (t) => {
  await t.test('Azure fallback returns AZ-900, never AWS', () => {
    const result = resolveSkillVideo({ skill_name: 'Azure', youtube_videos: [] })
    assert.ok(result)
    assert.strictEqual(result.id, '5abffC-K40c')
    assert.notStrictEqual(result.id, 'k1RI5locZE4')
  })

  await t.test('GCP fallback returns Google Cloud, never AWS', () => {
    const result = resolveSkillVideo({ skill_name: 'GCP', youtube_videos: [] })
    assert.ok(result)
    assert.strictEqual(result.id, 'cbcd6-m8sHg')
    assert.notStrictEqual(result.id, 'k1RI5locZE4')
  })

  await t.test('Terraform fallback returns Terraform, never DSA', () => {
    const result = resolveSkillVideo({ skill_name: 'Terraform', youtube_videos: [] })
    assert.ok(result)
    assert.strictEqual(result.id, 'YcJ9I87-TW8')
    assert.notStrictEqual(result.id, '0IAPZzGSbME')
  })

  await t.test('System Design fallback returns System Design, never Figma', () => {
    const result = resolveSkillVideo({ skill_name: 'System Design', youtube_videos: [] })
    assert.ok(result)
    assert.strictEqual(result.id, 'm8Icp_Cid5o')
    assert.notStrictEqual(result.id, 'c9Wg6Cb_YlU')
  })

  await t.test('Time Series Analysis fallback does not collide with Time Management', () => {
    const result = resolveSkillVideo({ skill_name: 'Time Series Analysis', youtube_videos: [] })
    assert.ok(result)
    assert.strictEqual(result.id, 'e8Yw4alG16Q')
    assert.notStrictEqual(result.id, 'iONDebHX9qk')
  })

  await t.test('Database Management fallback does not collide with Leadership Management', () => {
    const result = resolveSkillVideo({ skill_name: 'Database Management', youtube_videos: [] })
    assert.ok(result)
    assert.strictEqual(result.id, 'HXV3zeQKqGY')
    assert.notStrictEqual(result.id, 'z44w3jBfJp0')
  })
})
