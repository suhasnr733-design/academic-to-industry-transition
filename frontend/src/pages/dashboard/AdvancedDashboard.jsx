// frontend/src/pages/dashboard/AdvancedDashboard.jsx

import React, { useState, useEffect } from 'react'
import { useGetProfileQuery } from '../../services/api'
import { motion } from 'framer-motion'
import { WidgetContainer, InteractiveLineChart, InteractivePieChart, InteractiveRadarChart } from '../../components/dashboard/DashboardWidgets'
import { DataExport } from '../../components/common/DataExport'

const generateMockData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  return months.map((month) => ({
    name: month,
    applications: Math.floor(Math.random() * 50) + 10,
    interviews: Math.floor(Math.random() * 20) + 5,
    offers: Math.floor(Math.random() * 10) + 1,
  }))
}

const generateSkillData = () => {
  const skills = ['Python', 'Java', 'SQL', 'React', 'ML', 'AWS']
  return skills.map((skill) => ({
    name: skill,
    current: Math.floor(Math.random() * 100) + 20,
    required: Math.floor(Math.random() * 100) + 20,
  }))
}

const generateStatusData = () => {
  const statuses = ['Applied', 'Interviewing', 'Offered', 'Rejected', 'Pending']
  return statuses.map((status) => ({
    name: status,
    value: Math.floor(Math.random() * 30) + 5,
  }))
}

export const AdvancedDashboard = () => {
  const { data: userData, isLoading: userLoading } = useGetProfileQuery()
  const [jobData, setJobData] = useState([])
  const [skillData, setSkillData] = useState([])
  const [statusData, setStatusData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setJobData(generateMockData())
      setSkillData(generateSkillData())
      setStatusData(generateStatusData())
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setJobData(generateMockData())
      setSkillData(generateSkillData())
      setStatusData(generateStatusData())
      setIsLoading(false)
    }, 1000)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Dashboard</h1>
          <p className="text-gray-500 mt-1">Comprehensive analytics and career progression insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <DataExport data={[...jobData, ...statusData]} filename="dashboard_data" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WidgetContainer title="Job Applications Trend" onRefresh={handleRefresh} loading={isLoading}>
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
          <WidgetContainer title="Application Status" onRefresh={handleRefresh} loading={isLoading}>
            <InteractivePieChart data={statusData} />
          </WidgetContainer>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <WidgetContainer title="Skill Analysis" onRefresh={handleRefresh} loading={isLoading}>
            <InteractiveRadarChart data={skillData} keys={['current', 'required']} />
          </WidgetContainer>
        </motion.div>
      </div>
    </div>
  )
}

export default AdvancedDashboard
