import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  ArrowLeftIcon, 
  LocationMarkerIcon as MapPinIcon, 
  CurrencyDollarIcon as CurrencyRupeeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ShareIcon,
  BookmarkIcon,
  StarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/outline'
import { BookmarkIcon as BookmarkSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/solid'
import toast from 'react-hot-toast'

export const JobDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getJobById, isLoading, toggleJobInterest, isJobInterested } = useJobs()
  const [job, setJob] = React.useState(null)
  const [mentees, setMentees] = React.useState([])
  const [loadingMentees, setLoadingMentees] = React.useState(false)

  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin'

  React.useEffect(() => {
    const fetchJob = async () => {
      const data = await getJobById(id)
      setJob(data)
    }
    fetchJob()
  }, [id, getJobById])

  React.useEffect(() => {
    const fetchInterestedMentees = async () => {
      if (!isFacultyOrAdmin || !id) return
      try {
        setLoadingMentees(true)
        const res = await api.get(`/jobs/${id}/interested-mentees`)
        setMentees(res.data?.mentees || [])
      } catch (err) {
        console.error('Error fetching interested mentees:', err)
      } finally {
        setLoadingMentees(false)
      }
    }
    fetchInterestedMentees()
  }, [id, isFacultyOrAdmin])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this position at ${job?.company}`,
        url: window.location.href
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (isLoading || !job) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4" />
      </div>
    )
  }

  const isSaved = isJobInterested(job)

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium text-sm transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Campus Board & Jobs
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Heading level={2}>{job.title}</Heading>
                {job.source && (
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full uppercase">
                    {job.source}
                  </span>
                )}
              </div>
              <p className="text-xl font-semibold text-primary-600 mt-1">{job.company}</p>
            </div>
            <div className="flex items-center space-x-2">
              {!isFacultyOrAdmin && (
                <button
                  onClick={() => toggleJobInterest(job)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSaved 
                      ? 'bg-amber-50 text-amber-500 border-amber-200 shadow-xs' 
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title={isSaved ? "Saved to Campus Board" : "Save to Campus Board"}
                >
                  {isSaved ? <StarSolidIcon className="h-5 w-5 text-amber-500" /> : <StarIcon className="h-5 w-5" />}
                </button>
              )}
              <Button variant="ghost" size="sm" onClick={handleShare} title="Share Opportunity">
                <ShareIcon className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
            {job.location && (
              <span className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                {job.location}
              </span>
            )}
            {job.salary_range && (
              <span className="flex items-center">
                <CurrencyRupeeIcon className="h-4 w-4 mr-1 text-gray-400" />
                {job.salary_range}
              </span>
            )}
            {job.job_type && (
              <span className="flex items-center">
                <BriefcaseIcon className="h-4 w-4 mr-1 text-gray-400" />
                {job.job_type}
              </span>
            )}
            {job.posted_date && (
              <span className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                Posted {new Date(job.posted_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Match Score */}
        {job.match_score && (
          <div className="p-6 bg-gradient-to-r from-primary-50 to-indigo-50 border-b border-primary-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">Academic Skill Match</h4>
                <p className="text-sm text-gray-600">Calculated against your parsed resume competencies</p>
              </div>
              <div className="text-3xl font-extrabold text-primary-700">
                {Math.round(job.match_score)}%
              </div>
            </div>
            <div className="mt-2 w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full"
                style={{ width: `${Math.round(job.match_score)}%` }}
              />
            </div>
          </div>
        )}

        {/* Application Deadline Countdown Banner */}
        {job.expires_at && (() => {
          try {
            const exp = new Date(job.expires_at)
            const now = new Date()
            const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))

            if (diffDays === 1) {
              return (
                <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-3 text-rose-800">
                    <ClockIcon className="h-6 w-6 text-rose-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">🚨 Urgent: 1 day left to apply!</p>
                      <p className="text-xs text-rose-600">Application portal closes on {exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-xs">
                    1 Day Left
                  </span>
                </div>
              )
            } else if (diffDays === 2) {
              return (
                <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-amber-900">
                    <ClockIcon className="h-6 w-6 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">⚡ Closing Soon: 2 days left to apply!</p>
                      <p className="text-xs text-amber-700">Application deadline: {exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs">
                    2 Days Left
                  </span>
                </div>
              )
            } else if (diffDays > 2 && diffDays <= 7) {
              return (
                <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-amber-900">
                    <ClockIcon className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">⏰ {diffDays} days left to apply</p>
                      <p className="text-xs text-amber-700">Deadline: {exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold">
                    {diffDays} Days Left
                  </span>
                </div>
              )
            } else if (diffDays > 7) {
              return (
                <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-slate-800">
                    <ClockIcon className="h-5 w-5 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Application Deadline</p>
                      <p className="text-xs text-slate-500">Apply before {exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({diffDays} days remaining)</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                    {diffDays} Days Remaining
                  </span>
                </div>
              )
            }
            return null
          } catch (e) { return null }
        })()}

        {/* Description */}
        <div className="p-6 md:p-8">
          <h4 className="font-bold text-gray-900 text-lg mb-3">Role Overview & Responsibilities</h4>
          <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
            {job.description || 'No detailed description provided for this campus opportunity.'}
          </div>
        </div>

        {/* Required Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-gray-900 text-base mb-3">Required Technical Competencies</h4>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-white text-gray-800 font-semibold border border-gray-200 rounded-lg text-xs shadow-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
          {isFacultyOrAdmin ? (
            /* ================= FACULTY ACTION VIEW ================= */
            <>
              {job.apply_url && (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all text-center text-sm"
                >
                  View Official Company Posting ↗
                </a>
              )}
              <Button 
                variant="outline"
                className="flex-1 py-3 font-semibold flex items-center justify-center gap-2 border-purple-200 text-purple-700 bg-white hover:bg-purple-50"
                onClick={() => navigate('/faculty?tab=students&scope=mentees')}
              >
                <span>🎓</span> Return to Faculty Portal
              </Button>
            </>
          ) : (
            /* ================= STUDENT ACTION VIEW ================= */
            <>
              {job.apply_url ? (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-all text-center"
                >
                  Apply on Company Portal ↗
                </a>
              ) : (
                <Button className="flex-1 py-3 text-base">
                  Submit Campus Application
                </Button>
              )}
              <Button 
                variant={isSaved ? "secondary" : "outline"} 
                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 ${
                  isSaved ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : ''
                }`}
                onClick={() => toggleJobInterest(job)}
              >
                {isSaved ? <StarSolidIcon className="h-5 w-5 text-amber-500" /> : <StarIcon className="h-5 w-5" />}
                {isSaved ? "Saved to Campus Board ⭐" : "Save to Campus Board"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Faculty Advisor Mentee Card */}
      {isFacultyOrAdmin && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-primary-900 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <AcademicCapIcon className="h-6 w-6 text-purple-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Assigned Mentees Interested
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-400/30 text-purple-100 border border-purple-300/30">
                    {mentees.length}
                  </span>
                </h3>
                <p className="text-xs text-purple-200">
                  Accepted mentees from your cohort who marked interest or applied to {job.company}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/faculty?tab=students&scope=mentees')}
              className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              Open Faculty Portal
              <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
            </button>
          </div>

          <div className="p-6">
            {loadingMentees ? (
              <div className="flex items-center justify-center py-8 space-x-3 text-purple-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                <span className="text-sm font-medium">Checking your mentee cohort...</span>
              </div>
            ) : mentees.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {mentees.map((m) => (
                  <div key={m.student_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/40 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {m.full_name?.[0] || m.username?.[0] || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{m.full_name || m.username}</p>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                            m.interest_status === 'offer'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.interest_status === 'interviewing'
                              ? 'bg-blue-100 text-blue-800'
                              : m.interest_status === 'applied'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {m.interest_status || 'Interested'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.department || 'Student'} {m.year_of_study ? `• Year ${m.year_of_study}` : ''} • {m.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => navigate(`/faculty?scope=mentees&selectedStudent=${m.student_id}&tab=students`)}
                        className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-100/70 hover:bg-purple-200 rounded-lg transition-all shadow-xs"
                      >
                        Go to Faculty Mentee Page
                        <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                <UserGroupIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 text-sm">No Accepted Mentees Interested Yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  When one of your accepted mentees saves this job or applies to {job.company}, they will automatically appear here with direct links to their profile.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobDetail