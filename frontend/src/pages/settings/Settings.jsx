// frontend/src/pages/settings/Settings.jsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSettings, FiBell, FiShield, FiKey, FiMail, FiLock, FiCheck, FiUser } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false)

  const handleSavePreferences = () => {
    toast.success('Preferences saved successfully')
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FiSettings className="text-primary-600" /> Platform Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your profile preferences and account security</p>
      </div>

      {/* Profile Overview & Quick Edit Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md ${
            user?.role === 'faculty'
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/25'
              : user?.role === 'admin'
              ? 'bg-gradient-to-tr from-red-600 to-orange-600'
              : 'bg-gradient-to-tr from-primary-600 to-secondary-600 shadow-primary-500/25'
          }`}>
            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {user?.full_name || user?.username || 'User Profile'}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                user?.role === 'faculty'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : user?.role === 'admin'
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-primary-50 text-primary-700 border-primary-200'
              }`}>
                {user?.role || 'student'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.email} • {user?.department || 'Department not set'} {user?.college ? `• ${user.college}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className={`px-4 py-2.5 font-semibold text-xs rounded-xl transition-all border flex items-center gap-1.5 self-start sm:self-center flex-shrink-0 ${
            user?.role === 'faculty'
              ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
              : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200'
          }`}
        >
          <FiUser className="w-4 h-4" />
          Edit Profile Information &rarr;
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiBell className="text-primary-600" /> Notification Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">In-App Notifications</p>
              <p className="text-sm text-gray-500">Receive alerts when resume processing or evaluations complete</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifications} 
              onChange={e => setNotifications(e.target.checked)}
              className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Email Digest & Activity Alerts</p>
              <p className="text-sm text-gray-500">Receive email notifications for critical updates</p>
            </div>
            <input 
              type="checkbox" 
              checked={emailAlerts} 
              onChange={e => setEmailAlerts(e.target.checked)}
              className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSavePreferences}
            className="btn-primary px-5 py-2 text-sm shadow-md"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Security & Password */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiShield className="text-primary-600" /> Security & Password Management
          </h2>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">
            Account: {user?.email || 'Logged In'}
          </span>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiKey className="text-gray-500" /> Change Password
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordForm.oldPassword}
                onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-gray-500">
              Forgot your current password? You can request a reset link sent to your email.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSendingResetEmail}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FiMail className="w-3.5 h-3.5" />
                {isSendingResetEmail ? 'Sending Link...' : 'Email Reset Link'}
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="btn-primary px-5 py-2 text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <FiLock className="w-3.5 h-3.5" />
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </form>

        {/* 2FA Section */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between mt-4">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</p>
            <p className="text-sm text-gray-500">Enhance your account login security</p>
          </div>
          <span className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}
