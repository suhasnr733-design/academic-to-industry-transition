// frontend/src/utils/skillMatcher.js
/**
 * Canonical Skill Normalization & High-Precision Matching Engine
 * 
 * Accurately matches candidate skills with job requirements without false-positive
 * substring collisions (e.g. prevents 'C' matching 'Scala' or 'CI/CD', prevents
 * 'Java' matching 'JavaScript', and prevents 'SQL' matching 'SQLite').
 */

// Explicit canonical dictionary: Maps normalized alias strings to canonical skill keys
const SKILL_ALIASES = {
  // C family (distinct, never overlapping)
  'c': 'c',
  'c language': 'c',
  'c programming': 'c',
  'c programming language': 'c',

  'c++': 'c++',
  'cpp': 'c++',
  'c plus plus': 'c++',
  'cplusplus': 'c++',

  'c#': 'c#',
  'csharp': 'c#',
  'c sharp': 'c#',
  'c-sharp': 'c#',

  // Java vs JavaScript (strictly distinct)
  'java': 'java',
  'core java': 'java',
  'java se': 'java',
  'java ee': 'java',

  'javascript': 'javascript',
  'js': 'javascript',
  'ecmascript': 'javascript',
  'vanilla js': 'javascript',
  'vanilla javascript': 'javascript',

  'typescript': 'typescript',
  'ts': 'typescript',

  // Databases (SQL vs SQLite vs NoSQL strictly distinct)
  'sql': 'sql',
  'structured query language': 'sql',
  'rdbms': 'sql',

  'sqlite': 'sqlite',
  'sqlite3': 'sqlite',

  'postgresql': 'postgresql',
  'postgres': 'postgresql',
  'psql': 'postgresql',

  'mysql': 'mysql',

  'mongodb': 'mongodb',
  'mongo': 'mongodb',

  'redis': 'redis',

  // Frontend & UI
  'react': 'react',
  'react.js': 'react',
  'reactjs': 'react',
  'react js': 'react',

  'html': 'html',
  'html5': 'html',

  'css': 'css',
  'css3': 'css',

  'tailwind': 'tailwindcss',
  'tailwind css': 'tailwindcss',
  'tailwindcss': 'tailwindcss',

  'vue': 'vue',
  'vue.js': 'vue',
  'vuejs': 'vue',

  'angular': 'angular',
  'angularjs': 'angular',

  'next.js': 'nextjs',
  'nextjs': 'nextjs',

  // Backend & Runtime
  'node': 'node.js',
  'node.js': 'node.js',
  'nodejs': 'node.js',
  'node js': 'node.js',

  'express': 'express.js',
  'express.js': 'express.js',
  'expressjs': 'express.js',
  'express js': 'express.js',

  'python': 'python',
  'python3': 'python',
  'py': 'python',

  'django': 'django',
  'flask': 'flask',
  'fastapi': 'fastapi',

  'go': 'go',
  'golang': 'go',
  'go (programming language)': 'go',
  'go programming language': 'go',

  'php': 'php',
  'symfony': 'symfony',
  'laravel': 'laravel',

  'ruby': 'ruby',
  'ruby on rails': 'rails',
  'rails': 'rails',

  'rust': 'rust',
  'rustlang': 'rust',

  'scala': 'scala',

  // Tools & Version Control
  'git': 'git',
  'git version control': 'git',
  'version control (git)': 'git',

  'github': 'github',
  'git hub': 'github',

  'gitlab': 'gitlab',

  'postman': 'postman',
  'postman api': 'postman',

  'vs code': 'vs code',
  'vscode': 'vs code',
  'visual studio code': 'vs code',

  // Computer Science & Fundamentals
  'data structures': 'data structures',
  'data structure': 'data structures',

  'algorithms': 'algorithms',
  'algorithm': 'algorithms',

  'nlp': 'nlp',
  'natural language processing': 'nlp',

  'oop': 'oop',
  'object-oriented programming': 'oop',
  'object-oriented programming (oop)': 'oop',
  'object oriented programming': 'oop',

  // Cloud & DevOps
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'aws': 'aws',
  'amazon web services': 'aws',
  'ci/cd': 'ci/cd',
  'ci cd': 'ci/cd',
  'devops': 'devops',

  // Architecture & Paradigms
  'graphql': 'graphql',
  'graph ql': 'graphql',
  'rest': 'rest api',
  'rest api': 'rest api',
  'restful': 'rest api',
  'fullstack': 'fullstack',
  'full stack': 'fullstack',
  'fullstack development': 'fullstack',
  'full-stack development': 'fullstack'
}

/**
 * Safely extracts raw text from a string or skill object.
 */
export function getSkillName(raw) {
  if (!raw) return ''
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'object') {
    return (raw.name || raw.skill || raw.title || raw.label || '').trim()
  }
  return String(raw).trim()
}

/**
 * Normalizes a raw skill string to its canonical key.
 */
export function normalizeSkill(raw) {
  const name = getSkillName(raw)
  if (!name) return ''
  const clean = name.toLowerCase().replace(/\s+/g, ' ')
  return SKILL_ALIASES[clean] || clean
}

/**
 * Expands composite skills into their constituent canonical keys.
 * E.g., 'Data Structures and Algorithms' -> ['data structures', 'algorithms']
 */
export function expandSkillToCanonicals(raw) {
  const norm = normalizeSkill(raw)
  if (!norm) return []
  if (norm === 'data structures and algorithms' || norm === 'dsa') {
    return ['data structures', 'algorithms']
  }
  return [norm]
}

/**
 * Evaluates skill overlap between a job's requirements and candidate's extracted skills.
 * 
 * Guarantees:
 * 1. Exact canonical matching (no substring false positives).
 * 2. Deduplicated counting (a skill is never counted twice).
 * 3. Matched skills list and matchCount always agree.
 * 
 * @param {Array} jobRequiredSkills - Array of job required skills (strings or objects)
 * @param {Array} userSkills - Array of student extracted skills (strings or objects)
 * @returns {{ matchCount: number, matchedSkills: string[] }}
 */
export function matchJobSkills(jobRequiredSkills = [], userSkills = []) {
  if (!jobRequiredSkills || !userSkills || jobRequiredSkills.length === 0 || userSkills.length === 0) {
    return { matchCount: 0, matchedSkills: [] }
  }

  // Build canonical set of student's skills
  const studentCanonicalSet = new Set()
  for (const s of userSkills) {
    const canonicals = expandSkillToCanonicals(s)
    for (const c of canonicals) {
      if (c) studentCanonicalSet.add(c)
    }
  }

  if (studentCanonicalSet.size === 0) {
    return { matchCount: 0, matchedSkills: [] }
  }

  const matchedCanonicalKeys = new Set()
  const matchedDisplaySkills = []

  for (const raw of jobRequiredSkills) {
    const rawDisplay = getSkillName(raw)
    if (!rawDisplay) continue

    const canonicals = expandSkillToCanonicals(raw)
    let addedForThisItem = false

    for (const c of canonicals) {
      if (studentCanonicalSet.has(c) && !matchedCanonicalKeys.has(c)) {
        matchedCanonicalKeys.add(c)
        if (!addedForThisItem) {
          matchedDisplaySkills.push(rawDisplay)
          addedForThisItem = true
        }
      }
    }
  }

  return {
    matchCount: matchedCanonicalKeys.size,
    matchedSkills: matchedDisplaySkills
  }
}
