// frontend/src/pages/settings/Settings.jsx

import React, { useState } from 'react'
import { FiSettings, FiBell, FiShield, FiMoon, FiGlobe } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Settings() {
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const handleSave = () => {
    toast.success('Settings saved successfully')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FiSettings className="text-primary-600" /> Platform Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your preferences and account security</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiBell className="text-primary-600" /> Notification Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">In-App Notifications</p>
              <p className="text-sm text-gray-500">Receive alerts when resume processing completes</p>
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
              <p className="font-semibold text-gray-900 dark:text-white">Email Digest & Job Matches</p>
              <p className="text-sm text-gray-500">Receive emails for high-match job opportunities</p>
            </div>
            <input 
              type="checkbox" 
              checked={emailAlerts} 
              onChange={e => setEmailAlerts(e.target.checked)}
              className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiShield className="text-primary-600" /> Security & Privacy
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</p>
            <p className="text-sm text-gray-500">Enhance your account login security</p>
          </div>
          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">Disabled</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          className="btn-primary px-6 py-3 text-base shadow-lg"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
