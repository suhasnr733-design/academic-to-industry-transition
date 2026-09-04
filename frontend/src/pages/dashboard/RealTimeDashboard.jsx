// frontend/src/pages/dashboard/RealTimeDashboard.jsx

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { websocket } from '../../services/websocket'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UsersIcon,
  DocumentIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshIcon
} from '@heroicons/react/outline'
import { RealTimeChart } from '../../components/dashboard/RealTimeChart'
import { ActivityFeed } from '../../components/dashboard/ActivityFeed'
import { StatsCard } from '../../components/dashboard/StatsCard'

export const RealTimeDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalResumes: 0,
    totalJobs: 0,
    placementRate: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [realtimeData, setRealtimeData] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const chartRef = useRef()

  useEffect(() => {
    // Connect to WebSocket
    const token = localStorage.getItem('access_token')
    if (token) {
      websocket.connect(token)
      websocket.joinRoom(`dashboard_${user?.id}`)
      
      websocket.socket?.on('dashboard_update', (data) => {
        setStats(data.stats)
        setRealtimeData(prev => [...prev, data].slice(-50))
      })

      websocket.socket?.on('activity_update', (data) => {
        setRecentActivities(prev => [data, ...prev].slice(0, 20))
      })

      websocket.socket?.on('connect', () => {
        setIsConnected(true)
      })

      websocket.socket?.on('disconnect', () => {
        setIsConnected(false)
      })
    }

    // Fetch initial data
    fetchDashboardData()

    return () => {
      websocket.leaveRoom(`dashboard_${user?.id}`)
      websocket.disconnect()
    }
  }, [user?.id])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/v1/analytics/dashboard')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'blue',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: UsersIcon,
      color: 'green',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Resumes',
      value: stats.totalResumes,
      icon: DocumentIcon,
      color: 'purple',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Jobs',
      value: stats.totalJobs,
      icon: BriefcaseIcon,
      color: 'orange',
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Placement Rate',
      value: `${stats.placementRate}%`,
      icon: ChartBarIcon,
      color: 'teal',
      change: '+3%',
      changeType: 'increase'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Real-time Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Live socket streaming updates and activity telemetry</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {isConnected ? '🟢 Live' : '🔴 Disconnected'}
          </span>
          <button
            onClick={fetchDashboardData}
            className="p-2 text-gray-400 hover:text-white bg-[#1E293B] border border-gray-800 rounded-xl transition-colors"
          >
            <RefreshIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111827] rounded-2xl border border-gray-800/90 shadow-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">
            Real-time Activity
          </h3>
          <RealTimeChart data={realtimeData} height={300} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111827] rounded-2xl border border-gray-800/90 shadow-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">
            Recent Activity
          </h3>
          <ActivityFeed activities={recentActivities} />
        </motion.div>
      </div>
    </div>
  )
}