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
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={activeIndex !== null ? 100 : 80}
          dataKey="value"
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
        >
          {data.map((entry, index) => (
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
      </PieChart>
    </ResponsiveContainer>
  )
}

export const InteractiveRadarChart = ({ data = [], keys = [], height = 300 }) => {
  const colors = ['#3b82f6', '#8b5cf6']
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="name" stroke="#64748b" />
        <PolarRadiusAxis stroke="#64748b" />
        {keys.map((key, index) => (
          <Radar
            key={key}
            name={key}
            dataKey={key}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.6}
          />
        ))}
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
          }}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export default WidgetContainer
