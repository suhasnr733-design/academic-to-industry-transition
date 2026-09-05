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
  FiEyeOff,
  FiCopy,
  FiX
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  // Optimization 3: Instant lazy initializers from user or cached session
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

  // 2FA state management
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => Boolean(user?.two_factor_enabled))
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [isDisabling, setIsDisabling] = useState(false)

  // Sync state if user profile loads/updates asynchronously
  useEffect(() => {
    if (user) {
      if (user.notifications_enabled !== undefined) setNotifications(Boolean(user.notifications_enabled))
      if (user.email_alerts_enabled !== undefined) setEmailAlerts(Boolean(user.email_alerts_enabled))
      if (user.two_factor_enabled !== undefined) setTwoFactorEnabled(Boolean(user.two_factor_enabled))
    }
  }, [user])

  const updateLocal2FAStatus = (enabled) => {
    setTwoFactorEnabled(enabled)
    try {
      const raw = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
      if (raw) {
        const parsed = JSON.parse(raw)
        parsed.two_factor_enabled = enabled
        if (localStorage.getItem('auth_user')) localStorage.setItem('auth_user', JSON.stringify(parsed))
        if (sessionStorage.getItem('auth_user')) sessionStorage.setItem('auth_user', JSON.stringify(parsed))
      }
    } catch {}
  }

  const handleStart2FASetup = async () => {
    try {
      setIsSettingUp(true)
      const res = await api.post('/auth/2fa/setup')
      setQrCodeData(res.data)
      setVerifyCode('')
      setBackupCodes([])
      setShowSetupModal(true)
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to initialize 2FA setup')
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleVerify2FASetup = async (e) => {
    e.preventDefault()
    if (!verifyCode || verifyCode.trim().length !== 6) {
      return toast.error('Please enter the 6-digit code from your authenticator app')
    }

    try {
      setIsVerifying(true)
      const res = await api.post('/auth/2fa/verify-setup', { code: verifyCode.trim() })
      setBackupCodes(res.data.backup_codes || [])
      updateLocal2FAStatus(true)
      toast.success('Two-Factor Authentication successfully activated!')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Invalid code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisable2FA = async (e) => {
    e.preventDefault()
    if (!disablePassword) {
      return toast.error('Please enter your password to disable 2FA')
    }

    try {
      setIsDisabling(true)
      await api.post('/auth/2fa/disable', { password: disablePassword })
      updateLocal2FAStatus(false)
      setShowDisableModal(false)
      setDisablePassword('')
      toast.success('Two-Factor Authentication has been disabled')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to disable 2FA')
    } finally {
      setIsDisabling(false)
    }
  }

  // Optimization 3: Instant optimistic toggles with non-blocking background sync
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

  // Password change state
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FiSettings className="text-primary-600" /> Platform Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize your profile preferences and account security
        </p>
      </div>

      {/* Profile Overview & Quick Edit Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md ${
              user?.role === 'faculty'
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/25'
                : user?.role === 'admin'
                ? 'bg-gradient-to-tr from-red-600 to-orange-600'
                : 'bg-gradient-to-tr from-primary-600 to-secondary-600 shadow-primary-500/25'
            }`}
          >
            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {user?.full_name || user?.username || 'User Profile'}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  user?.role === 'faculty'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : user?.role === 'admin'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-primary-50 text-primary-700 border-primary-200'
                }`}
              >
                {user?.role || 'student'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.email} • {user?.department || 'Department not set'}{' '}
              {user?.college ? `• ${user.college}` : ''}
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
              <p className="text-sm text-gray-500">
                Receive alerts when resume processing or evaluations complete
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => handleToggleNotification(e.target.checked)}
              className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Email Digest & Activity Alerts
              </p>
              <p className="text-sm text-gray-500">
                Receive email notifications for critical updates
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => handleToggleEmailAlerts(e.target.checked)}
              className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSendTestDigest}
            disabled={isSendingDigest || !emailAlerts}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiMail className="w-4 h-4 text-primary-500" />
            {isSendingDigest ? 'Sending Digest...' : 'Send Test Digest'}
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={isSavingPreferences}
            className="btn-primary px-5 py-2 text-sm shadow-md disabled:opacity-50"
          >
            {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
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
        <form
          onSubmit={handleChangePassword}
          className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiKey className="text-gray-500" /> Change Password
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
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
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showOldPassword ? 'Hide password' : 'Show password'}
                >
                  {showOldPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
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
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
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
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
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
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 border border-gray-200/60 dark:border-gray-600/60">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white">
                Two-Factor Authentication (2FA)
              </p>
              {twoFactorEnabled ? (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-semibold rounded-full flex items-center gap-1">
                  <FiCheck className="w-3 h-3" /> Enabled
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Protect your account by requiring an authenticator code on every sign-in
            </p>
          </div>

          <div>
            {twoFactorEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setDisablePassword('')
                  setShowDisableModal(true)
                }}
                className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl transition-all"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart2FASetup}
                disabled={isSettingUp}
                className="btn-primary px-4 py-2 text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <FiShield className="w-3.5 h-3.5" />
                {isSettingUp ? 'Generating...' : 'Enable 2FA'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiShield className="text-primary-600" />
                {backupCodes.length > 0 ? 'Save Your Backup Codes' : 'Set Up Two-Factor Authentication'}
              </h3>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {backupCodes.length === 0 ? (
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                  1. Open Google Authenticator or Microsoft Authenticator on your smartphone.<br />
                  2. Scan the QR code below or manually type the secret key into your app.
                </p>

                {qrCodeData?.qr_code && (
                  <div className="flex justify-center my-3 p-3 bg-white rounded-xl border border-gray-200 max-w-[200px] mx-auto">
                    <img src={qrCodeData.qr_code} alt="2FA QR Code" className="w-44 h-44" />
                  </div>
                )}

                {qrCodeData?.secret && (
                  <div className="bg-gray-100 dark:bg-gray-700/60 p-2.5 rounded-lg text-center mb-4 flex items-center justify-between gap-2">
                    <div className="text-left overflow-hidden">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Secret Key:</span>
                      <code className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400 tracking-wider break-all">
                        {qrCodeData.secret}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(qrCodeData.secret)
                        toast.success('Secret key copied!')
                      }}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-500 dark:text-gray-300"
                      title="Copy Key"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleVerify2FASetup} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Enter 6-digit verification code from your app:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-xl tracking-widest font-mono py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifying || verifyCode.length !== 6}
                    className="w-full btn-primary py-2.5 text-xs font-semibold"
                  >
                    {isVerifying ? 'Verifying Code...' : 'Verify & Enable 2FA'}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 p-2.5 rounded-lg mb-3 border border-amber-200/60 dark:border-amber-700/60">
                  Save these 8 recovery codes safely. If you lose access to your phone or authenticator app, each code can be used once to log in.
                </p>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 mb-4 font-mono text-xs text-center font-bold text-gray-800 dark:text-gray-200">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 py-1.5 rounded border border-gray-200/80 dark:border-gray-700">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join('\n'))
                      toast.success('Backup codes copied!')
                    }}
                    className="flex-1 py-2 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1.5"
                  >
                    <FiCopy className="w-3.5 h-3.5" />
                    Copy Codes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSetupModal(false)}
                    className="flex-1 btn-primary py-2 text-xs font-semibold"
                  >
                    I Have Saved Them
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
              Disable Two-Factor Authentication?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Disabling 2FA will lower your account security. Please enter your account password to confirm:
            </p>

            <form onSubmit={handleDisable2FA} className="space-y-3">
              <input
                type="password"
                placeholder="Account Password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisabling || !disablePassword}
                  className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                >
                  {isDisabling ? 'Disabling...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}