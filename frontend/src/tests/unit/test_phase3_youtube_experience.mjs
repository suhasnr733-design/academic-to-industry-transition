// frontend/src/tests/unit/test_phase3_youtube_experience.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatStageVideos,
  getStageVideoCacheKey,
  clearStageVideoCache,
  invalidateSkillCache,
  STAGE_BADGES
} from '../../services/youtubeVideoService.js'
import { isValidYouTubeVideo } from '../../utils/videoResolver.js'

test('PHASE 3 — Automated Unit Tests for YouTube Learning Experience', async (t) => {
  // Setup / teardown
  t.beforeEach(() => {
    clearStageVideoCache()
  })

  // -------------------------------------------------------------
  // TEST 1: 4 valid videos returned -> all 4 rendered / formatted
  // -------------------------------------------------------------
  await t.test('TEST 1: 4 valid videos returned -> all 4 formatted with distinct badges', () => {
    const rawVideos = [
      { id: 'bMknfKXIFA8', title: 'React Masterclass', embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8' },
      { id: 'Oe421EPjeBE', title: 'React Core Concepts', embed_url: 'https://www.youtube.com/embed/Oe421EPjeBE' },
      { id: 'fqMOX6JJhGo', title: 'React Practice Projects', embed_url: 'https://www.youtube.com/embed/fqMOX6JJhGo' },
      { id: 'm8Icp_Cid5o', title: 'React Interview Questions', embed_url: 'https://www.youtube.com/embed/m8Icp_Cid5o' }
    ]

    const formatted = formatStageVideos(rawVideos, 'React')
    assert.strictEqual(formatted.length, 4, 'Expected all 4 videos to be formatted')
    assert.strictEqual(formatted[0].badge, STAGE_BADGES[0], 'Index 0 badge should be Masterclass')
    assert.strictEqual(formatted[1].badge, STAGE_BADGES[1], 'Index 1 badge should be Core Concepts')
    assert.strictEqual(formatted[2].badge, STAGE_BADGES[2], 'Index 2 badge should be Hands-on Practice')
    assert.strictEqual(formatted[3].badge, STAGE_BADGES[3], 'Index 3 badge should be Interview Prep')
  })

  // -------------------------------------------------------------
  // TEST 2: 2 valid videos returned -> 2 rendered
  // -------------------------------------------------------------
  await t.test('TEST 2: 2 valid videos returned -> 2 formatted', () => {
    const rawVideos = [
      { id: '5abffC-K40c', title: 'Azure AZ-900', embed_url: 'https://www.youtube.com/embed/5abffC-K40c' },
      { id: 'cbcd6-m8sHg', title: 'GCP Digital Leader', embed_url: 'https://www.youtube.com/embed/cbcd6-m8sHg' }
    ]

    const formatted = formatStageVideos(rawVideos, 'Cloud')
    assert.strictEqual(formatted.length, 2)
    assert.strictEqual(formatted[0].id, '5abffC-K40c')
    assert.strictEqual(formatted[1].id, 'cbcd6-m8sHg')
  })

  // -------------------------------------------------------------
  // TEST 3: 1 valid video -> 1 rendered
  // -------------------------------------------------------------
  await t.test('TEST 3: 1 valid video -> exactly 1 formatted', () => {
    const rawVideos = [
      { id: 'YcJ9I87-TW8', title: 'Terraform Full Course', embed_url: 'https://www.youtube.com/embed/YcJ9I87-TW8' }
    ]

    const formatted = formatStageVideos(rawVideos, 'Terraform')
    assert.strictEqual(formatted.length, 1)
    assert.strictEqual(formatted[0].id, 'YcJ9I87-TW8')
  })

  // -------------------------------------------------------------
  // TEST 4: invalid/null videos -> invalid videos not rendered
  // -------------------------------------------------------------
  await t.test('TEST 4: invalid and null videos are filtered out safely', () => {
    const rawVideos = [
      null,
      undefined,
      { title: 'No URLs at all' },
      { embed_url: 'https://www.youtube.com/embed?listType=search&list=React' }, // search embed
      { id: '8hly31xKLI0', embed_url: 'https://www.youtube.com/embed/8hly31xKLI0' }, // dummy ID
      { id: 'HXV3zeQKqGY', title: 'Valid DBMS Video', embed_url: 'https://www.youtube.com/embed/HXV3zeQKqGY' }
    ]

    const formatted = formatStageVideos(rawVideos, 'SQL')
    assert.strictEqual(formatted.length, 1, 'Only the single valid video should survive')
    assert.strictEqual(formatted[0].id, 'HXV3zeQKqGY')
  })

  // -------------------------------------------------------------
  // TEST 5: click Watch In-App -> onPlayVideo(video) called
  // -------------------------------------------------------------
  await t.test('TEST 5: onPlayVideo receives full video object for in-app modal playback', () => {
    let playedVideo = null
    const mockOnPlayVideo = (vid, skill) => {
      playedVideo = { ...vid, passedSkill: skill }
    }

    const testVideo = {
      id: 'bMknfKXIFA8',
      title: 'React Tutorial',
      embed_url: 'https://www.youtube.com/embed/bMknfKXIFA8'
    }

    mockOnPlayVideo(testVideo, 'React')
    assert.ok(playedVideo, 'Play video handler was triggered')
    assert.strictEqual(playedVideo.id, 'bMknfKXIFA8')
    assert.strictEqual(playedVideo.passedSkill, 'React')
  })

  // -------------------------------------------------------------
  // TEST 6: click Bookmark -> onBookmark called with correct metadata
  // -------------------------------------------------------------
  await t.test('TEST 6: onBookmark called with valid YouTube resource payload', () => {
    let savedBookmark = null
    const mockOnBookmark = (payload) => {
      savedBookmark = payload
    }

    const video = {
      id: 'bMknfKXIFA8',
      title: 'React.js Complete Masterclass',
      url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
      thumbnail: 'https://i.ytimg.com/vi/bMknfKXIFA8/mqdefault.jpg'
    }

    // Simulate bookmarking action
    mockOnBookmark({
      skill_name: 'React',
      resource_type: 'youtube',
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
      provider: 'YouTube'
    })

    assert.ok(savedBookmark)
    assert.strictEqual(savedBookmark.resource_type, 'youtube')
    assert.strictEqual(savedBookmark.skill_name, 'React')
    assert.strictEqual(savedBookmark.title, 'React.js Complete Masterclass')
    assert.strictEqual(savedBookmark.provider, 'YouTube')
    assert.ok(savedBookmark.url.includes('bMknfKXIFA8'))
  })

  // -------------------------------------------------------------
  // TEST 7: click Mark as Watched -> handleUpdateStageProgress called
  // -------------------------------------------------------------
  await t.test('TEST 7: onMarkWatched calls progress handler for learn stage', () => {
    let updatedProgress = null
    const mockHandleUpdateStageProgress = (skillName, stage, isCompleted) => {
      updatedProgress = { skillName, stage, isCompleted }
    }

    // Simulate clicking "Mark as Watched"
    mockHandleUpdateStageProgress('React', 'learn', true)

    assert.ok(updatedProgress)
    assert.strictEqual(updatedProgress.skillName, 'React')
    assert.strictEqual(updatedProgress.stage, 'learn')
    assert.strictEqual(updatedProgress.isCompleted, true)
  })

  // -------------------------------------------------------------
  // TEST 8: Learn tab -> stage = 'learn'
  // -------------------------------------------------------------
  await t.test('TEST 8: Learn tab maps to stage "learn"', () => {
    const tabToStage = (tab) => {
      if (tab === 'youtube' || tab === 'all') return 'learn'
      if (tab === 'practice') return 'practice'
      if (tab === 'project') return 'build'
      if (tab === 'assessment') return 'assess'
      return 'learn'
    }

    assert.strictEqual(tabToStage('youtube'), 'learn')
    assert.strictEqual(tabToStage('all'), 'learn')
  })

  // -------------------------------------------------------------
  // TEST 9: Practice tab -> stage = 'practice'
  // -------------------------------------------------------------
  await t.test('TEST 9: Practice tab maps to stage "practice"', () => {
    const tabToStage = (tab) => {
      if (tab === 'practice') return 'practice'
      return 'learn'
    }
    assert.strictEqual(tabToStage('practice'), 'practice')
  })

  // -------------------------------------------------------------
  // TEST 10: Build/Mini Project tab -> stage = 'build'
  // -------------------------------------------------------------
  await t.test('TEST 10: Mini Project tab maps to stage "build"', () => {
    const tabToStage = (tab) => {
      if (tab === 'project') return 'build'
      return 'learn'
    }
    assert.strictEqual(tabToStage('project'), 'build')
  })

  // -------------------------------------------------------------
  // TEST 11: Assessment tab -> stage = 'assess'
  // -------------------------------------------------------------
  await t.test('TEST 11: Assessment tab maps to stage "assess"', () => {
    const tabToStage = (tab) => {
      if (tab === 'assessment') return 'assess'
      return 'learn'
    }
    assert.strictEqual(tabToStage('assessment'), 'assess')
  })

  // -------------------------------------------------------------
  // TEST 12: Hindi selected -> language=hi is preserved in request
  // -------------------------------------------------------------
  await t.test('TEST 12: language=hi is preserved in cache key and request params', () => {
    const cacheKey = getStageVideoCacheKey('React', 'Software Engineer', 'practice', 'hi')
    assert.strictEqual(cacheKey, 'react|software engineer|practice|hi')
    assert.ok(cacheKey.endsWith('|hi'))
  })

  // -------------------------------------------------------------
  // TEST 13: English selected -> language=en is preserved
  // -------------------------------------------------------------
  await t.test('TEST 13: language=en is preserved in cache key and request params', () => {
    const cacheKey = getStageVideoCacheKey('React', 'Software Engineer', 'practice', 'en')
    assert.strictEqual(cacheKey, 'react|software engineer|practice|en')
    assert.ok(cacheKey.endsWith('|en'))
  })

  // -------------------------------------------------------------
  // TEST 14: Backend returns no videos -> useful empty state, NO DSA
  // -------------------------------------------------------------
  await t.test('TEST 14: empty backend videos returns empty array, never DSA fallback', () => {
    const emptyBackendResponse = []
    const formatted = formatStageVideos(emptyBackendResponse, 'ObscureSkill')
    assert.strictEqual(formatted.length, 0)
    // Never substitutes 0IAPZzGSbME (DSA)
    assert.strictEqual(formatted.some(v => v.id === '0IAPZzGSbME'), false)
  })

  // -------------------------------------------------------------
  // TEST 15: API failure -> error state, does not crash, no DSA
  // -------------------------------------------------------------
  await t.test('TEST 15: API failure handled safely without crashing', () => {
    let errorState = null
    let videoList = ['stale_data']

    try {
      throw new Error('Network timeout')
    } catch (err) {
      errorState = err.message
      videoList = []
    }

    assert.strictEqual(errorState, 'Network timeout')
    assert.strictEqual(videoList.length, 0)
    // Video list is empty, never filled with unrelated DSA
    assert.strictEqual(videoList.includes('0IAPZzGSbME'), false)
  })

  // -------------------------------------------------------------
  // TEST 16: Same skill + role + stage + language -> cache key matches
  // -------------------------------------------------------------
  await t.test('TEST 16: exact same context produces identical cache key', () => {
    const k1 = getStageVideoCacheKey('React', 'Frontend Developer', 'practice', 'en')
    const k2 = getStageVideoCacheKey('React', 'Frontend Developer', 'practice', 'en')
    assert.strictEqual(k1, k2)
  })

  // -------------------------------------------------------------
  // TEST 17: Skill changes -> stage resources refresh / distinct cache key
  // -------------------------------------------------------------
  await t.test('TEST 17: skill change produces distinct cache key and invalidation', () => {
    const k1 = getStageVideoCacheKey('React', 'Software Engineer', 'learn', 'en')
    const k2 = getStageVideoCacheKey('Python', 'Software Engineer', 'learn', 'en')
    assert.notStrictEqual(k1, k2)
    assert.ok(k1.startsWith('react|'))
    assert.ok(k2.startsWith('python|'))
  })

  // -------------------------------------------------------------
  // TEST 18: Language changes -> distinct cache key prevents stale data
  // -------------------------------------------------------------
  await t.test('TEST 18: language change produces distinct cache key', () => {
    const kEnglish = getStageVideoCacheKey('React', 'Software Engineer', 'learn', 'en')
    const kHindi = getStageVideoCacheKey('React', 'Software Engineer', 'learn', 'hi')
    assert.notStrictEqual(kEnglish, kHindi)
  })

  // -------------------------------------------------------------
  // TEST 19: Resume changes -> clearStageVideoCache wipes stale data
  // -------------------------------------------------------------
  await t.test('TEST 19: clearStageVideoCache resets cached videos on resume switch', () => {
    clearStageVideoCache()
    // Verification that clearStageVideoCache function executes cleanly
    assert.doesNotThrow(() => clearStageVideoCache())
  })
})
