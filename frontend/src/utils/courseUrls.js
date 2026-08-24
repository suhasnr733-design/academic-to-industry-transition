// frontend/src/utils/courseUrls.js

/**
 * Known direct URLs for courses to provide exact 1-click navigation.
 */
const KNOWN_COURSE_URLS = {
  // Data Structures & Algorithms
  'Mastering Data Structures & Algorithms': 'https://www.udemy.com/course/datastructurescncpp/',
  'Data Structures in Java & Python': 'https://www.coursera.org/search?query=Data+Structures+Java+Python',
  'LeetCode Problem Solving Bootcamp': 'https://leetcode.com/problemset/all/',
  'Design & Analysis of Algorithms': 'https://www.coursera.org/learn/algorithms-part1',
  'Algorithms Specialization (Coursera)': 'https://www.coursera.org/specializations/algorithms',
  'Algorithms Specialization': 'https://www.coursera.org/specializations/algorithms',
  'Competitive Programming & Algorithms': 'https://www.coursera.org/search?query=Competitive+Programming+Algorithms',

  // Python
  'Python for Data Science': 'https://www.coursera.org/learn/python-for-applied-data-science-ai',
  'Python Programming Essentials': 'https://www.coursera.org/learn/python-programming-essentials',
  'Advanced Python': 'https://www.coursera.org/learn/advanced-python',

  // Java
  'Java Fundamentals': 'https://www.coursera.org/learn/java-programming',
  'Advanced Java Programming': 'https://www.coursera.org/learn/advanced-java',
  'Spring Framework': 'https://www.udemy.com/course/spring-hibernate-tutorial/',

  // AI / ML / Deep Learning
  'ML Specialization': 'https://www.coursera.org/specializations/machine-learning-introduction',
  'Machine Learning Specialization': 'https://www.coursera.org/specializations/machine-learning-introduction',
  'Deep Learning with Python': 'https://www.coursera.org/search?query=Deep+Learning+with+Python',
  'Applied ML': 'https://www.coursera.org/learn/applied-machine-learning',
  'Deep Learning Specialization': 'https://www.coursera.org/specializations/deep-learning',
  'Neural Networks': 'https://www.coursera.org/learn/neural-networks-deep-learning',
  'PyTorch for Deep Learning': 'https://www.coursera.org/learn/deep-neural-networks-with-pytorch',
  'PyTorch for Deep Learning Bootcamp': 'https://www.udemy.com/course/pytorch-for-deep-learning-bootcamp/',
  'Deep Learning with PyTorch': 'https://www.coursera.org/learn/deep-neural-networks-with-pytorch',
  'Practical Neural Networks with PyTorch': 'https://www.coursera.org/search?query=PyTorch+Neural+Networks',

  // Cloud & DevOps
  'AWS Certified Solutions Architect': 'https://www.coursera.org/learn/aws-cloud-solutions-architect',
  'AWS Cloud Practitioner': 'https://www.coursera.org/learn/aws-cloud-practitioner-essentials',
  'AWS DevOps': 'https://www.coursera.org/learn/aws-devops',
  'Microsoft Azure Fundamentals (AZ-900)': 'https://www.coursera.org/learn/microsoft-azure-fundamentals-az-900',
  'Azure Cloud Solutions Architect': 'https://www.coursera.org/search?query=Azure+Cloud+Solutions+Architect',
  'Azure DevOps Engineer': 'https://www.coursera.org/search?query=Azure+DevOps+Engineer',
  'Docker Mastery': 'https://www.udemy.com/course/docker-mastery/',
  'DevOps with Docker': 'https://www.coursera.org/learn/devops-docker',
  'Containerization Essentials': 'https://www.coursera.org/search?query=Containerization+Essentials',
  'Kubernetes Fundamentals': 'https://www.coursera.org/learn/kubernetes-cloud-native-fundamentals',
  'Certified Kubernetes Administrator (CKA)': 'https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/',
  'Microservices with K8s': 'https://www.coursera.org/search?query=Microservices+Kubernetes',
  'Linux Command Line & Shell Scripting': 'https://www.udemy.com/course/linux-command-line-bash/',
  'Hands-On Linux Administration': 'https://www.coursera.org/learn/hands-on-linux',
  'Linux for Developers': 'https://www.coursera.org/learn/linux-for-developers',
  'Jenkins CI/CD Automation': 'https://www.udemy.com/course/jenkins-from-zero-to-hero/',
  'Mastering Jenkins for DevOps': 'https://www.coursera.org/search?query=Mastering+Jenkins',
  'Continuous Integration & Deployment Pipeline': 'https://www.coursera.org/learn/continuous-integration-continuous-deployment',

  // Database & SQL
  'SQL for Data Science': 'https://www.coursera.org/learn/sql-for-data-science',
  'Database Management Systems': 'https://www.coursera.org/learn/database-management',
  'Advanced SQL & Query Optimization': 'https://www.udemy.com/course/advanced-sql/',

  // Frontend & Web Dev
  'React Complete Guide': 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
  'Frontend Development with React': 'https://www.coursera.org/learn/front-end-react',
  'React Native Mastery': 'https://www.udemy.com/course/the-complete-react-native-and-redux-course/',
  'JavaScript: The Advanced Concepts': 'https://www.udemy.com/course/advanced-javascript-concepts/',
  'ES6+ Modern JavaScript': 'https://www.udemy.com/course/javascript-es6-tutorial/',
  'Asynchronous JS Deep Dive': 'https://www.udemy.com/course/asynchronous-javascript/',
  'HTML5 & Modern Web Standards': 'https://www.coursera.org/learn/html',
  'Responsive Web Design Essentials': 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
  'Semantic HTML5 & Accessibility': 'https://www.coursera.org/learn/web-design-wireframes-to-prototypes',
  'Advanced CSS & Sass': 'https://www.udemy.com/course/advanced-css-and-sass/',
  'Modern CSS with Flexbox & Grid': 'https://www.udemy.com/course/css-the-complete-guide-incl-flexbox-grid-sass/',
  'TailwindCSS & Modern UI Design': 'https://www.udemy.com/course/tailwind-css-from-scratch/',
  'Redux Toolkit & State Management': 'https://www.udemy.com/course/react-redux/',
  'Modern React with Redux': 'https://www.udemy.com/course/react-redux/',
  'Advanced Frontend Architecture': 'https://www.coursera.org/search?query=Frontend+Architecture',

  // Backend
  'Django Full Stack': 'https://www.udemy.com/course/python-and-django-full-stack-web-developer-bootcamp/',
  'Django REST Framework': 'https://www.udemy.com/course/django-rest-framework/',
  'Python Web Development with Django': 'https://www.coursera.org/learn/django-database-web-apps',
  'Node.js Developer Course': 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/',
  'Building RESTful APIs with Node & Express': 'https://www.coursera.org/learn/server-side-nodejs',
  'Full-Stack Node.js Mastery': 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/',
  'RESTful API Design & Architecture': 'https://www.coursera.org/learn/rest-api-design-development-and-management',
  'API Development & Testing with Postman': 'https://www.udemy.com/course/postman-the-complete-guide/',
  'Microservices & REST APIs': 'https://www.coursera.org/search?query=Microservices+REST+APIs',
  'Git and GitHub Mastery': 'https://www.udemy.com/course/git-and-github-bootcamp/',
  'Version Control with Git': 'https://www.coursera.org/learn/version-control-with-git',
  'Advanced Git Workflows': 'https://www.coursera.org/search?query=Advanced+Git',

  // Data Science & Statistics
  'Data Science Bootcamp': 'https://www.udemy.com/course/the-data-science-course-complete-data-science-bootcamp/',
  'Data Analysis with Python': 'https://www.coursera.org/learn/data-analysis-with-python',
  'Statistics for Data Science': 'https://www.coursera.org/learn/statistics-for-data-science-python',
  'Practical Statistics for Data Science': 'https://www.coursera.org/learn/practical-data-science-stats',
  'Inferential Statistics Specialization': 'https://www.coursera.org/specializations/inferential-statistics-python',
  'Probability & Statistics for ML': 'https://www.coursera.org/specializations/mathematics-machine-learning',
  'Data Visualization with Python & Matplotlib': 'https://www.coursera.org/learn/python-for-data-visualization',
  'Tableau & PowerBI Data Storytelling': 'https://www.coursera.org/learn/data-visualization-tableau',
  'Interactive Visualizations with D3.js': 'https://www.udemy.com/course/d3js-data-visualization-projects/'
}

/**
 * Returns platform search URL for a skill or general query.
 */
export const getPlatformUrl = (platform, query = '') => {
  const pName = (typeof platform === 'object' ? platform.name : platform || 'Coursera').trim()
  const pLower = pName.toLowerCase()
  const q = encodeURIComponent(query.trim() || 'Computer Science')

  if (pLower.includes('coursera')) {
    return `https://www.coursera.org/search?query=${q}`
  }
  if (pLower.includes('udemy')) {
    return `https://www.udemy.com/courses/search/?q=${q}`
  }
  if (pLower.includes('nptel')) {
    return `https://nptel.ac.in/courses`
  }
  if (pLower.includes('leetcode')) {
    return `https://leetcode.com/problemset/all/?search=${q}`
  }
  if (pLower.includes('edx')) {
    return `https://www.edx.org/search?q=${q}`
  }
  if (pLower.includes('youtube')) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent((query || '') + ' full course tutorial')}`
  }

  return `https://www.coursera.org/search?query=${q}`
}

/**
 * Returns the exact webpage URL for a given course name/object.
 */
export const getCourseUrl = (course, skill = '', preferredPlatform = 'Coursera') => {
  if (!course) return getPlatformUrl(preferredPlatform, skill)

  // If already an object with url property
  if (typeof course === 'object' && course.url) {
    return course.url
  }

  const courseTitle = (typeof course === 'object' ? (course.title || course.name) : course || '').trim()
  if (!courseTitle) return getPlatformUrl(preferredPlatform, skill)

  // Direct exact known course URL lookup
  if (KNOWN_COURSE_URLS[courseTitle]) {
    return KNOWN_COURSE_URLS[courseTitle]
  }

  // Check normalized clean title
  const cleanTitle = courseTitle.replace(/\((Coursera|Udemy|NPTEL|edX|LeetCode)\)/gi, '').trim()
  if (KNOWN_COURSE_URLS[cleanTitle]) {
    return KNOWN_COURSE_URLS[cleanTitle]
  }

  const titleLower = courseTitle.toLowerCase()

  // Explicit platform tag in title
  if (titleLower.includes('coursera')) {
    return `https://www.coursera.org/search?query=${encodeURIComponent(cleanTitle)}`
  }
  if (titleLower.includes('udemy')) {
    return `https://www.udemy.com/courses/search/?q=${encodeURIComponent(cleanTitle)}`
  }
  if (titleLower.includes('leetcode')) {
    return `https://leetcode.com/problemset/all/?search=${encodeURIComponent(cleanTitle)}`
  }
  if (titleLower.includes('nptel')) {
    return `https://nptel.ac.in/courses`
  }
  if (titleLower.includes('edx')) {
    return `https://www.edx.org/search?q=${encodeURIComponent(cleanTitle)}`
  }

  // Fallback to Coursera search with the course title
  return `https://www.coursera.org/search?query=${encodeURIComponent(courseTitle)}`
}

/**
 * Returns aesthetic styling classes and badge details for a platform.
 */
export const getPlatformBadgeConfig = (platform) => {
  const name = (typeof platform === 'object' ? platform.name : platform || '').trim()
  const lower = name.toLowerCase()

  if (lower.includes('coursera')) {
    return {
      name: 'Coursera',
      badgeClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 border-blue-200',
      tagClass: 'text-blue-600 hover:text-blue-800'
    }
  }
  if (lower.includes('udemy')) {
    return {
      name: 'Udemy',
      badgeClass: 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-900 border-purple-200',
      tagClass: 'text-purple-600 hover:text-purple-800'
    }
  }
  if (lower.includes('nptel')) {
    return {
      name: 'NPTEL',
      badgeClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 border-emerald-200',
      tagClass: 'text-emerald-600 hover:text-emerald-800'
    }
  }
  if (lower.includes('leetcode')) {
    return {
      name: 'LeetCode',
      badgeClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-900 border-amber-200',
      tagClass: 'text-amber-600 hover:text-amber-800'
    }
  }

  return {
    name: name || 'Platform',
    badgeClass: 'bg-gray-50 text-primary-700 hover:bg-primary-50 hover:text-primary-800 border-gray-200',
    tagClass: 'text-primary-600 hover:text-primary-800'
  }
}
