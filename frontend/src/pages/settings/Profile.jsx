// frontend/src/pages/settings/Profile.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/outline'

// Optimization 4: Synchronous prefill resolver from context or session storage (0.00s instant prefill)
const getInitialProfileValues = (currentUser) => {
  let source = currentUser
  if (!source) {
    try {
      source = JSON.parse(localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user') || '{}')
    } catch {
      source = {}
    }
  }
  return {
    full_name: source?.full_name || '',
    email: source?.email || '',
    department: source?.department || '',
    year_of_study: source?.year_of_study || '',
    college: source?.college || '',
    phone: source?.phone || '',
    bio: source?.bio || ''
  }
}

export const Profile = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const role = user?.role || 'student'
  const isFaculty = role === 'faculty'
  const isAdmin = role === 'admin'
  const isStudent = !isFaculty && !isAdmin

  // Optimization 4: useForm initialized with prefilled values directly (no empty-state layout shift)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: getInitialProfileValues(user)
  })

  // Synchronize form when user auth state updates/loads
  useEffect(() => {
    if (user) {
      reset(getInitialProfileValues(user), { keepDirty: true })
    }
  }, [user, reset])

  const onSubmit = async (data) => {
    // Optimization 4: Skip redundant network roundtrips if unchanged
    if (!isDirty) {
      toast.success('Profile is already up to date!')
      return
    }

    try {
      setIsLoading(true)
      const payload = {
        ...data,
        year_of_study: isFaculty || isAdmin ? null : (data.year_of_study ? Number(data.year_of_study) : null)
      }
      await updateProfile(payload)
      reset(data)
      toast.success(
        isFaculty
          ? '🎉 Faculty profile updated successfully!'
          : '🎉 Profile updated successfully!'
      )
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to update profile'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Optimization 4: Memoize roleTheme to prevent recomputation on every form keystroke
  const roleTheme = useMemo(() => {
    if (isFaculty) {
      return {
        gradient: 'from-purple-600 to-indigo-600',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        cardBorder: 'border-purple-200',
        activeRing: 'focus:ring-purple-500',
        btnBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25',
        roleTitle: 'Faculty Advisor & Mentor',
        portalLink: '/faculty',
        portalLabel: 'Faculty Dashboard'
      }
    }
    if (isAdmin) {
      return {
        gradient: 'from-red-600 to-orange-600',
        badgeBg: 'bg-red-100 text-red-800 border-red-200',
        cardBorder: 'border-red-200',
        activeRing: 'focus:ring-red-500',
        btnBg: 'bg-red-600 hover:bg-red-700 shadow-red-500/25',
        roleTitle: 'Platform Administrator',
        portalLink: '/admin',
        portalLabel: 'Admin Console'
      }
    }
    return {
      gradient: 'from-primary-600 to-secondary-600',
      badgeBg: 'bg-primary-50 text-primary-700 border-primary-200',
      cardBorder: 'border-primary-200',
      activeRing: 'focus:ring-primary-500',
      btnBg: 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/25',
      roleTitle: 'Candidate / Student',
      portalLink: '/dashboard',
      portalLabel: 'Student Dashboard'
    }
  }, [isFaculty, isAdmin])

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Header Card */}
      <div className={`bg-gradient-to-r ${roleTheme.gradient} rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20">
              {isFaculty ? (
                <AcademicCapIcon className="h-4 w-4 text-purple-200" />
              ) : (
                <SparklesIcon className="h-4 w-4 text-amber-300" />
              )}
              <span>{isFaculty ? 'Faculty Portal • Profile Settings' : 'Student Career Suite • Profile'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isFaculty ? 'Faculty Profile & Academic Settings' : 'Student Profile Settings'}
            </h1>
            <p className="text-white/85 text-sm sm:text-base max-w-2xl leading-relaxed">
              {isFaculty
                ? 'Manage your academic department details, institutional affiliation, office contact, and mentorship bio for student guidance.'
                : 'Update your personal information, department, year of study, and career summary for AI resume matching and placement drives.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm shadow-sm"
              onClick={() => navigate(roleTheme.portalLink)}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to {roleTheme.portalLabel}
            </Button>
          </div>
        </div>

        {/* Ambient Decorative Background Circles */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserCircleIcon className="h-5 w-5 text-gray-600" />
              {isFaculty ? 'Faculty Information' : 'Personal & Academic Details'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isFaculty
                ? 'These details will be displayed to your department students and administrators.'
                : 'Keep your information updated to ensure accuracy in placement drives and evaluations.'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${roleTheme.badgeBg}`}>
            {role}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('full_name', { required: 'Full name is required' })}
                placeholder={isFaculty ? 'e.g. Dr. Jane Smith' : 'e.g. Alex Johnson'}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-all ${
                  errors.full_name
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : isFaculty
                    ? 'border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                }`}
              />
              {errors.full_name && (
                <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email (Disabled / Read-only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Email Address
                </label>
                <span className="text-[10px] text-gray-400 font-medium">Primary Account</span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-500 rounded-xl cursor-not-allowed"
                />
                <ShieldCheckIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {isFaculty ? 'Academic Department' : 'Department / Branch'}
              </label>
              <input
                type="text"
                {...register('department')}
                placeholder={isFaculty ? 'e.g. Computer Science & Engineering' : 'e.g. CSE / Information Technology'}
                className={`w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl outline-none ${
                  isFaculty
                    ? 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    : 'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                }`}
              />
            </div>

            {/* Year of Study (Only for students) */}
            {isStudent && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Year of Study
                </label>
                <select
                  {...register('year_of_study')}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-white"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year (Freshman)</option>
                  <option value="2">2nd Year (Sophomore)</option>
                  <option value="3">3rd Year (Junior)</option>
                  <option value="4">4th Year (Senior)</option>
                  <option value="5">5th Year (Dual Degree)</option>
                </select>
              </div>
            )}

            {/* College / Institution */}
            <div className={!isStudent ? 'md:col-span-1' : ''}>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {isFaculty ? 'University / College Institution' : 'College / University'}
              </label>
              <input
                type="text"
                {...register('college')}
                placeholder="e.g. Institute of Technology"
                className={`w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl outline-none ${
                  isFaculty
                    ? 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    : 'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                }`}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {isFaculty ? 'Office / Contact Phone' : 'Phone Number'}
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+91 98765 43210"
                className={`w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl outline-none ${
                  isFaculty
                    ? 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    : 'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                }`}
              />
            </div>
          </div>

          {/* Bio / About */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {isFaculty ? 'Faculty Bio & Mentorship Focus' : 'Candidate Bio & Summary'}
            </label>
            <textarea
              {...register('bio')}
              rows="4"
              className={`w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl outline-none resize-y ${
                isFaculty
                  ? 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                  : 'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
              }`}
              placeholder={
                isFaculty
                  ? 'Share your academic specializations, research focus, office availability hours, and mentorship areas for students...'
                  : 'Tell recruiters and mentors about your core strengths, tech stack interests, projects, and career aspirations...'
              }
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              <span>Changes update across all platform modules instantly.</span>
            </div>
            <Button
              type="submit"
              isLoading={isLoading}
              className={`w-full sm:w-auto text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md ${
                isFaculty ? 'bg-purple-600 hover:bg-purple-700' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Role Support Quick Card */}
      <div className="bg-gradient-to-tr from-slate-50 to-purple-50/40 rounded-2xl p-5 border border-purple-100 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <ShieldCheckIcon className="h-4 w-4 text-purple-600" />
          {isFaculty ? 'Faculty Access & Privileges' : 'Student Privacy & Control'}
        </h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          {isFaculty
            ? 'As a department mentor, your name & department are linked when you shortlist students, create campus recruitment drives, or endorse resumes.'
            : 'Your profile data is protected and only shared with verified campus recruiters and assigned department coordinators.'}
        </p>
      </div>
    </div>
  )
}

export default Profile