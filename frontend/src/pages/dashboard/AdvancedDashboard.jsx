// frontend/src/pages/dashboard/AdvancedDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../../services/api'
import { WidgetContainer, InteractiveLineChart, InteractivePieChart, InteractiveRadarChart } from '../../components/dashboard/DashboardWidgets'
import { DataExport } from '../../components/common/DataExport'
import { 
  BriefcaseIcon, 
  CheckCircleIcon, 
  SparklesIcon, 
  InformationCircleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  AcademicCapIcon
} from '@heroicons/react/outline'
import toast from 'react-hot-toast'

export const AdvancedDashboard = () => {
  const [jobData, setJobData] = useState([])
  const [skillData, setSkillData] = useState([])
  const [statusData, setStatusData] = useState([])
  const [metrics, setMetrics] = useState({
    total_applications: 0,
    total_interviews: 0,
    total_offers: 0,
    has_active_resume: false
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchProgressionData = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/analytics/student/progression')
      if (res.data) {
        setJobData(res.data.trend || [])
        setSkillData(res.data.skill_data || [])
        setStatusData(res.data.status_distribution || [])
        setMetrics({
          total_applications: res.data.total_applications || 0,
          total_interviews: res.data.total_interviews || 0,
          total_offers: res.data.total_offers || 0,
          has_active_resume: res.data.has_active_resume || false
        })
      }
    } catch (err) {
      console.error('Error fetching student progression analytics:', err)
      toast.error('Failed to load career progression analytics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgressionData()
  }, [fetchProgressionData])

  const handleRefresh = () => {
    fetchProgressionData()
  }

  const exportData = [...jobData, ...statusData].filter(d => (d.applications || 0) > 0 || (d.value || 0) > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Career Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time career velocity, application funnel, and skill radar</p>
        </div>
        <div className="flex items-center space-x-3">
          {exportData.length > 0 ? (
            <DataExport data={exportData} filename="student_progression_analytics" />
          ) : (
            <button
              onClick={() => toast('No application records to export yet.')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-xs text-xs font-semibold rounded-lg text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
              title="No data to export"
            >
              Export
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
            <BriefcaseIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tracked Applications</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{metrics.total_applications}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Interviews & Drive RSVPs</p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">{metrics.total_interviews}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Hiring & Placement Offers</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.total_offers}</h3>
          </div>
        </div>
      </div>

      {/* Zero Applications Onboarding Banner */}
      {metrics.total_applications === 0 && !isLoading && (
        <div className="p-4 bg-primary-50/80 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-primary-900 dark:text-primary-200">Start Tracking Your Career Applications</h4>
              <p className="text-xs text-primary-700 dark:text-primary-300 mt-0.5">
                Mark job listings as 'Interested' or 'Applied' in the Job Board to populate your monthly velocity charts.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link
              to="/jobs"
              className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
            >
              Browse Jobs <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
            {!metrics.has_active_resume && (
              <Link
                to="/resume/upload"
                className="px-3.5 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Upload Resume
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WidgetContainer title="Job Applications Trend (Past 6 Months)" onRefresh={handleRefresh} loading={isLoading}>
            <InteractiveLineChart
              data={jobData}
              xKey="name"
              lines={[
                { key: 'applications', name: 'Applications' },
                { key: 'interviews', name: 'Interviews' },
                { key: 'offers', name: 'Offers' },
              ]}
            />
          </WidgetContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WidgetContainer title="Application Funnel Status" onRefresh={handleRefresh} loading={isLoading}>
            <InteractivePieChart data={statusData} />
          </WidgetContainer>
        </motion.div>

        {/* Skill Radar & Competency Split Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <WidgetContainer title="Resume Skill Competency vs Industry Benchmarks" onRefresh={handleRefresh} loading={isLoading}>
            {!metrics.has_active_resume || skillData.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">No Resume Uploaded Yet</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                  Upload your resume to let AI extract your technical competencies and benchmark them against real industry requisitions.
                </p>
                <Link
                  to="/resume/upload"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Upload Resume Now &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Radar Chart */}
                <div className="lg:col-span-7">
                  <InteractiveRadarChart data={skillData} keys={['current', 'required']} />
                </div>

                {/* Right: AI Insights Panel */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-gray-800/60 rounded-xl p-4 border border-slate-100 dark:border-gray-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">AI Competency Insights</h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-slate-200/70 dark:border-gray-700 shadow-2xs">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">🎯 Target Benchmark:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                        Industry standard recommends an 85% competency index for target engineering roles.
                      </p>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-slate-200/70 dark:border-gray-700 shadow-2xs">
                      <span className="font-bold text-primary-600 dark:text-primary-400">🚀 Recommended Action:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                        Take a personalized skill assessment to test your knowledge and raise your benchmark score.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Link
                      to="/assessment"
                      className="flex-1 text-center py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      Take Skill Assessment &rarr;
                    </Link>
                    <Link
                      to="/learning"
                      className="py-2 px-3 bg-white dark:bg-gray-700 hover:bg-gray-50 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Roadmap
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </WidgetContainer>
        </motion.div>
      </div>
    </div>
  )
}

export default AdvancedDashboard
