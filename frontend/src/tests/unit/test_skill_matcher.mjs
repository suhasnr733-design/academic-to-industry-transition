// frontend/src/tests/unit/test_skill_matcher.mjs
import { matchJobSkills, normalizeSkill, getSkillName } from '../../utils/skillMatcher.js'

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

console.log('--- 1. Testing C / C++ / C# / Scala / Checkout Precision ---')
{
  const student = ['C']
  assert(matchJobSkills(['C'], student).matchCount === 1, "Candidate 'C' matches job 'C'")
  assert(matchJobSkills(['C Programming Language'], student).matchCount === 1, "Candidate 'C' matches 'C Programming Language'")
  assert(matchJobSkills(['Scala'], student).matchCount === 0, "Candidate 'C' NEVER falsely matches 'Scala'")
  assert(matchJobSkills(['Checkout'], student).matchCount === 0, "Candidate 'C' NEVER falsely matches 'Checkout'")
  assert(matchJobSkills(['CI/CD'], student).matchCount === 0, "Candidate 'C' NEVER falsely matches 'CI/CD'")
  assert(matchJobSkills(['Security by Design'], student).matchCount === 0, "Candidate 'C' NEVER falsely matches 'Security by Design'")
  assert(matchJobSkills(['C++'], student).matchCount === 0, "Candidate 'C' does not match 'C++'")
  assert(matchJobSkills(['C#'], student).matchCount === 0, "Candidate 'C' does not match 'C#'")
  assert(matchJobSkills(['CSS'], student).matchCount === 0, "Candidate 'C' does not match 'CSS'")
}

console.log('\n--- 2. Testing Java vs JavaScript Precision ---')
{
  const studentJavaOnly = ['Java']
  assert(matchJobSkills(['JavaScript'], studentJavaOnly).matchCount === 0, "Candidate 'Java' NEVER matches 'JavaScript'")
  assert(matchJobSkills(['Java'], studentJavaOnly).matchCount === 1, "Candidate 'Java' matches 'Java'")
  assert(matchJobSkills(['Core Java'], studentJavaOnly).matchCount === 1, "Candidate 'Java' matches alias 'Core Java'")

  const studentJSOnly = ['JavaScript']
  assert(matchJobSkills(['Java'], studentJSOnly).matchCount === 0, "Candidate 'JavaScript' NEVER matches 'Java'")
  assert(matchJobSkills(['JS'], studentJSOnly).matchCount === 1, "Candidate 'JavaScript' matches alias 'JS'")
  assert(matchJobSkills(['Vanilla JS'], studentJSOnly).matchCount === 1, "Candidate 'JavaScript' matches 'Vanilla JS'")
}

console.log('\n--- 3. Testing SQL vs SQLite Precision ---')
{
  const studentSQL = ['SQL']
  assert(matchJobSkills(['SQLite'], studentSQL).matchCount === 0, "Candidate 'SQL' does not match 'SQLite'")
  assert(matchJobSkills(['SQL'], studentSQL).matchCount === 1, "Candidate 'SQL' matches 'SQL'")
  assert(matchJobSkills(['Structured Query Language'], studentSQL).matchCount === 1, "Candidate 'SQL' matches 'Structured Query Language'")

  const studentSQLite = ['SQLite']
  assert(matchJobSkills(['SQL'], studentSQLite).matchCount === 0, "Candidate 'SQLite' does not match 'SQL'")
  assert(matchJobSkills(['SQLite3'], studentSQLite).matchCount === 1, "Candidate 'SQLite' matches 'SQLite3'")
}

console.log('\n--- 4. Testing Deduplication (No Double Counting) ---')
{
  const student = ['Java', 'React', 'Git']
  // Job lists Java twice via aliases
  const res1 = matchJobSkills(['Java', 'Core Java'], student)
  assert(res1.matchCount === 1, "Job listing 'Java' and 'Core Java' only counts once (matchCount: 1)")
  assert(res1.matchedSkills.length === 1, "matchedSkills array length is 1")

  // Job lists React multiple times
  const res2 = matchJobSkills(['React', 'React.js', 'ReactJS'], student)
  assert(res2.matchCount === 1, "Multiple aliases of 'React' count only once")
  assert(res2.matchedSkills.length === 1, "matchedSkills has exactly 1 entry")
}

console.log('\n--- 5. Testing Composite Skills (DSA) ---')
{
  const student = ['Data Structures', 'Algorithms']
  const res = matchJobSkills(['Data Structures and Algorithms'], student)
  assert(res.matchCount === 2, "Candidate with both DS and Algorithms matches composite DSA fully (2 canonical keys)")
  assert(res.matchedSkills.length === 1, "Display list shows the single job requirement 'Data Structures and Algorithms'")
}

console.log('\n--- 6. Testing Object-Based Skills & Safe Handling ---')
{
  const student = [{ name: 'Python' }, { skill: 'React' }]
  const job = [{ name: 'Python' }, { title: 'React.js' }, { skill: 'Django' }]
  const res = matchJobSkills(job, student)
  assert(res.matchCount === 2, "Object-based skills match correctly (Python and React)")
  assert(res.matchedSkills.includes('Python') && res.matchedSkills.includes('React.js'), "Returns original display labels from job")
}

console.log('\n--- 7. Testing Null, Undefined & Empty States ---')
{
  assert(matchJobSkills([], ['Python']).matchCount === 0, "Empty job skills returns 0")
  assert(matchJobSkills(['Python'], []).matchCount === 0, "Empty candidate skills returns 0")
  assert(matchJobSkills(null, null).matchCount === 0, "Null inputs return 0")
  assert(matchJobSkills(['   '], ['']).matchCount === 0, "Whitespace strings safely ignored")
}

console.log('\n===========================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('===========================================')

if (failed > 0) {
  process.exit(1)
}
