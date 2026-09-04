// frontend/src/pages/notifications/Notifications.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiBell, FiCheckCircle, FiInfo, FiBriefcase, 
  FiInbox, FiAward, FiTrendingUp, FiArrowRight, 
  FiCheck, FiUsers, FiExternalLink, FiTrash2, 
  FiStar, FiSearch, FiSliders, FiMail, 
  FiRefreshCw, FiAlertTriangle, FiZap, FiX, 
  FiClock, FiShield, FiChevronRight, FiFileText
} from 'react-icons/fi'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all') // 'all' | 'placement_offer' | 'job_match' | 'skill_gap' | 'mentorship' | 'resume_processed'
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'unread' | 'starred'
  const [searchQuery, setSearchQuery] = useState('')
  const [markingAll, setMarkingAll] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [clearing, setClearing] = useState(false)
  
  // Starred items stored in local state/storage
  const [starredIds, setStarredIds] = useState(() => {
    try {
      const saved = localStorage.getItem('transitionai_starred_notifs')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Preferences Modal state
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false)
  const [preferences, setPreferences] = useState({
    placementAlerts: true,
    jobMatches: true,
    skillGapAlerts: true,
    mentorshipUpdates: true,
    emailDigests: true,
    minMatchPercentage: 85
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('transitionai_starred_notifs', JSON.stringify(starredIds))
    } catch (e) {
      console.error('Failed to persist starred notifications:', e)
    }
  }, [starredIds])

  const fetchNotifications = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      else setLoading(true)
      
      const res = await api.get('/notifications?per_page=50')
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications)
        if (showRefreshToast) toast.success('Real-time alerts synced')
      } else {
        setNotifications([])
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
      if (showRefreshToast) toast.error('Failed to refresh alerts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      toast.success('Marked as read', { duration: 1500, id: `read-${id}` })
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true)
      // Optimistic state update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      await api.post('/notifications/mark-all-read')
      toast.success('All notifications marked as read', { id: 'mark-all-read-toast' })
    } catch (err) {
      console.error('Error marking all read:', err)
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
      setStarredIds(prev => prev.filter(item => item !== id))
      toast.success('Notification removed')
    } catch (err) {
      console.error('Error deleting notification:', err)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification removed')
    }
  }

  const handleClearRead = async () => {
    try {
      setClearing(true)
      await api.delete('/notifications/clear-all?read_only=true')
      setNotifications(prev => prev.filter(n => !n.is_read))
      toast.success('Cleared all read notifications')
    } catch (err) {
      console.error('Error clearing read notifications:', err)
      setNotifications(prev => prev.filter(n => !n.is_read))
      toast.success('Cleared read notifications')
    } finally {
      setClearing(false)
    }
  }

  const handleToggleStar = (id, e) => {
    if (e) e.stopPropagation()
    setStarredIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSendCareerDigest = async () => {
    try {
      setSendingDigest(true)
      const res = await api.post('/notifications/send-digest')
      toast.success(res.data?.message || 'Personalized career digest sent to your email!')
    } catch (err) {
      console.error('Error sending digest:', err)
      toast.error(err.response?.data?.message || 'Failed to dispatch email digest. Verify email settings.')
    } finally {
      setSendingDigest(false)
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
      case 'placement':
        return {
          icon: FiAward,
          categoryLabel: 'Campus Placement',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          glowClass: 'from-amber-500/10 to-orange-500/5 hover:border-amber-500/40',
          iconContainer: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          actionText: 'Review Placement RSVP',
          tag: 'Drive Nomination',
          priority: 'HIGH PRIORITY'
        }
      case 'job_match':
        return {
          icon: FiBriefcase,
          categoryLabel: 'Job Opportunity',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          glowClass: 'from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/40',
          iconContainer: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          actionText: 'Explore Matched Role',
          tag: 'High Fit Match',
          priority: 'RECOMMENDED'
        }
      case 'skill_gap':
      case 'warning':
        return {
          icon: FiAlertTriangle,
          categoryLabel: 'AI Skill Gap Alert',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          glowClass: 'from-rose-500/10 to-pink-500/5 hover:border-rose-500/40',
          iconContainer: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          actionText: 'Open Skill Roadmap',
          tag: 'Readiness Impact',
          priority: 'CRITICAL GAP'
        }
      case 'mentorship':
        return {
          icon: FiUsers,
          categoryLabel: 'Faculty Mentorship',
          badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          glowClass: 'from-purple-500/10 to-indigo-500/5 hover:border-purple-500/40',
          iconContainer: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          actionText: 'Open Faculty Hub',
          tag: 'Advisor Review',
          priority: 'FEEDBACK'
        }
      case 'resume_processed':
      case 'success':
        return {
          icon: FiCheckCircle,
          categoryLabel: 'Resume & ATS Audit',
          badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          glowClass: 'from-blue-500/10 to-cyan-500/5 hover:border-blue-500/40',
          iconContainer: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
          actionText: 'View ATS Breakdown',
          tag: 'Verified ATS',
          priority: 'SYSTEM'
        }
      default:
        return {
          icon: FiZap,
          categoryLabel: 'System Signal',
          badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          glowClass: 'from-sky-500/10 to-indigo-500/5 hover:border-sky-500/40',
          iconContainer: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
          actionText: 'View Details',
          tag: 'Notification',
          priority: 'INFO'
        }
    }
  }

  // Filter and Search Pipeline
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Category filter
      if (filterCategory !== 'all') {
        if (filterCategory === 'placement_offer' && item.type !== 'placement_offer' && item.type !== 'placement') return false
        if (filterCategory === 'job_match' && item.type !== 'job_match') return false
        if (filterCategory === 'skill_gap' && item.type !== 'skill_gap' && item.type !== 'warning') return false
        if (filterCategory === 'mentorship' && item.type !== 'mentorship') return false
        if (filterCategory === 'resume_processed' && item.type !== 'resume_processed' && item.type !== 'success') return false
      }

      // Status filter
      if (filterStatus === 'unread' && item.is_read) return false
      if (filterStatus === 'starred' && !starredIds.includes(item.id)) return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = (item.title || '').toLowerCase().includes(q)
        const msgMatch = (item.message || '').toLowerCase().includes(q)
        const typeMatch = (item.type || '').toLowerCase().includes(q)
        if (!titleMatch && !msgMatch && !typeMatch) return false
      }

      return true
    })
  }, [notifications, filterCategory, filterStatus, searchQuery, starredIds])

  const unreadCount = notifications.filter(n => !n.is_read).length
  const starredCount = starredIds.length

  // Categorical Counts
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      placement: notifications.filter(n => n.type === 'placement_offer' || n.type === 'placement').length,
      jobs: notifications.filter(n => n.type === 'job_match').length,
      skillGap: notifications.filter(n => n.type === 'skill_gap' || n.type === 'warning').length,
      mentorship: notifications.filter(n => n.type === 'mentorship').length,
      resume: notifications.filter(n => n.type === 'resume_processed' || n.type === 'success').length,
    }
  }, [notifications])

  // Find high priority urgent item for hero attention deck
  const urgentAlert = useMemo(() => {
    return notifications.find(n => !n.is_read && (n.type === 'placement_offer' || n.type === 'skill_gap')) || null
  }, [notifications])

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-16 px-2 sm:px-4">
      {/* 1. Header & Real-time Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <FiBell className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Real-time Alerts & Signals
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </h1>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">
            Live status of campus placement drives, verified ATS resume scores, skill gaps, and active opportunities.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Realtime Feed */}
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            title="Sync real-time alerts"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white bg-[#111827] border border-gray-800 hover:border-gray-700 rounded-xl transition-all hover:bg-gray-800/80 active:scale-95"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync</span>
          </button>

          {/* Email Digest Trigger */}
          <button
            onClick={handleSendCareerDigest}
            disabled={sendingDigest}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <FiMail className="w-3.5 h-3.5 text-indigo-400" />
            <span>{sendingDigest ? 'Sending...' : 'Send Career Digest'}</span>
          </button>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all active:scale-95"
            >
              <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{markingAll ? 'Updating...' : 'Mark all read'}</span>
            </button>
          )}

          {/* Clear Read */}
          <button
            onClick={handleClearRead}
            disabled={clearing}
            title="Clear already read notifications"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 bg-[#111827] border border-gray-800 hover:border-gray-700 rounded-xl transition-all active:scale-95"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Read</span>
          </button>

          {/* Preferences */}
          <button
            onClick={() => setIsPrefModalOpen(true)}
            title="Notification Settings"
            className="p-2.5 text-gray-400 hover:text-white bg-[#111827] border border-gray-800 hover:border-gray-700 rounded-xl transition-all hover:bg-gray-800/80 active:scale-95"
          >
            <FiSliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Urgent Attention Banner (If Critical Action Exists) */}
      {urgentAlert && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-indigo-950/40 border border-amber-500/40 p-4 sm:p-5 shadow-lg shadow-amber-500/5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                <FiAlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/40 tracking-wider">
                    Action Required
                  </span>
                  <span className="text-xs text-amber-300/80">
                    High Priority Placement Alert
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {urgentAlert.title}
                </h4>
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5 max-w-2xl line-clamp-2">
                  {urgentAlert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => handleNotificationClick(urgentAlert)}
                className="px-4 py-2 text-xs font-bold text-gray-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Take Action Now</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Search & Filter Command Deck */}
      <div className="bg-[#111827] border border-gray-800/90 rounded-2xl p-3 sm:p-4 space-y-3.5 shadow-sm">
        {/* Search & Status Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts by title, role, company, or keyword..."
              className="w-full pl-10 pr-9 py-2 bg-[#1E293B]/70 hover:bg-[#1E293B] focus:bg-[#1E293B] border border-gray-700/70 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-0.5"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 bg-[#1E293B]/60 p-1 rounded-xl border border-gray-800 self-start md:self-auto shrink-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterStatus('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === 'unread'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterStatus === 'unread' ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterStatus('starred')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterStatus === 'starred'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <FiStar className={`w-3 h-3 ${filterStatus === 'starred' ? 'fill-current' : ''}`} />
              <span>Starred ({starredCount})</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {[
            { key: 'all', label: 'All Signals', count: counts.all, icon: FiBell },
            { key: 'placement_offer', label: '🎯 Placements & Drives', count: counts.placement, icon: FiAward },
            { key: 'job_match', label: '💼 Job Matches', count: counts.jobs, icon: FiBriefcase },
            { key: 'skill_gap', label: '⚡ AI Skill Gaps', count: counts.skillGap, icon: FiAlertTriangle },
            { key: 'mentorship', label: '🎓 Mentorship', count: counts.mentorship, icon: FiUsers },
            { key: 'resume_processed', label: '📄 Resume & ATS', count: counts.resume, icon: FiCheckCircle },
          ].map(tab => {
            const isActive = filterCategory === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setFilterCategory(tab.key)}
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-xs'
                    : 'bg-[#1E293B]/40 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Notifications Feed List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111827]/60 border border-gray-800 rounded-3xl">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-gray-400 font-medium tracking-wide">Syncing real-time career signals...</p>
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3.5">
          <AnimatePresence>
            {filteredNotifications.map((item, idx) => {
              const config = getTypeConfig(item.type)
              const Icon = config.icon
              const hasLink = Boolean(item.link)
              const isStarred = starredIds.includes(item.id)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative bg-gradient-to-r ${config.glowClass} bg-[#111827] rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                    item.is_read
                      ? 'border-gray-800/80 hover:border-gray-700 opacity-85 hover:opacity-100'
                      : 'border-indigo-500/30 ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5'
                  } ${hasLink ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Icon Container */}
                    <div className={`p-3 rounded-2xl shrink-0 ${config.iconContainer}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 w-full min-w-0">
                      {/* Meta Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}>
                            {config.categoryLabel}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-800/90 text-gray-400 border border-gray-700/60">
                            {config.priority}
                          </span>
                          {!item.is_read && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500 text-white shadow-xs">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Timestamp & Star */}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiClock className="w-3 h-3 text-gray-400" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Recent'}
                          </span>

                          <button
                            onClick={(e) => handleToggleStar(item.id, e)}
                            title={isStarred ? 'Unstar' : 'Star for later'}
                            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-amber-400 transition-colors"
                          >
                            <FiStar className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-200 transition-colors mb-1">
                        {item.title || config.categoryLabel}
                      </h3>

                      {/* Body Message */}
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-3.5">
                        {item.message}
                      </p>

                      {/* Bottom Interactive Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-800/70">
                        {/* Primary Action Button */}
                        {hasLink ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all">
                            <span>{config.actionText}</span>
                            <FiChevronRight className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <FiInfo className="w-3 h-3" /> System status notification
                          </span>
                        )}

                        {/* Card Hover Action Deck */}
                        <div className="flex items-center gap-3">
                          {!item.is_read ? (
                            <button
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1"
                            >
                              <FiCheck className="w-3 h-3" />
                              <span>Mark read</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <FiCheckCircle className="w-3 h-3 text-emerald-500/70" />
                              Read
                            </span>
                          )}

                          <button
                            onClick={(e) => handleDeleteNotification(item.id, e)}
                            title="Delete notification"
                            className="text-gray-400 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Real-time Platform Navigation Empty State */
        <div className="text-center py-16 px-4 bg-[#111827]/80 rounded-3xl border border-gray-800 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <FiInbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {filterStatus === 'unread' ? 'All caught up! No unread alerts' : 'No alerts in this category'}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            {filterStatus === 'unread'
              ? 'You have reviewed all your placement invitations, job matches, and ATS notifications.'
              : 'Explore live campus placement drives, open industry roles, or update your resume to receive live updates.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/placement-drives')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <FiAward className="w-3.5 h-3.5" />
              <span>Explore Placement Drives</span>
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2 text-xs font-semibold text-gray-200 bg-[#1E293B] hover:bg-gray-800 rounded-xl border border-gray-700 transition-all flex items-center gap-1.5"
            >
              <FiBriefcase className="w-3.5 h-3.5" />
              <span>Browse Jobs</span>
            </button>
            <button
              onClick={() => navigate('/resume')}
              className="px-4 py-2 text-xs font-semibold text-gray-200 bg-[#1E293B] hover:bg-gray-800 rounded-xl border border-gray-700 transition-all flex items-center gap-1.5"
            >
              <FiFileText className="w-3.5 h-3.5" />
              <span>Resume Studio</span>
            </button>
            <button
              onClick={() => { setFilterCategory('all'); setFilterStatus('all'); setSearchQuery(''); }}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* 5. Notification Preferences Modal */}
      {isPrefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111827] border border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <FiSliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Alert Preferences</h3>
                  <p className="text-xs text-gray-400">Manage real-time push and email triggers</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrefModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Switches */}
            <div className="space-y-4">
              {[
                {
                  key: 'placementAlerts',
                  title: 'Campus Placement Drives & RSVP Deadlines',
                  desc: 'Immediate alerts when faculty nominates you for corporate hiring drives.',
                  icon: FiAward,
                  color: 'text-amber-400'
                },
                {
                  key: 'jobMatches',
                  title: 'High-Fit Job Recommendations',
                  desc: 'Notify when a new job posting matches 85%+ of your verified skills.',
                  icon: FiBriefcase,
                  color: 'text-emerald-400'
                },
                {
                  key: 'skillGapAlerts',
                  title: 'AI Skill Gap Warnings & Roadmap',
                  desc: 'Suggestions on high-demand skills to elevate your hiring potential.',
                  icon: FiAlertTriangle,
                  color: 'text-rose-400'
                },
                {
                  key: 'mentorshipUpdates',
                  title: 'Faculty Mentor Reviews & Endorsements',
                  desc: 'Updates when your academic advisor reviews your projects.',
                  icon: FiUsers,
                  color: 'text-purple-400'
                },
                {
                  key: 'emailDigests',
                  title: 'Weekly Career Digest Email',
                  desc: 'Comprehensive summary of ATS resume audit and open job matches.',
                  icon: FiMail,
                  color: 'text-indigo-400'
                },
              ].map(item => {
                const Icon = item.icon
                const enabled = preferences[item.key]
                return (
                  <div key={item.key} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-[#1E293B]/40 border border-gray-800/80">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl bg-gray-800/80 shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">{item.title}</h5>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enabled ? 'bg-indigo-600' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
              <button
                onClick={() => setIsPrefModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsPrefModalOpen(false)
                  toast.success('Alert preferences saved successfully!')
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
