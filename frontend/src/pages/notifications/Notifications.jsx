// frontend/src/pages/notifications/Notifications.jsx

import React, { useState, useEffect } from 'react'
import { FiBell, FiCheckCircle, FiInfo, FiBriefcase, FiInbox } from 'react-icons/fi'
import { api } from '../../services/api'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/notifications')
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications)
      } else {
        setNotifications([])
      }
    } catch (err) {
      console.log('Error loading notifications:', err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FiBell className="text-primary-600" /> Notifications & Updates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time alerts, system updates, and career opportunities</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 flex items-start gap-4 hover:shadow-lg transition-shadow">
              <div className="p-3 rounded-xl text-blue-500 bg-blue-50 dark:bg-blue-900/30">
                <FiInfo className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.title || item.type}</h3>
                  <span className="text-xs text-gray-400">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <FiInbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You are all caught up with your updates and announcements.</p>
        </div>
      )}
    </div>
  )
}

