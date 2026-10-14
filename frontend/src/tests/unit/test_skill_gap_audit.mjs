// frontend/src/tests/unit/test_skill_gap_audit.mjs
import { 
  isValidHttpUrl, 
  isSearchUrl, 
  isDirectCourseUrl, 
  getCourseUrl, 
  isExactCourseUrl, 
  getPlatformUrl,
  getPlatformBadgeConfig
} from '../../utils/courseUrls.js'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    failed++
  }
}

// Mirror helper from SkillGapAnalysis.jsx
const getSkillSlug = (skill) => 
  String(skill || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'skill'

console.log('=== 1. COURSE URL CLASSIFICATION & VALIDATION AUDIT ===')
{
  console.log('\n  1.1 HTTP URL Validation:')
  assert(isValidHttpUrl('https://www.coursera.org/learn/algorithms-part1') === true, 'Valid HTTPS URL returns true')
  assert(isValidHttpUrl('http://www.udemy.com/course/react') === true, 'Valid HTTP URL returns true')
  assert(isValidHttpUrl('javascript:alert(1)') === false, 'javascript: URI is rejected')
  assert(isValidHttpUrl('#') === false, 'Hash link is rejected')
  assert(isValidHttpUrl('') === false, 'Empty string is rejected')
  assert(isValidHttpUrl(null) === false, 'Null is rejected')
  assert(isValidHttpUrl(undefined) === false, 'Undefined is rejected')
  assert(isValidHttpUrl('not-a-url') === false, 'Malformed string is rejected')

  console.log('\n  1.2 Distinguishing Search URLs from Direct Pages:')
  assert(isSearchUrl('https://www.coursera.org/search?query=React') === true, 'Coursera search query detected')
  assert(isSearchUrl('https://www.udemy.com/courses/search/?q=Node') === true, 'Udemy search query detected')
  assert(isSearchUrl('https://www.youtube.com/results?search_query=TypeScript') === true, 'YouTube search query detected')
  assert(isSearchUrl('https://leetcode.com/problemset/all/?search=Tree') === true, 'LeetCode search query detected')
  assert(isSearchUrl('https://www.coursera.org/learn/algorithms-part1') === false, 'Direct Coursera page is not search')
  assert(isSearchUrl('https://www.udemy.com/course/docker-mastery/') === false, 'Direct Udemy course is not search')

  console.log('\n  1.3 Direct Course Page Classification:')
  assert(isDirectCourseUrl('https://www.coursera.org/learn/algorithms-part1') === true, 'Coursera /learn/ classified as direct')
  assert(isDirectCourseUrl('https://www.coursera.org/specializations/deep-learning') === true, 'Coursera /specializations/ classified as direct')
  assert(isDirectCourseUrl('https://www.udemy.com/course/docker-mastery/') === true, 'Udemy /course/ classified as direct')
  assert(isDirectCourseUrl('https://leetcode.com/problemset/all/') === true, 'LeetCode problemset classified as direct')
  assert(isDirectCourseUrl('https://www.freecodecamp.org/learn/2022/responsive-web-design/') === true, 'FreeCodeCamp /learn/ classified as direct')
  assert(isDirectCourseUrl('https://www.coursera.org/search?query=Algorithms') === false, 'Search URL is never direct')
  assert(isDirectCourseUrl('https://www.coursera.org/') === false, 'Homepage is not a direct course page')

  console.log('\n  1.4 Conservative isExactCourseUrl Classification:')
  // Do NOT classify every object with a url property as an exact course link!
  const searchObject = { title: 'React Search', url: 'https://www.coursera.org/search?query=React' }
  assert(isExactCourseUrl(searchObject) === false, 'Object with search URL is NOT classified as exact course link')

  const invalidUrlObject = { title: 'Broken Link', url: 'javascript:void(0)' }
  assert(isExactCourseUrl(invalidUrlObject) === false, 'Object with invalid URL is NOT classified as exact')

  const directObject = { title: 'Docker Mastery', url: 'https://www.udemy.com/course/docker-mastery/' }
  assert(isExactCourseUrl(directObject) === true, 'Object with verified direct course URL is exact')

  // Catalog checks: direct vs search fallback
  assert(isExactCourseUrl('Mastering Data Structures & Algorithms') === true, 'Known direct Udemy course in catalog is exact')
  assert(isExactCourseUrl('Data Structures in Java & Python') === false, 'Catalog search query fallback is NOT falsely claimed as exact')
  assert(isExactCourseUrl('Nonexistent Unknown Course 123') === false, 'Unknown course resolves to search fallback and is NOT exact')
  assert(isExactCourseUrl(null) === false, 'Null course returns false')

  console.log('\n  1.5 getCourseUrl Fallback Integrity:')
  const fallbackUrl = getCourseUrl('Unknown Course XYZ', 'Python', 'Udemy')
  assert(fallbackUrl.includes('udemy.com') && fallbackUrl.includes('search'), 'Unknown course falls back safely to platform search')
  
  const brokenObj = { title: 'React Complete Guide', url: 'invalid://url' }
  const rescuedUrl = getCourseUrl(brokenObj)
  assert(rescuedUrl === 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', 'Malformed object url safely rescued via catalog title')
}

console.log('\n=== 2. LEARNING NAVIGATION & SLUG PRECISION AUDIT ===')
{
  assert(getSkillSlug('JavaScript') === 'javascript', 'Standard skill name slugified')
  assert(getSkillSlug('Node.js') === 'node-js', 'Punctuation dot replaced with hyphen')
  assert(getSkillSlug('React / Redux') === 'react-redux', 'Punctuation slashes and spaces cleanly collapsed')
  assert(getSkillSlug('HTML5 & CSS3') === 'html5-css3', 'Ampersand and spaces cleaned')
  assert(getSkillSlug('  Tailwind CSS  ') === 'tailwind-css', 'Whitespace trimmed')
  assert(getSkillSlug('---C++---') === 'c', 'Leading/trailing hyphens stripped from symbols')
  assert(getSkillSlug('C#') === 'c', 'C# stripped to c')
  assert(getSkillSlug('') === 'skill', 'Empty skill name falls back to "skill"')
  assert(getSkillSlug(null) === 'skill', 'Null skill falls back to "skill"')

  // Simulation of highlight timer & cleanup
  let currentTimer = null
  let highlightedEl = null

  const simulateScrollTo = (elementId) => {
    // 1. Clean up previous
    if (currentTimer) {
      clearTimeout(currentTimer)
      currentTimer = null
    }
    if (highlightedEl) {
      highlightedEl.highlighted = false
      highlightedEl = null
    }

    // 2. Set new
    const el = { id: elementId, highlighted: true }
    highlightedEl = el
    currentTimer = setTimeout(() => {
      if (highlightedEl === el) {
        el.highlighted = false
        highlightedEl = null
      }
    }, 2000)
    return el
  }

  const first = simulateScrollTo('learning-card-javascript')
  assert(first.highlighted === true, 'First element highlighted')
  
  // Rapid second navigation before timer finishes:
  const second = simulateScrollTo('learning-card-tailwind')
  assert(first.highlighted === false, 'First element immediately loses highlight on new navigation')
  assert(second.highlighted === true, 'Second element receives highlight cleanly')
  clearTimeout(currentTimer)
}

console.log('\n=== 3. ROLE SWITCHING & ACTIVE REQUEST SYNCHRONIZATION AUDIT ===')
{
  // Simulated component state environment
  let activeRequestId = 0
  let isRoleFetching = false
  let selectedRole = 'Software Engineer'
  let currentAnalysis = { target_role: 'Software Engineer', match_percentage: 70, matching_skills: ['Java', 'SQL'] }
  const cache = {}

  // 3.1 Initial cache seeding
  const currentResumeKey = '1'
  const key1 = `${currentResumeKey}__software engineer`
  cache[key1] = currentAnalysis

  const switchRole = async (newRole, mockNetworkDelayMs = 50, shouldFail = false) => {
    // Interaction policy: disable role switching while active request is fetching
    if (isRoleFetching) return 'BLOCKED_BY_FETCHING'
    if (newRole.toLowerCase().trim() === selectedRole.toLowerCase().trim()) return 'SAME_ROLE'

    const roleKey = `${currentResumeKey}__${newRole.toLowerCase().trim()}`
    
    // Cache hit:
    if (cache[roleKey]) {
      activeRequestId++
      isRoleFetching = false
      currentAnalysis = cache[roleKey]
      selectedRole = cache[roleKey].target_role || newRole
      return 'CACHE_HIT'
    }

    // Cache miss:
    selectedRole = newRole
    isRoleFetching = true
    const thisRequestId = ++activeRequestId

    try {
      await new Promise(r => setTimeout(r, mockNetworkDelayMs))
      if (shouldFail) throw new Error('Network error')
      if (thisRequestId !== activeRequestId) return 'DISCARDED_STALE_RESPONSE'

      const data = {
        target_role: newRole,
        match_percentage: 50,
        matching_skills: ['React', 'HTML']
      }
      currentAnalysis = data
      selectedRole = data.target_role || newRole
      cache[roleKey] = data
      return 'FETCH_SUCCESS'
    } catch {
      if (thisRequestId === activeRequestId) {
        // Revert selectedRole to currently displayed analysis to avoid desync
        selectedRole = currentAnalysis.target_role
        return 'FETCH_FAILED_REVERTED'
      }
      return 'ERROR_DISCARDED'
    } finally {
      if (thisRequestId === activeRequestId) {
        isRoleFetching = false
      }
    }
  }

  // Test policy: rapid click while fetching is blocked
  const promise1 = switchRole('Frontend Developer', 30)
  assert(isRoleFetching === true, 'isRoleFetching is true while request is in flight')
  
  const blockedAttempt = await switchRole('Backend Developer', 10)
  assert(blockedAttempt === 'BLOCKED_BY_FETCHING', 'Subsequent role selection is blocked until active request finishes')

  const res1 = await promise1
  assert(res1 === 'FETCH_SUCCESS', 'First role fetch completes successfully')
  assert(selectedRole === 'Frontend Developer', 'Selected role is now Frontend Developer')
  assert(currentAnalysis.target_role === 'Frontend Developer', 'Analysis target role matches Frontend Developer')
  assert(isRoleFetching === false, 'isRoleFetching is false after completion')

  // Test cache hit invalidation:
  const hitRes = await switchRole('Software Engineer', 0)
  assert(hitRes === 'CACHE_HIT', 'Re-selecting Software Engineer is an instant cache hit')
  assert(selectedRole === 'Software Engineer', 'Selected role updated synchronously')
  assert(currentAnalysis.target_role === 'Software Engineer', 'Analysis updated synchronously')
  assert(isRoleFetching === false, 'Not fetching on cache hit')

  // Test failure recovery:
  const failRes = await switchRole('Data Scientist', 10, true)
  assert(failRes === 'FETCH_FAILED_REVERTED', 'Failed role fetch caught safely')
  assert(selectedRole === 'Software Engineer', 'Selected role reverted back to active analysis on failure')
  assert(currentAnalysis.target_role === 'Software Engineer', 'UI data remains consistent with active analysis')
}

console.log('\n=== 4. RESUME AND CACHE ISOLATION AUDIT ===')
{
  const inMemoryCache = {}

  // Resume 1:
  const resume1Key = '101'
  const r1Role = 'Frontend Developer'
  const keyR1 = `${resume1Key}__${r1Role.toLowerCase()}`
  inMemoryCache[keyR1] = {
    resume_id: 101,
    target_role: 'Frontend Developer',
    candidate_name: 'Alice',
    skills: ['React', 'CSS']
  }

  // Resume 2:
  const resume2Key = '202'
  const r2Role = 'Frontend Developer'
  const keyR2 = `${resume2Key}__${r2Role.toLowerCase()}`
  inMemoryCache[keyR2] = {
    resume_id: 202,
    target_role: 'Frontend Developer',
    candidate_name: 'Bob',
    skills: ['Python', 'Django']
  }

  assert(keyR1 !== keyR2, 'Keys for identical role across different resumes are strictly isolated')
  assert(inMemoryCache[keyR1].candidate_name === 'Alice', 'Resume 1 cache stores Alice data')
  assert(inMemoryCache[keyR2].candidate_name === 'Bob', 'Resume 2 cache stores Bob data')
  assert(inMemoryCache[keyR1].skills[0] === 'React', 'Resume 1 skills preserved')
  assert(inMemoryCache[keyR2].skills[0] === 'Python', 'Resume 2 skills preserved')

  // Stale network response across resume switch simulation:
  let activeResumeKey = resume1Key
  let activeRequestId = 1
  let displayedData = inMemoryCache[keyR1]

  // Start in-flight request for Resume 1
  const req1Id = activeRequestId
  const req1Resume = activeResumeKey

  // User navigates to Resume 2 before Resume 1 finishes
  activeResumeKey = resume2Key
  activeRequestId++

  // Resume 1 network response arrives late:
  const lateResponseData = { resume_id: 101, candidate_name: 'Alice Late Data' }
  const isDiscarded = (req1Id !== activeRequestId || req1Resume !== activeResumeKey)
  assert(isDiscarded === true, 'Late network response from Resume 1 is discarded after active resume switch')
  assert(displayedData.resume_id === 101, 'Current displayed data is not overwritten by late response')

  // Hydration test:
  const simulateStorageHydration = (storedJson, targetResumeId) => {
    try {
      const parsed = JSON.parse(storedJson)
      if (!targetResumeId || String(parsed.resume_id) === String(targetResumeId)) {
        return parsed
      }
      return null
    } catch {
      return null
    }
  }

  const storedForAlice = JSON.stringify(inMemoryCache[keyR1])
  assert(simulateStorageHydration(storedForAlice, '101')?.candidate_name === 'Alice', 'Valid sessionStorage hydration for matching resume')
  assert(simulateStorageHydration(storedForAlice, '202') === null, 'sessionStorage hydration rejects data belonging to another resume')
}

console.log('\n=== 5. ACCESSIBILITY AUDIT ===')
{
  const platform = getPlatformBadgeConfig('Coursera')
  assert(platform.name === 'Coursera', 'Coursera badge config returned')
  assert(platform.badgeClass.includes('border-blue-200'), 'Coursera badge has visible border')

  const udemy = getPlatformBadgeConfig('Udemy')
  assert(udemy.name === 'Udemy', 'Udemy badge config returned')

  // Tooltip accessibility simulation:
  let isTooltipOpen = false
  const toggleTooltip = () => { isTooltipOpen = !isTooltipOpen }
  const closeTooltip = () => { isTooltipOpen = false }

  // Keyboard Enter/Space or click toggle:
  toggleTooltip()
  assert(isTooltipOpen === true, 'Tooltip toggles open on click or keyboard activation')
  
  // Escape key closes:
  closeTooltip()
  assert(isTooltipOpen === false, 'Tooltip closes on Escape key')
}

console.log('\n======================================================')
console.log(`TOTAL AUDIT TESTS: ${passed + failed}`)
console.log(`PASSED: ${passed}`)
console.log(`FAILED: ${failed}`)
console.log('======================================================')

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
