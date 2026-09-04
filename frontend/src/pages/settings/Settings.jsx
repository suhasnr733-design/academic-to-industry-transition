import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiSettings,
  FiBell,
  FiShield,
  FiKey,
  FiMail,
  FiLock,
  FiCheck,
  FiUser,
  FiEye,
  FiEyeOff
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState(() => {
    if (user?.notifications_enabled !== undefined) return Boolean(user.notifications_enabled)
    try {
      const cached = JSON.parse(localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user') || '{}')
      return cached.notifications_enabled !== undefined ? Boolean(cached.notifications_enabled) : true
    } catch {
      return true
    }
  })
  const [emailAlerts, setEmailAlerts] = useState(() => {
    if (user?.email_alerts_enabled !== undefined) return Boolean(user.email_alerts_enabled)
    try {
      const cached = JSON.parse(localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user') || '{}')
      return cached.email_alerts_enabled !== undefined ? Boolean(cached.email_alerts_enabled) : true
    } catch {
      return true
    }
  })
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.notifications_enabled !== undefined) setNotifications(Boolean(user.notifications_enabled))
      if (user.email_alerts_enabled !== undefined) setEmailAlerts(Boolean(user.email_alerts_enabled))
    }
  }, [user])

  const handleToggleNotification = async (enabled) => {
    setNotifications(enabled)
    try {
      await updateProfile({ notifications_enabled: enabled })
    } catch (err) {
      setNotifications(!enabled)
      toast.error('Failed to update notification preference')
    }
  }

  const handleToggleEmailAlerts = async (enabled) => {
    setEmailAlerts(enabled)
    try {
      await updateProfile({ email_alerts_enabled: enabled })
    } catch (err) {
      setEmailAlerts(!enabled)
      toast.error('Failed to update email alerts preference')
    }
  }

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false)
  const [isSendingDigest, setIsSendingDigest] = useState(false)

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true)
      await updateProfile({
        notifications_enabled: notifications,
        email_alerts_enabled: emailAlerts
      })
      toast.success('Preferences saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save preferences')
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const handleSendTestDigest = async () => {
    if (!emailAlerts) {
      return toast.error('Please enable Email Digest & Activity Alerts first')
    }
    try {
      setIsSendingDigest(true)
      const res = await api.post('/notifications/send-digest')
      toast.success(res.data?.message || 'Test digest email sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to send test digest email')
    } finally {
      setIsSendingDigest(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!passwordForm.oldPassword) {
      return toast.error('Please enter your current password')
    }
    if (!passwordForm.newPassword) {
      return toast.error('Please enter a new password')
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters')
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match')
    }

    try {
      setIsChangingPassword(true)
      const res = await api.post('/auth/change-password', {
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      })
      toast.success(res.data?.message || 'Password changed successfully!')
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      return toast.error('User email not found')
    }
    try {
      setIsSendingResetEmail(true)
      const res = await api.post('/auth/forgot-password', { email: user.email })
      toast.success(res.data?.message || `Password reset link sent to ${user.email}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger reset email')
    } finally {
      setIsSendingResetEmail(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
          <FiSettings className="text-indigo-400" /> Platform Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Customize your profile preferences and account security
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md ${
              user?.role === 'faculty'
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/25'
                : user?.role === 'admin'
                ? 'bg-gradient-to-tr from-rose-600 to-orange-600'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-500/25'
            }`}
          >
            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {user?.full_name || user?.username || 'User Profile'}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  user?.role === 'faculty'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : user?.role === 'admin'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                }`}
              >
                {user?.role || 'student'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {user?.email} • {user?.department || 'Department not set'}{' '}
              {user?.college ? `• ${user.college}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="px-4 py-2.5 font-semibold text-xs rounded-xl transition-all border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-1.5 self-start sm:self-center flex-shrink-0 cursor-pointer"
        >
          <FiUser className="w-4 h-4" />
          Edit Profile Information &rarr;
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FiBell className="text-indigo-400" /> Notification Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1E293B] border border-gray-700/80 rounded-xl">
            <div>
              <p className="font-semibold text-white text-sm">In-App Notifications</p>
              <p className="text-xs text-gray-400">
                Receive alerts when resume processing or evaluations complete
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => handleToggleNotification(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1E293B] border border-gray-700/80 rounded-xl">
            <div>
              <p className="font-semibold text-white text-sm">
                Email Digest & Activity Alerts
              </p>
              <p className="text-xs text-gray-400">
                Receive email notifications for critical updates
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => handleToggleEmailAlerts(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSendTestDigest}
            disabled={isSendingDigest || !emailAlerts}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-700 text-gray-300 hover:bg-[#1E293B] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiMail className="w-4 h-4 text-indigo-400" />
            {isSendingDigest ? 'Sending Digest...' : 'Send Test Digest'}
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={isSavingPreferences}
            className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-md disabled:opacity-50"
          >
            {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Security & Password */}
      <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiShield className="text-indigo-400" /> Security & Password Management
          </h2>
          <span className="text-xs text-gray-400 bg-[#1E293B] border border-gray-700 px-3 py-1 rounded-full font-medium">
            Account: {user?.email || 'Logged In'}
          </span>
        </div>

        {/* Change Password Form */}
        <form
          onSubmit={handleChangePassword}
          className="space-y-4 pt-2 border-t border-gray-800"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FiKey className="text-gray-400" /> Change Password
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-gray-700/80 bg-[#1E293B] text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showOldPassword ? 'Hide password' : 'Show password'}
                >
                  {showOldPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-gray-700/80 bg-[#1E293B] text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-gray-700/80 bg-[#1E293B] text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-gray-400">
              Forgot your current password? You can request a reset link sent to your email.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSendingResetEmail}
                className="px-4 py-2 text-xs font-semibold text-gray-300 bg-[#1E293B] border border-gray-700 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FiMail className="w-3.5 h-3.5" />
                {isSendingResetEmail ? 'Sending Link...' : 'Email Reset Link'}
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-md flex items-center gap-1.5"
              >
                <FiLock className="w-3.5 h-3.5" />
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </form>

        {/* 2FA Section */}
        <div className="p-4 bg-[#1E293B] border border-gray-700/80 rounded-xl flex items-center justify-between mt-4">
          <div>
            <p className="font-semibold text-white text-sm">
              Two-Factor Authentication (2FA)
            </p>
            <p className="text-xs text-gray-400">Enhance your account login security</p>
          </div>
          <span className="px-3 py-1 bg-[#0F172A] text-gray-400 border border-gray-700 text-xs font-semibold rounded-full">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}