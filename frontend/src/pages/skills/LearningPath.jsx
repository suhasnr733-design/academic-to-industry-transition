// src/pages/skills/LearningPath.jsx

import React from 'react'
import { useSkills } from '../../hooks/useSkills'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  AcademicCapIcon, 
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon
} from '@heroicons/react/outline'

export const LearningPath = () => {
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
        <Button variant="outline">
          <BookOpenIcon className="h-5 w-5 mr-2" />
          View All Courses
        </Button>
      </div>

      {path.length > 0 ? (
        <div className="space-y-6">
          {path.map((step, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full text-sm font-bold">
                      {step.step}
                    </span>
                    <h4 className="font-semibold text-gray-900">{step.skill}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      step.priority === 'High' ? 'bg-red-100 text-red-800' :
                      step.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {step.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    {step.estimated_time}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.courses?.map((course, ci) => (
                      <span key={ci} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <CheckCircleIcon className="h-5 w-5 text-gray-400 hover:text-green-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No learning path yet</h3>
          <p className="mt-2 text-gray-500">
            Upload a resume and analyze your skills to generate a personalized learning path
          </p>
          <Button className="mt-4">Upload Resume</Button>
        </div>
      )}
    </div>
  )
}