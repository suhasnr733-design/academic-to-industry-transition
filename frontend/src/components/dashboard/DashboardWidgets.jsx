// frontend/src/components/dashboard/DashboardWidgets.jsx

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, PieChart, Pie, 
  RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts'
import { ChevronDownIcon, ChevronUpIcon, RefreshIcon } from '@heroicons/react/outline'

export const WidgetContainer = ({ title, children, onRefresh, loading = false }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </motion.div>
  )
}

export const InteractiveLineChart = ({ data = [], xKey = 'name', lines = [], height = 300 }) => {
  const [activeKey, setActiveKey] = useState(null)
  
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey={xKey} stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
          }}
        />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={colors[index % colors.length]}
            strokeWidth={activeKey === line.key ? 3 : 2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export const InteractivePieChart = ({ data = [], height = 300 }) => {
  const [activeIndex, setActiveIndex] = useState(null)
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

  const totalValue = data.reduce((acc, curr) => acc + (curr.value || 0), 0)

  if (totalValue === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-[300px]">
        <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl mb-3 border border-slate-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-gray-800">No Application Data Yet</p>
        <p className="text-xs text-gray-500 max-w-xs mt-1">
          Apply to jobs or RSVP to placement drives to populate your conversion funnel.
        </p>
      </div>
    )
  }
  
  const onPieEnter = (_, index) => {
    setActiveIndex(index)
  }
  
  const onPieLeave = () => {
    setActiveIndex(null)
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data.filter(d => d.value > 0)}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={activeIndex !== null ? 100 : 80}
          dataKey="value"
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
        >
          {data.filter(d => d.value > 0).map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export const InteractiveRadarChart = ({ data = [], keys = ['current', 'required'], height = 320 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
        <PolarAngleAxis 
          dataKey="name" 
          tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} 
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          stroke="#cbd5e1" 
          tick={{ fontSize: 10, fill: '#94a3b8' }} 
        />
        <Radar
          name="Your Skill Level"
          dataKey="current"
          stroke="#2563eb"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar
          name="Industry Benchmark"
          dataKey="required"
          stroke="#9333ea"
          fill="#a855f7"
          fillOpacity={0.12}
          strokeDasharray="4 4"
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
          }}
        />
        <Legend verticalAlign="bottom" height={36} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export default WidgetContainer
