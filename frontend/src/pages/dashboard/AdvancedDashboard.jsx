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
  ArrowRightIcon
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

  const exportData = [...jobData, ...statusData]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Career Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time career velocity, application funnel, and skill radar</p>
        </div>
        <div className="flex items-center space-x-3">
          <DataExport data={exportData} filename="student_progression_analytics" />
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <BriefcaseIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tracked Applications</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{metrics.total_applications}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Interviews & Drive RSVPs</p>
            <h3 className="text-2xl font-black text-purple-600">{metrics.total_interviews}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Hiring & Placement Offers</p>
            <h3 className="text-2xl font-black text-emerald-600">{metrics.total_offers}</h3>
          </div>
        </div>
      </div>

      {/* Zero Applications Onboarding Banner */}
      {metrics.total_applications === 0 && !isLoading && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-indigo-900">Start Tracking Your Career Applications</h4>
              <p className="text-xs text-indigo-700 mt-0.5">
                Mark job listings as 'Interested' or 'Applied' in the Job Board to populate your monthly velocity charts.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link
              to="/jobs"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              Browse Jobs <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
            {!metrics.has_active_resume && (
              <Link
                to="/resume/upload"
                className="px-3 py-1.5 bg-white hover:bg-gray-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors"
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

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <WidgetContainer title="Resume Skill Competency vs Industry Benchmarks" onRefresh={handleRefresh} loading={isLoading}>
            <InteractiveRadarChart data={skillData} keys={['current', 'required']} />
          </WidgetContainer>
        </motion.div>
      </div>
    </div>
  )
}

export default AdvancedDashboard

