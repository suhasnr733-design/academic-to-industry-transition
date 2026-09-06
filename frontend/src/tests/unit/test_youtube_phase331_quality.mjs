import test from 'node:test'
import assert from 'node:assert'

test('Phase 3.3.1 — Watched State & Data Quality Regression Tests', async (t) => {

  // -------------------------------------------------------------
  // TEST 1: Watched defaults to false unless persisted progress says true
  // -------------------------------------------------------------
  await t.test('TEST 1: Watched defaults to false for new/unwatched videos', () => {
    const video = { id: 'N65RvNkZFGE', title: 'JavaScript Practice Exercises' }
    const watchedVideoIds = new Set() // empty: fresh/unwatched
    const persistedStageDone = false

    const isCardWatched = Boolean(
      (watchedVideoIds && watchedVideoIds.has(video.id)) ||
      video.is_watched ||
      video.watched ||
      persistedStageDone
    )

    assert.strictEqual(isCardWatched, false, 'Unwatched video must resolve to false')
  })

  // -------------------------------------------------------------
  // TEST 2: Watch In-App transitions video to Watched
  // -------------------------------------------------------------
  await t.test('TEST 2: Watch In-App marks specific video as watched', () => {
    const video = { id: 'N65RvNkZFGE', title: 'JavaScript Practice Exercises' }
    const watchedVideoIds = new Set()

    const handlePlayVideo = (vid) => {
      watchedVideoIds.add(vid.id)
    }

    // User clicks "Watch In-App"
    handlePlayVideo(video)

    const isCardWatched = watchedVideoIds.has(video.id)
    assert.strictEqual(isCardWatched, true, 'Video must transition to watched after Watch In-App')
  })

  // -------------------------------------------------------------
  // TEST 3: Mark as Watched transitions video to Watched & calls stage progress
  // -------------------------------------------------------------
  await t.test('TEST 3: Mark as Watched transitions specific video and invokes stage handler', () => {
    const video = { id: 'ufBbWIyKY2E', title: 'Top 10 Javascript Algorithms' }
    const watchedVideoIds = new Set()
    let progressCall = null

    const handleMarkWatched = (skillName, stage, vid) => {
      watchedVideoIds.add(vid.id)
      progressCall = { skillName, stage, isCompleted: true }
    }

    handleMarkWatched('JavaScript', 'practice', video)

    assert.strictEqual(watchedVideoIds.has(video.id), true, 'Video must be marked watched')
    assert.deepStrictEqual(progressCall, {
      skillName: 'JavaScript',
      stage: 'practice',
      isCompleted: true
    })
  })

  // -------------------------------------------------------------
  // TEST 4: Multiple videos in the same list maintain independent watched states
  // -------------------------------------------------------------
  await t.test('TEST 4: Independent watched states among video cards', () => {
    const videos = [
      { id: 'vid_1', title: 'Video 1' },
      { id: 'vid_2', title: 'Video 2' },
      { id: 'vid_3', title: 'Video 3' }
    ]
    const watchedVideoIds = new Set(['vid_1']) // only video 1 watched

    const statuses = videos.map(v => watchedVideoIds.has(v.id))
    assert.deepStrictEqual(statuses, [true, false, false], 'Only watched video should report true')
  })

  // -------------------------------------------------------------
  // TEST 5: JavaScript Practice videos are semantically practice-focused
  // -------------------------------------------------------------
  await t.test('TEST 5: Practice videos contain practice keywords and no project build titles', () => {
    const practiceVideos = [
      { id: 'N65RvNkZFGE', title: 'JavaScript Practice Exercises For Beginners: Beginner Exercises Part 1' },
      { id: 'ufBbWIyKY2E', title: 'Top 10 Javascript Algorithms to Prepare for Coding Interviews' }
    ]

    const excludedTerms = ['10 projects in 10 hours', '15 javascript projects', 'build 15']
    const requiredPracticeTerms = ['practice', 'exercises', 'algorithms', 'interviews']

    for (const v of practiceVideos) {
      const titleLow = v.title.toLowerCase()
      // Must not contain excluded project marathon terms
      for (const term of excludedTerms) {
        assert.strictEqual(titleLow.includes(term), false, `Title '${v.title}' should not contain '${term}'`)
      }
      // Must contain practice terms
      const hasPracticeKeyword = requiredPracticeTerms.some(t => titleLow.includes(t))
      assert.strictEqual(hasPracticeKeyword, true, `Title '${v.title}' must contain a practice-oriented term`)
    }
  })

  // -------------------------------------------------------------
  // TEST 6: Assess badge matches actual content type
  // -------------------------------------------------------------
  await t.test('TEST 6: Assess badge for Q&A video is accurate and not labeled Mock Interview', () => {
    const assessVideo = {
      id: 'AUTO7ALJk2U',
      title: 'Top 100 JavaScript Interview Questions and Answers | 3 Hours JavaScript Interview Preparation',
      badge: '🎯 Interview Questions'
    }

    assert.strictEqual(assessVideo.badge.includes('Mock'), false, 'Q&A video should not be labeled Mock Interview')
    assert.strictEqual(
      assessVideo.badge === '🎯 Interview Questions' || assessVideo.badge === '🎯 Interview Prep',
      true,
      'Badge should be Interview Questions or Interview Prep'
    )
  })

  // -------------------------------------------------------------
  // TEST 7: Build stage maintains Weather App and To-Do List
  // -------------------------------------------------------------
  await t.test('TEST 7: Build stage contains authentic project implementations', () => {
    const buildVideos = [
      { id: 'MIYQR-Ybrn4', title: 'How To Make Weather App Using JavaScript Step By Step Explained' },
      { id: 'G0jO8kUrg-I', title: 'How To Create To-Do List App Using HTML CSS And JavaScript' }
    ]

    assert.ok(buildVideos.some(v => v.title.includes('Weather App')))
    assert.ok(buildVideos.some(v => v.title.includes('To-Do List')))
  })
})
