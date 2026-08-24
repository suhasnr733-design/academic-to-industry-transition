// src/pages/skills/LearningPath.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSkills } from '../../hooks/useSkills'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  AcademicCapIcon, 
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  ExternalLinkIcon
} from '@heroicons/react/outline'
import { getPlatformUrl, getCourseUrl, getPlatformBadgeConfig } from '../../utils/courseUrls'

export const LearningPath = () => {
  const navigate = useNavigate()
  const { learningPath, isLoading } = useSkills()
  const [path, setPath] = React.useState([])

  React.useEffect(() => {
    const fetchPath = async () => {
      const data = await learningPath()
      setPath(data)
    }
    fetchPath()
  }, [learningPath])

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading level={2}>Your Learning Path</Heading>
          <p className="text-gray-500 mt-1">Personalized roadmap to achieve your career goals</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => window.open('https://www.coursera.org/courses', '_blank', 'noopener,noreferrer')}
          title="Browse all online courses on Coursera"
        >
          <BookOpenIcon className="h-5 w-5 mr-2" />
          View All Courses
          <ExternalLinkIcon className="h-4 w-4 ml-1.5 opacity-70" />
        </Button>
      </div>

      {path.length > 0 ? (
        <div className="space-y-6">
          {path.map((step, idx) => {
            const skillName = step.skill || step.title || step.name || 'Core Skill'
            return (
              <div key={idx} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full text-sm font-bold">
                        {step.step || idx + 1}
                      </span>
                      <h4 className="font-semibold text-gray-900">{skillName}</h4>
                      {(step.priority || step.status) && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          (step.priority === 'High' || step.status === 'urgent') ? 'bg-red-100 text-red-800' :
                          (step.priority === 'Medium' || step.status === 'in-progress') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {step.priority || step.status}
                        </span>
                      )}
                    </div>
                    {(step.estimated_time || step.duration) && (
                      <p className="mt-2 text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 inline mr-1" />
                        {step.estimated_time || step.duration}
                      </p>
                    )}
                    {step.courses && step.courses.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {step.courses.map((course, ci) => {
                          const courseTitle = typeof course === 'object' ? (course.title || course.name) : course
                          const courseUrl = getCourseUrl(course, skillName)
                          return (
                            <a
                              key={ci}
                              href={courseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-full text-sm font-medium border border-gray-200 hover:border-primary-200 transition-all group cursor-pointer"
                              title={`Open ${courseTitle} course webpage`}
                            >
                              <span className="group-hover:underline">📚 {courseTitle}</span>
                              <ExternalLinkIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary-600" />
                            </a>
                          )
                        })}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      <span className="text-xs font-medium text-gray-500">Explore on:</span>
                      {['Coursera', 'Udemy', 'NPTEL'].map((plat, pi) => {
                        const pUrl = getPlatformUrl(plat, skillName)
                        const pConfig = getPlatformBadgeConfig(plat)
                        return (
                          <a
                            key={pi}
                            href={pUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border transition-colors ${pConfig.badgeClass}`}
                            title={`Search ${skillName} on ${plat}`}
                          >
                            <span>{plat}</span>
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <CheckCircleIcon className="h-5 w-5 text-gray-400 hover:text-green-500" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No learning path yet</h3>
          <p className="mt-2 text-gray-500">
            Upload a resume and analyze your skills to generate a personalized learning path
          </p>
          <Button className="mt-4" onClick={() => navigate('/resume/upload')}>
            Upload Resume
          </Button>
        </div>
      )}
    </div>
  )
}

export default LearningPath