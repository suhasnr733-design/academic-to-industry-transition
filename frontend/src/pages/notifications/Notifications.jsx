// frontend/src/pages/notifications/Notifications.jsx

import React from 'react'
import { FiBell, FiCheckCircle, FiInfo, FiBriefcase } from 'react-icons/fi'

export default function Notifications() {
  const notificationsList = [
    {
      id: 1,
      title: 'Welcome to Academic-to-Industry Platform!',
      message: 'Start your journey by uploading your resume to analyze your employability score.',
      time: 'Just now',
      type: 'info',
      icon: FiInfo,
      color: 'text-blue-500 bg-blue-50'
    },
    {
      id: 2,
      title: 'Sample Job Match Found',
      message: 'Your profile matches 92% with Software Engineer at Google.',
      time: '2 hours ago',
      type: 'job',
      icon: FiBriefcase,
      color: 'text-purple-500 bg-purple-50'
    },
    {
      id: 3,
      title: 'Model Pipeline Ready',
      message: 'Machine Learning Stacking Classifier trained with 75.5% accuracy.',
      time: '1 day ago',
      type: 'success',
      icon: FiCheckCircle,
      color: 'text-green-500 bg-green-50'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FiBell className="text-primary-600" /> Notifications & Updates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time alerts, system updates, and career opportunities</p>
      </div>

      <div className="space-y-4">
        {notificationsList.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 flex items-start gap-4 hover:shadow-lg transition-shadow">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
