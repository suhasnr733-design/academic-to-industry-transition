// frontend/src/utils/videoResolver.js

/**
 * YouTube Video Resolution Utility for Learning Page
 *
 * Enforces strict priority hierarchy:
 * 1. Backend-provided valid YouTube video (highest priority, language/stage/role-aware)
 * 2. Curated frontend fallback (backup only when backend has no valid videos)
 * 3. Safe category fallback
 * 4. Safe null response (NEVER falls back to unrelated DSA videos)
 */

/**
 * Validates whether a video object represents a usable, embeddable YouTube video.
 * Rejects null/undefined, missing URLs, search-result embeds, and known broken IDs.
 *
 * @param {Object} video - Video resource object
 * @returns {boolean}
 */
export const isValidYouTubeVideo = (video) => {
  if (!video || typeof video !== 'object') return false

  const embedUrl = (video.embed_url || '').trim()
  const url = (video.url || '').trim()
  const id = (video.id || '').toString().trim()

  // Must have at least an embed URL, watch URL, or valid YouTube ID
  if (!embedUrl && !url && !id) return false

  // Reject search-result embed URLs (require direct video embeds)
  if (embedUrl.includes('listType=search') || url.includes('listType=search')) return false

  // Reject known broken or dummy placeholders
  if (embedUrl.includes('8hly31xKLI0') || embedUrl.includes('bbT_bV0Cc-0')) return false

  // Check 11-character YouTube video ID
  if (id && !id.startsWith('fallback') && !id.startsWith('search_') && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return true
  }

  // Check embedded 11-character video ID in embed_url
  if (/\/embed\/([a-zA-Z0-9_-]{11})/.test(embedUrl)) {
    return true
  }

  // Check embedded 11-character video ID in watch/short URL
  if (/(?:v=|\/embed\/|\/watch\?v=|\.be\/)([a-zA-Z0-9_-]{11})/.test(url)) {
    return true
  }

  // If embed_url is a well-formed youtube.com/embed link
  if (embedUrl.startsWith('https://www.youtube.com/embed/')) {
    return true
  }

  return false
}

/**
 * Curated backup video catalog with verified, embeddable YouTube videos.
 * USED EXCLUSIVELY AS A FALLBACK when the backend delivers no usable videos.
 */
export const CURATED_FRONTEND_FALLBACKS = {
  // Web & Frontend
  'html': { id: 'pQN-pnXPaVg', title: 'HTML Full Course for Beginners', channel: 'freeCodeCamp.org', category: 'Web / Frontend' },
  'css': { id: '1Rs2ND1ryYc', title: 'CSS Flexbox & Responsive Design Masterclass', channel: 'Traversy Media', category: 'Web / Frontend' },
  'javascript': { id: 'W6NZfCO5SIk', title: 'JavaScript Tutorial for Beginners', channel: 'Programming with Mosh', duration: '48:16', duration_seconds: 2896, category: 'Web / Frontend' },
  'typescript': { id: 'd56mG7DezGs', title: 'TypeScript Course for Beginners', channel: 'freeCodeCamp.org', category: 'Web / Frontend' },
  'react': { id: 'bMknfKXIFA8', title: 'React.js Complete Masterclass', channel: 'freeCodeCamp.org', category: 'Web / Frontend' },
  'react.js': { id: 'bMknfKXIFA8', title: 'React.js Complete Masterclass', channel: 'freeCodeCamp.org', category: 'Web / Frontend' },
  'angular': { id: 'k5E2AVpwsko', title: 'Angular Tutorial for Beginners', channel: 'Programming with Mosh', category: 'Web / Frontend' },
  'vue': { id: 'qZXt1Aom3Cs', title: 'Vue JS Crash Course', channel: 'Traversy Media', category: 'Web / Frontend' },
  'next.js': { id: 'Sklc_fQBmcs', title: 'Next.js Full Course for Beginners', channel: 'freeCodeCamp.org', category: 'Web / Frontend' },
  'tailwind css': { id: 'dFgzHOX84xQ', title: 'Tailwind CSS Crash Course', channel: 'Traversy Media', category: 'Web / Frontend' },

  // Backend & APIs
  'node.js': { id: 'Oe421EPjeBE', title: 'Node.js and Express.js - Full Course', channel: 'freeCodeCamp.org', category: 'Backend' },
  'express.js': { id: 'Oe421EPjeBE', title: 'Node.js and Express.js - Full Course', channel: 'freeCodeCamp.org', category: 'Backend' },
  'django': { id: 'F5mRW0joWI0', title: 'Django Full Course for Beginners', channel: 'freeCodeCamp.org', category: 'Backend' },
  'spring boot': { id: '35EQXmHKZYs', title: 'Spring Boot Tutorial for Beginners', channel: 'Programming with Mosh', category: 'Backend' },
  'fastapi': { id: '0sOvCWFmrtA', title: 'FastAPI Course for Beginners', channel: 'freeCodeCamp.org', category: 'Backend' },
  'rest api': { id: '-MTSQjw5DrM', title: 'REST API Tutorial & Best Practices', channel: 'freeCodeCamp.org', category: 'Backend' },

  // Programming Languages
  'python': { id: 'rfscVS0vtbw', title: 'Python for Beginners - Full Course', channel: 'freeCodeCamp.org', category: 'Programming Languages' },
  'java': { id: 'eIrMbAQSU34', title: 'Java Tutorial for Beginners - Full Course', channel: 'Programming with Mosh', category: 'Programming Languages' },
  'c++': { id: 'vLnPwxZdW4Y', title: 'C++ Programming Tutorial for Beginners', channel: 'freeCodeCamp.org', category: 'Programming Languages' },
  'c': { id: 'KJgsSFOSQv0', title: 'C Programming Tutorial for Beginners', channel: 'freeCodeCamp.org', category: 'Programming Languages' },
  'c#': { id: 'gfkTfcpWqAY', title: 'C# Tutorial for Beginners', channel: 'Programming with Mosh', category: 'Programming Languages' },
  'go': { id: 'un6ZyFkqF77', title: 'Go / Golang Programming Tutorial', channel: 'freeCodeCamp.org', category: 'Programming Languages' },

  // Databases & Storage (Cleanly separated from Leadership/Soft Skills)
  'sql': { id: 'HXV3zeQKqGY', title: 'SQL & Relational Databases Masterclass', channel: 'freeCodeCamp.org', category: 'Database' },
  'dbms': { id: 'HXV3zeQKqGY', title: 'Database Management Systems (DBMS) Masterclass', channel: 'freeCodeCamp.org', category: 'Database' },
  'database management': { id: 'HXV3zeQKqGY', title: 'Database Management Systems (DBMS) Masterclass', channel: 'freeCodeCamp.org', category: 'Database' },
  'postgresql': { id: 'qw--VYLpxG4', title: 'PostgreSQL Tutorial for Beginners', channel: 'freeCodeCamp.org', category: 'Database' },
  'mysql': { id: '7S_tz1z_5bA', title: 'MySQL Tutorial for Beginners - Full Course', channel: 'Programming with Mosh', category: 'Database' },
  'mongodb': { id: 'ofme2o29ngU', title: 'MongoDB Full Tutorial for Beginners', channel: 'freeCodeCamp.org', category: 'Database' },
  'redis': { id: 'XCsS_NVAa1g', title: 'Redis Crash Course for Beginners', channel: 'freeCodeCamp.org', category: 'Database' },

  // Cloud Providers (Strictly Disambiguated — Azure & GCP NEVER map to AWS)
  'aws': { id: 'k1RI5locZE4', title: 'AWS Certified Cloud Practitioner Training', channel: 'freeCodeCamp.org', category: 'Cloud' },
  'azure': { id: '5abffC-K40c', title: 'Microsoft Azure Fundamentals AZ-900 Full Course', channel: 'freeCodeCamp.org', category: 'Cloud' },
  'gcp': { id: 'cbcd6-m8sHg', title: 'Google Cloud Digital Leader Certification Course', channel: 'freeCodeCamp.org', category: 'Cloud' },
  'google cloud': { id: 'cbcd6-m8sHg', title: 'Google Cloud Digital Leader Certification Course', channel: 'freeCodeCamp.org', category: 'Cloud' },
  'cloud computing': { id: 'k1RI5locZE4', title: 'Cloud Computing Architecture & Fundamentals', channel: 'freeCodeCamp.org', category: 'Cloud' },

  // DevOps, Infrastructure & Tools
  'docker': { id: 'fqMOX6JJhGo', title: 'Docker Tutorial for Beginners', channel: 'Programming with Mosh', category: 'DevOps' },
  'kubernetes': { id: 'X48VuDVv0do', title: 'Kubernetes Tutorial for Beginners', channel: 'TechWorld with Nana', category: 'DevOps' },
  'k8s': { id: 'X48VuDVv0do', title: 'Kubernetes Tutorial for Beginners', channel: 'TechWorld with Nana', category: 'DevOps' },
  'ci/cd': { id: 'R8_veQiYBjU', title: 'CI/CD & DevOps Pipeline Tutorial', channel: 'TechWorld with Nana', category: 'DevOps' },
  'cicd': { id: 'R8_veQiYBjU', title: 'CI/CD & DevOps Pipeline Tutorial', channel: 'TechWorld with Nana', category: 'DevOps' },
  'devops': { id: 'R8_veQiYBjU', title: 'DevOps Engineering Full Course', channel: 'freeCodeCamp.org', category: 'DevOps' },
  'git': { id: '8JJ101D3knE', title: 'Git & GitHub Crash Course for Beginners', channel: 'Traversy Media', category: 'Development Tools' },
  'terraform': { id: 'YcJ9I87-TW8', title: 'Terraform Course - Automate your AWS Cloud Infrastructure', channel: 'freeCodeCamp.org', category: 'DevOps' },
  'linux': { id: 'wBp0Rb-ZJak', title: 'Linux Operating System & Shell Scripting Masterclass', channel: 'freeCodeCamp.org', category: 'Development Tools' },
  'postman': { id: 'VywxIQ2ZXw4', title: 'Postman API Testing Full Course', channel: 'freeCodeCamp.org', category: 'Development Tools' },
  'jira': { id: '6Ols5_lR9u8', title: 'Jira & Agile Project Management Tutorial', channel: 'freeCodeCamp.org', category: 'Development Tools' },
  'vs code': { id: 'VqCgcpAypFQ', title: 'VS Code Tutorial for Beginners - Full Course', channel: 'freeCodeCamp.org', category: 'Development Tools' },
  'vscode': { id: 'VqCgcpAypFQ', title: 'VS Code Tutorial for Beginners - Full Course', channel: 'freeCodeCamp.org', category: 'Development Tools' },

  // Architecture & Systems (Cleanly separated from UI/UX Design)
  'system design': { id: 'm8Icp_Cid5o', title: 'System Design Fundamentals for Engineers', channel: 'freeCodeCamp.org', category: 'Architecture' },
  'software architecture': { id: 'm8Icp_Cid5o', title: 'System Design Fundamentals for Engineers', channel: 'freeCodeCamp.org', category: 'Architecture' },
  'distributed systems': { id: 'cQP8WApzIQQ', title: 'Distributed Systems Lecture Series', channel: 'MIT 6.824', category: 'Architecture' },
  'operating systems': { id: 'bkSWJJZNgf8', title: 'Operating Systems Complete Masterclass', channel: 'Neso Academy', category: 'Computer Science' },

  // AI, Data Science & Analytics
  'machine learning': { id: 'i_LwzRVP7bg', title: 'Machine Learning Course for Beginners', channel: 'freeCodeCamp.org', category: 'AI / ML' },
  'deep learning': { id: 'aircAruvnKk', title: 'Deep Learning Crash Course for Engineers', channel: 'freeCodeCamp.org', category: 'AI / ML' },
  'artificial intelligence': { id: 'i_LwzRVP7bg', title: 'Artificial Intelligence & Machine Learning Full Course', channel: 'freeCodeCamp.org', category: 'AI / ML' },
  'nlp': { id: 'fNxaJsNG3-s', title: 'Natural Language Processing (NLP) Complete Masterclass', channel: 'freeCodeCamp.org', category: 'AI / ML' },
  'computer vision': { id: 'oXlwWbU8l2o', title: 'Computer Vision Course with OpenCV and Python', channel: 'freeCodeCamp.org', category: 'AI / ML' },
  'tensorflow': { id: 'tPYj3Ng4Y40', title: 'TensorFlow 2.0 Complete Course', channel: 'freeCodeCamp.org', category: 'AI / ML' },
  'pytorch': { id: 'V_xro1bcAuA', title: 'PyTorch for Deep Learning Full Course', channel: 'freeCodeCamp.org', category: 'AI / ML' },
  'data analytics': { id: 'r-uOLxNrNk8', title: 'Data Analysis with Python Course', channel: 'freeCodeCamp.org', category: 'Data / Analytics' },
  'data science': { id: 'r-uOLxNrNk8', title: 'Data Science Full Course for Beginners', channel: 'freeCodeCamp.org', category: 'Data / Analytics' },
  'power bi': { id: 'TmhQCQr_DCA', title: 'Power BI Tutorial for Beginners', channel: 'edureka!', category: 'Data / Analytics' },
  'tableau': { id: 'aHaOIvR00So', title: 'Tableau for Beginners', channel: 'freeCodeCamp.org', category: 'Data / Analytics' },
  'pandas': { id: 'r-uOLxNrNk8', title: 'Python Data Analysis & Pandas Masterclass', channel: 'freeCodeCamp.org', category: 'Data / Analytics' },
  'time series analysis': { id: 'e8Yw4alG16Q', title: 'Time Series Analysis in Python', channel: 'edureka!', category: 'Data / Analytics' },

  // Foundational Computer Science
  'data structures': { id: 'RBSGKlAvoiM', title: 'Data Structures Complete Masterclass', channel: 'freeCodeCamp.org', category: 'Computer Science' },
  'algorithms': { id: '0IAPZzGSbME', title: 'Algorithms & Problem Solving Masterclass', channel: 'freeCodeCamp.org', category: 'Computer Science' },
  'problem solving': { id: '0IAPZzGSbME', title: 'Algorithms & Problem Solving Masterclass', channel: 'freeCodeCamp.org', category: 'Computer Science' },
  'oop': { id: 'pTB0EiLXUC8', title: 'Object-Oriented Programming Masterclass', channel: 'freeCodeCamp.org', category: 'Computer Science' },

  // UI/UX & Design (Cleanly separated from System Design)
  'figma': { id: 'c9Wg6Cb_YlU', title: 'Figma & UI/UX Design Masterclass', channel: 'freeCodeCamp.org', category: 'Design' },
  'ui/ux': { id: 'c9Wg6Cb_YlU', title: 'Figma & UI/UX Design Masterclass', channel: 'freeCodeCamp.org', category: 'Design' },

  // Soft Skills
  'time management': { id: 'iONDebHX9qk', title: 'Time Management & Productivity Masterclass', channel: 'Ali Abdaal', category: 'Professional Skills' },
  'communication': { id: 'HAnw168huqA', title: 'Professional Communication Skills for Software Engineers', channel: 'freeCodeCamp.org', category: 'Professional Skills' },
  'leadership': { id: 'z44w3jBfJp0', title: 'Engineering Leadership & Teamwork Masterclass', channel: 'freeCodeCamp.org', category: 'Professional Skills' }
}

/**
 * Category fallback mapping for high-level skill domains
 */
const CATEGORY_FALLBACK_MAP = {
  'Web / Frontend': { id: 'pQN-pnXPaVg', title: 'Frontend Web Development Masterclass', channel: 'freeCodeCamp.org' },
  'Backend': { id: 'Oe421EPjeBE', title: 'Backend Web & API Development Masterclass', channel: 'freeCodeCamp.org' },
  'Database': { id: 'HXV3zeQKqGY', title: 'Database & SQL Engineering Masterclass', channel: 'freeCodeCamp.org' },
  'Cloud': { id: 'k1RI5locZE4', title: 'Cloud Architecture & Infrastructure Masterclass', channel: 'freeCodeCamp.org' },
  'DevOps': { id: 'R8_veQiYBjU', title: 'DevOps & Modern Software Delivery Masterclass', channel: 'freeCodeCamp.org' },
  'AI / ML': { id: 'i_LwzRVP7bg', title: 'Artificial Intelligence & Machine Learning Masterclass', channel: 'freeCodeCamp.org' },
  'Data / Analytics': { id: 'r-uOLxNrNk8', title: 'Data Analytics & Engineering Masterclass', channel: 'freeCodeCamp.org' },
  'Programming Languages': { id: 'rfscVS0vtbw', title: 'Modern Software Programming Masterclass', channel: 'freeCodeCamp.org' },
  'Professional Skills': { id: 'HAnw168huqA', title: 'Professional Engineering Skills & Communication', channel: 'freeCodeCamp.org' }
}

/**
 * Resolves the primary YouTube video tutorial for a given skill object or skill name.
 *
 * Execution Order:
 * 1. Backend-provided valid YouTube video (from skObj.youtube_videos)
 * 2. Curated frontend fallback (backup only)
 * 3. Safe category fallback
 * 4. Safe null response (NEVER returns unrelated DSA video)
 *
 * @param {Object|string} skObj - Skill object from backend or string skill name
 * @param {string} fallbackName - Optional fallback skill name
 * @returns {Object|null} Formatted video object or null
 */
export const resolveSkillVideo = (skObj, fallbackName = '') => {
  const skillName = (typeof skObj === 'string' ? skObj : skObj?.skill_name || fallbackName || '').trim()
  const lower = skillName.toLowerCase()

  // -------------------------------------------------------------
  // PRIORITY 1: Backend Recommendation FIRST
  // -------------------------------------------------------------
  if (
    skObj &&
    typeof skObj === 'object' &&
    Array.isArray(skObj.youtube_videos) &&
    skObj.youtube_videos.length > 0
  ) {
    const validBackendVideo = skObj.youtube_videos.find(isValidYouTubeVideo)

    if (validBackendVideo) {
      let videoId = validBackendVideo.id
      if ((!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) && validBackendVideo.embed_url) {
        const m = validBackendVideo.embed_url.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
        if (m) videoId = m[1]
      }
      if ((!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) && validBackendVideo.url) {
        const m = validBackendVideo.url.match(/(?:v=|\/embed\/|\/watch\?v=|\.be\/)([a-zA-Z0-9_-]{11})/)
        if (m) videoId = m[1]
      }

      const embedUrl = validBackendVideo.embed_url || (videoId ? `https://www.youtube.com/embed/${videoId}` : '')
      const watchUrl = validBackendVideo.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '')
      const thumbUrl = validBackendVideo.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '')

      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.log(`[YouTubeResolver] Skill: ${skillName} | Source: backend | Match: ${validBackendVideo.match_type || 'backend'}`)
      }

      const rawDur = validBackendVideo.duration
      const validDur = (rawDur && rawDur !== '45 mins' && rawDur !== '40 mins' && rawDur !== '1 hr 8 mins' && rawDur !== 'Duration unavailable') ? rawDur : null

      return {
        id: videoId || validBackendVideo.id,
        title: validBackendVideo.title || `${skillName} Tutorial`,
        channel: validBackendVideo.channel || 'Tech Academy',
        thumbnail: thumbUrl,
        url: watchUrl,
        embed_url: embedUrl,
        duration: validDur,
        duration_seconds: validBackendVideo.duration_seconds || null,
        difficulty: validBackendVideo.difficulty || 'Beginner to Intermediate',
        badge: validBackendVideo.badge || '⭐ Highly Recommended',
        recommendation_source: validBackendVideo.recommendation_source || 'backend',
        recommendation_category: validBackendVideo.recommendation_category,
        match_type: validBackendVideo.match_type || 'backend'
      }
    }
  }

  // -------------------------------------------------------------
  // PRIORITY 2: Curated Frontend Fallback (BACKUP ONLY)
  // Check exact key match first, then whole-word boundary
  // -------------------------------------------------------------
  if (lower && CURATED_FRONTEND_FALLBACKS[lower]) {
    const item = CURATED_FRONTEND_FALLBACKS[lower]
    return formatFallbackVideo(item, skillName, 'curated_exact')
  }

  // Check compound / multi-word phrases first to prevent collisions
  // (e.g. 'system design' vs 'design', 'database management' vs 'management')
  const compoundPriority = [
    'system design', 'software architecture', 'distributed systems',
    'database management', 'time series analysis', 'real-time systems',
    'cloud computing', 'google cloud', 'microsoft azure', 'machine learning',
    'deep learning', 'artificial intelligence', 'data structures', 'tailwind css',
    'time management', 'spring boot', 'rest api', 'vs code'
  ]

  for (const phrase of compoundPriority) {
    if (lower.includes(phrase) && CURATED_FRONTEND_FALLBACKS[phrase]) {
      return formatFallbackVideo(CURATED_FRONTEND_FALLBACKS[phrase], skillName, 'curated_compound')
    }
  }

  // Bounded word match for single tools / technologies
  for (const [key, item] of Object.entries(CURATED_FRONTEND_FALLBACKS)) {
    // Avoid short keys like 'c' or 'os' colliding within other words
    const regex = key.length <= 2
      ? new RegExp(`(?:\\b|^)${escapeRegExp(key)}(?:\\b|$)`, 'i')
      : new RegExp(`\\b${escapeRegExp(key)}\\b`, 'i')

    if (regex.test(lower)) {
      return formatFallbackVideo(item, skillName, 'curated_word_boundary')
    }
  }

  // -------------------------------------------------------------
  // PRIORITY 3: Safe Category Fallback
  // -------------------------------------------------------------
  const category = (typeof skObj === 'object' ? skObj?.category : null)
  if (category && CATEGORY_FALLBACK_MAP[category]) {
    const catItem = CATEGORY_FALLBACK_MAP[category]
    return formatFallbackVideo(catItem, skillName, 'category_fallback')
  }

  // -------------------------------------------------------------
  // PRIORITY 4: Completely unknown skill — Return null (NEVER DSA!)
  // -------------------------------------------------------------
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log(`[YouTubeResolver] Skill: ${skillName} | Source: none | Match: null`)
  }
  return null
}

const formatFallbackVideo = (item, skillName, matchType) => {
  const vidId = item.id
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log(`[YouTubeResolver] Skill: ${skillName} | Source: curated_fallback | Match: ${matchType}`)
  }
  return {
    id: vidId,
    title: item.title,
    channel: item.channel || 'Tech Academy',
    thumbnail: `https://i.ytimg.com/vi/${vidId}/mqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${vidId}`,
    embed_url: `https://www.youtube.com/embed/${vidId}`,
    duration: item.duration || null,
    duration_seconds: item.duration_seconds || null,
    difficulty: 'Beginner to Intermediate',
    badge: '⭐ Recommended',
    recommendation_source: 'frontend_curated_fallback',
    recommendation_category: item.category || 'General',
    match_type: matchType
  }
}

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Formats video duration into standard YouTube timestamp (HH:MM:SS or MM:SS).
 * Strictly converts integer seconds (e.g. 2896 -> '48:16').
 * Validates timestamp strings.
 * Discards fabricated strings (e.g. '1 hr 8 mins', '45 mins', '40 mins', 'Duration unavailable').
 * Returns null if duration cannot be verified, allowing UI to hide badge (Option A).
 *
 * @param {string|number|null} duration
 * @param {number|null} durationSeconds
 * @returns {string|null}
 */
export const formatVideoDuration = (duration, durationSeconds) => {
  // 1. Prioritize authentic integer seconds
  const sec = Number(durationSeconds)
  if (!isNaN(sec) && sec > 0) {
    const hours = Math.floor(sec / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = Math.floor(sec % 60)
    const pad = (n) => n.toString().padStart(2, '0')

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`
    }
    return `${minutes}:${pad(seconds)}`
  }

  // 2. If duration is already an authentic timestamp string (e.g. "48:16" or "1:20:03")
  if (typeof duration === 'string') {
    const trimmed = duration.trim()
    // Match MM:SS or H:MM:SS or HH:MM:SS
    if (/^\d{1,3}:\d{2}(:\d{2})?$/.test(trimmed)) {
      return trimmed
    }
    // Match pure digits string (seconds)
    if (/^\d+$/.test(trimmed)) {
      const parsedSec = parseInt(trimmed, 10)
      if (parsedSec > 0) {
        return formatVideoDuration(null, parsedSec)
      }
    }
    // Discard fabricated/arbitrary strings (e.g. "1 hr 8 mins", "45 mins", "40 mins", "Duration unavailable")
  }

  // 3. Unverified or missing duration: return null (UI hides the duration badge)
  return null
}

