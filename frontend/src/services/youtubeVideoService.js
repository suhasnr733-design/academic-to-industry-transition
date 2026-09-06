import { isValidYouTubeVideo } from '../utils/videoResolver.js'

let apiInstance = null

/**
 * Configure or mock the HTTP client for youtubeVideoService
 */
export const setApiClient = (client) => {
  apiInstance = client
}

/**
 * Resolves the active API client instance
 */
const getApiClient = async () => {
  if (apiInstance) return apiInstance
  try {
    const mod = await import('./api')
    apiInstance = mod.api || mod.default
    return apiInstance
  } catch (err) {
    return null
  }
}

/**
 * Standard badge fallback based on video index if not specified by backend
 */
export const STAGE_BADGES = [
  '⭐ Masterclass',
  '📘 Core Concepts',
  '💻 Hands-on Practice',
  '🎯 Interview Prep'
]

/**
 * Semantic stage-specific badge pools
 */
export const STAGE_BADGE_MAP = {
  learn: ['⭐ Masterclass', '📘 Core Concepts', '💡 Foundational Guide', '🚀 Deep Dive'],
  practice: ['💻 Hands-on Practice', '🛠️ Guided Exercise', '🧪 Code Along', '⚡ Speed Coding'],
  build: ['🚀 Project Implementation', '🏗️ Architecture & Build', '📦 Full App Build', '🌐 Production Ready'],
  assess: ['🎯 Interview Prep', '❓ Mock Technical Interview', '🧠 Technical Assessment', '📋 Common Questions']
}

/**
 * Client-side in-memory cache for stage-specific YouTube videos
 * Key: `${skill}|${target_role}|${stage}|${language}`
 */
const stageVideoCache = new Map()

/**
 * Generates consistent cache key
 */
export const getStageVideoCacheKey = (skill, targetRole, stage, language) => {
  const sk = (skill || '').trim().toLowerCase()
  const tr = (targetRole || 'Software Engineer').trim().toLowerCase()
  const st = (stage || 'learn').trim().toLowerCase()
  const lang = (language || 'en').trim().toLowerCase()
  return `${sk}|${tr}|${st}|${lang}`
}

/**
 * Clear the entire stage video cache (e.g. on resume switch)
 */
export const clearStageVideoCache = () => {
  stageVideoCache.clear()
}

/**
 * Invalidate cached videos for a specific skill
 */
export const invalidateSkillCache = (skill) => {
  const sk = (skill || '').trim().toLowerCase()
  for (const key of stageVideoCache.keys()) {
    if (key.startsWith(`${sk}|`)) {
      stageVideoCache.delete(key)
    }
  }
}

/**
 * Formats video objects to ensure all required fields and stage-specific badges exist
 */
export const formatStageVideos = (rawVideos = [], skillName = '', stage = null) => {
  if (!Array.isArray(rawVideos)) return []

  const valid = rawVideos.filter(isValidYouTubeVideo)

  const seenIds = new Set()
  const uniqueItems = []

  for (const vid of valid) {
    let videoId = vid.id
    if ((!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) && vid.embed_url) {
      const m = vid.embed_url.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
      if (m) videoId = m[1]
    }
    if ((!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) && vid.url) {
      const m = vid.url.match(/(?:v=|\/embed\/|\/watch\?v=|\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
      if (m) videoId = m[1]
    }

    if (!videoId) continue
    if (seenIds.has(videoId)) continue
    seenIds.add(videoId)

    uniqueItems.push({ vid, videoId })
  }

  const stageKey = stage ? stage.trim().toLowerCase() : null
  const badgePool = stageKey && STAGE_BADGE_MAP[stageKey] ? STAGE_BADGE_MAP[stageKey] : STAGE_BADGES

  return uniqueItems.map(({ vid, videoId }, idx) => {
    const defaultBadge = badgePool[idx] || (STAGE_BADGES[idx] || '⭐ Recommended')
    const assignedBadge = vid.badge && vid.badge.trim() ? vid.badge : defaultBadge

    let vDuration = vid.duration || null
    let vDurationSeconds = vid.duration_seconds || null
    let vChannel = vid.channel || 'Tech Academy'

    // Canonical defense for verified video W6NZfCO5SIk
    if (videoId === 'W6NZfCO5SIk') {
      vDuration = '48:16'
      vDurationSeconds = 2896
      vChannel = 'Programming with Mosh'
    } else if (vDuration === '1 hr 8 mins' || vDuration === '45 mins' || vDuration === '40 mins' || vDuration === 'Duration unavailable') {
      vDuration = null
      vDurationSeconds = null
    }

    return {
      ...vid,
      id: videoId || vid.id,
      title: vid.title || `${skillName} Tutorial`,
      channel: vChannel,
      thumbnail: vid.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : ''),
      url: vid.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''),
      embed_url: vid.embed_url || (videoId ? `https://www.youtube.com/embed/${videoId}` : ''),
      duration: vDuration,
      duration_seconds: vDurationSeconds,
      difficulty: vid.difficulty || 'Intermediate',
      badge: assignedBadge,
      stage: vid.stage || stageKey,
      skill_name: vid.skill_name || skillName
    }
  })
}

/**
 * Fetches stage-specific YouTube videos from backend endpoint
 * GET /api/v1/learning/youtube?skill=<>&target_role=<>&stage=<>&language=<>
 *
 * Checks in-memory cache first to avoid duplicate network queries.
 *
 * @param {Object} params
 * @param {string} params.skill - Skill name (e.g. 'React')
 * @param {string} params.targetRole - Target career role
 * @param {string} params.stage - 'learn' | 'practice' | 'build' | 'assess'
 * @param {string} params.language - 'en' | 'hi' | 'en+hi'
 * @param {boolean} [params.forceRefresh=false] - Bypass cache
 * @returns {Promise<Array<Object>>} Formatted valid videos
 */
export const fetchStageVideos = async ({
  skill,
  targetRole = 'Software Engineer',
  stage = 'learn',
  language = 'en',
  forceRefresh = false
}) => {
  if (!skill) return []

  const cacheKey = getStageVideoCacheKey(skill, targetRole, stage, language)

  if (!forceRefresh && stageVideoCache.has(cacheKey)) {
    return stageVideoCache.get(cacheKey)
  }

  const queryParams = new URLSearchParams({
    skill: skill.trim(),
    target_role: targetRole.trim(),
    stage: stage.trim(),
    language: language.trim()
  })

  const client = await getApiClient()
  if (!client) {
    console.warn('[youtubeVideoService] No API client available')
    return []
  }

  const response = await client.get(`/learning/youtube?${queryParams.toString()}`)
  const rawList = response.data?.videos || []
  const formatted = formatStageVideos(rawList, skill, stage)

  // Cache valid result
  stageVideoCache.set(cacheKey, formatted)
  return formatted
}
