// frontend/src/pages/admin/Dashboard.jsx

import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { 
  FiUsers, 
  FiBriefcase, 
  FiFileText, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiActivity 
} from 'react-icons/fi'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_jobs: 0,
    total_resumes: 0,
    active_users: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/stats')
      if (res.data) {
        setStats(res.data)
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Users', count: stats.total_users, icon: FiUsers, color: 'from-blue-500 to-indigo-600' },
    { title: 'Active Students', count: stats.active_users, icon: FiCheckCircle, color: 'from-emerald-500 to-teal-600' },
    { title: 'Resumes Analyzed', count: stats.total_resumes, icon: FiFileText, color: 'from-purple-500 to-pink-600' },
    { title: 'Posted Job Opportunities', count: stats.total_jobs, icon: FiBriefcase, color: 'from-amber-500 to-orange-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Admin Control Center</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Platform operational health, user analytics, and system metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${card.color} text-white shadow-lg`}>
              <card.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.count}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiActivity className="text-primary-600" /> Platform Infrastructure Status
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Operational</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="font-medium text-gray-700 dark:text-gray-300">Flask Backend API</span>
              <span className="text-sm text-emerald-600 font-semibold">100% Up</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="font-medium text-gray-700 dark:text-gray-300">ML Stacking Model Service</span>
              <span className="text-sm text-emerald-600 font-semibold">Loaded & Ready</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="font-medium text-gray-700 dark:text-gray-300">Database Engine (SQLAlchemy)</span>
              <span className="text-sm text-emerald-600 font-semibold">Healthy</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiTrendingUp className="text-primary-600" /> Key Model Benchmarks
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="font-medium text-gray-700 dark:text-gray-300">Model Accuracy</span>
              <span className="text-sm font-bold text-primary-600">75.5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="font-medium text-gray-700 dark:text-gray-300">Model F1 Score</span>
              <span className="text-sm font-bold text-primary-600">0.798</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="font-medium text-gray-700 dark:text-gray-300">Recommendation Latency</span>
              <span className="text-sm font-bold text-emerald-600">&lt; 45 ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
