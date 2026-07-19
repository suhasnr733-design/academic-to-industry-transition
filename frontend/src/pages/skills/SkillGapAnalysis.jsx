// src/pages/skills/SkillGapAnalysis.jsx

import React from 'react'
import { useParams } from 'react-router-dom'
import { useSkills } from '../../hooks/useSkills'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/outline'

export const SkillGapAnalysis = () => {
  const { resumeId } = useParams()
  const { getGapAnalysis, isLoading } = useSkills()
  const [analysis, setAnalysis] = React.useState(null)

  React.useEffect(() => {
    const fetchAnalysis = async () => {
      const data = await getGapAnalysis(resumeId)
      setAnalysis(data)
    }
    fetchAnalysis()
  }, [resumeId, getGapAnalysis])

  if (isLoading || !analysis) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level={2}>Skill Gap Analysis</Heading>
            <p className="text-gray-500 mt-1">
              {analysis.match_percentage}% match with target role
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600">
              {analysis.match_percentage}%
            </div>
            <div className="text-sm text-gray-500">Overall Match</div>
          </div>
        </div>

        {/* Match Progress Bar */}
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
            style={{ width: `${analysis.match_percentage}%` }}
          />
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matching Skills */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              Matching Skills ({analysis.matching_skills?.length || 0})
            </h4>
            <div className="space-y-2">
              {analysis.matching_skills?.map((skill, idx) => (
                <div key={idx} className="flex items-center p-3 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-900">{skill}</span>
                </div>
              ))}
              {(!analysis.matching_skills || analysis.matching_skills.length === 0) && (
                <p className="text-gray-400 text-center py-4">No matching skills found</p>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              Missing Skills ({analysis.missing_skills?.length || 0})
            </h4>
            <div className="space-y-2">
              {analysis.missing_skills?.map((skill, idx) => (
                <div key={idx} className="flex items-center p-3 bg-red-50 rounded-lg">
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-gray-900">{skill}</span>
                  <span className="ml-auto text-xs text-red-500">Gap</span>
                </div>
              ))}
              {(!analysis.missing_skills || analysis.missing_skills.length === 0) && (
                <p className="text-gray-400 text-center py-4">No missing skills found!</p>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Recommended Learning</h4>
            <div className="space-y-4">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{rec.skill}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{rec.estimated_time}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rec.courses?.map((course, ci) => (
                      <span key={ci} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {course}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rec.platforms?.map((platform, pi) => (
                      <span key={pi} className="text-xs text-primary-600">{platform}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Path */}
        {analysis.learning_path && analysis.learning_path.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Learning Path</h4>
            <div className="relative pl-8 border-l-2 border-primary-200 space-y-6">
              {analysis.learning_path.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-10 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {step.step}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h5 className="font-medium text-gray-900">{step.skill}</h5>
                    <p className="text-sm text-gray-500">{step.estimated_time}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {step.courses?.map((course, ci) => (
                        <span key={ci} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs">
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}