// src/pages/jobs/JobDetail.jsx

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  CurrencyRupeeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/outline'

export const JobDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getJob, isLoading } = useJobs()
  const [job, setJob] = React.useState(null)

  React.useEffect(() => {
    const fetchJob = async () => {
      const data = await getJob(id)
      setJob(data)
    }
    fetchJob()
  }, [id, getJob])

  if (isLoading || !job) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Jobs
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <Heading level={2}>{job.title}</Heading>
              <p className="text-xl text-gray-600 mt-1">{job.company}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                <BookmarkIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <ShareIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {job.location && (
              <span className="flex items-center text-gray-600">
                <MapPinIcon className="h-5 w-5 mr-1 text-gray-400" />
                {job.location}
              </span>
            )}
            {job.salary_range && (
              <span className="flex items-center text-gray-600">
                <CurrencyRupeeIcon className="h-5 w-5 mr-1 text-gray-400" />
                {job.salary_range}
              </span>
            )}
            {job.job_type && (
              <span className="flex items-center text-gray-600">
                <BriefcaseIcon className="h-5 w-5 mr-1 text-gray-400" />
                {job.job_type}
              </span>
            )}
            {job.posted_date && (
              <span className="flex items-center text-gray-600">
                <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
                Posted {new Date(job.posted_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Match Score */}
        {job.match_score && (
          <div className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Match Score</h4>
                <p className="text-sm text-gray-600">How well your profile matches this job</p>
              </div>
              <div className="text-3xl font-bold text-primary-600">
                {job.match_score}%
              </div>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                style={{ width: `${job.match_score}%` }}
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Job Description</h4>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>
        </div>

        {/* Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1">Apply Now</Button>
            <Button variant="outline" className="flex-1">Save Job</Button>
          </div>
        </div>
      </div>
    </div>
  )
}