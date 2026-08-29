// frontend/src/pages/notifications/Notifications.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiBell, FiCheckCircle, FiInfo, FiBriefcase, 
  FiInbox, FiAward, FiTrendingUp, FiArrowRight, 
  FiCheck, FiUsers, FiExternalLink 
} from 'react-icons/fi'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false)

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
      console.error('Error loading notifications:', err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true)
      await api.post('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (err) {
      console.error('Error marking all read:', err)
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const handleNotificationClick = async (item) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id)
    }
    if (item.link) {
      navigate(item.link)
    }
  }

  const getTypeConfig = (type) => {
    switch (type) {
      case 'placement_offer':
        return {
          icon: FiAward,
          iconBg: 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200',
          badgeText: 'Campus Placement',
          actionText: 'Review Drive RSVP',
          cardBorder: 'hover:border-amber-300'
        }
      case 'job_match':
        return {
          icon: FiTrendingUp,
          iconBg: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200',
          badgeText: 'Job Recommendation',
          actionText: 'Explore Job Opening',
          cardBorder: 'hover:border-emerald-300'
        }
      case 'resume_processed':
        return {
          icon: FiCheckCircle,
          iconBg: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
          badgeBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border-blue-200',
          badgeText: 'Resume Analyzed',
          actionText: 'View ATS Breakdown',
          cardBorder: 'hover:border-blue-300'
        }
      case 'mentorship':
        return {
          icon: FiUsers,
          iconBg: 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
          badgeBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border-purple-200',
          badgeText: 'Faculty Mentorship',
          actionText: 'Open Mentorship',
          cardBorder: 'hover:border-purple-300'
        }
      default:
        return {
          icon: FiInfo,
          iconBg: 'bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
          badgeBg: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 border-sky-200',
          badgeText: 'System Alert',
          actionText: 'View Details',
          cardBorder: 'hover:border-sky-300'
        }
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FiBell className="text-primary-600" /> Notifications & Updates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time placement invitations, ATS verification updates, and career opportunities
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-100 transition-colors shadow-2xs"
          >
            <FiCheck className="w-4 h-4" />
            <span>{markingAll ? 'Marking...' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              filter === 'unread' ? 'bg-white text-primary-600' : 'bg-primary-100 text-primary-700'
            }`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : displayedNotifications.length > 0 ? (
        <div className="space-y-4">
          {displayedNotifications.map(item => {
            const config = getTypeConfig(item.type)
            const Icon = config.icon
            const hasLink = Boolean(item.link)

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border transition-all duration-200 flex flex-col sm:flex-row items-start gap-4 ${
                  hasLink ? 'cursor-pointer hover:shadow-md' : ''
                } ${config.cardBorder} ${
                  item.is_read 
                    ? 'border-gray-200/80 dark:border-gray-700 opacity-90' 
                    : 'border-primary-200 dark:border-primary-900/60 ring-1 ring-primary-100/50 dark:ring-primary-900/30 bg-primary-50/10'
                }`}
              >
                {/* Type Icon */}
                <div className={`p-3 rounded-2xl shrink-0 ${config.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${config.badgeBg}`}>
                        {config.badgeText}
                      </span>
                      {!item.is_read && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-primary-600 text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Recent'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                    {item.title || item.type}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3">
                    {item.message}
                  </p>

                  {/* Action Link & Mark Read */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    {hasLink ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-0.5 transition-transform">
                        <span>{config.actionText}</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">No action required</span>
                    )}

                    {!item.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700 p-8">
          <FiInbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You have reviewed all your alerts and invitations.'
              : 'You will receive real-time alerts here when campus placement drives are scheduled or your resume is processed.'}
          </p>
        </div>
      )}
    </div>
  )
}
