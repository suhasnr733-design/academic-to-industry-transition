// frontend/src/pages/settings/Profile.jsx

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  AcademicCapIcon,
  OfficeBuildingIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BookOpenIcon
} from '@heroicons/react/outline'

export const Profile = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const role = user?.role || 'student'
  const isFaculty = role === 'faculty'
  const isAdmin = role === 'admin'
  const isStudent = !isFaculty && !isAdmin

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      department: user?.department || '',
      year_of_study: user?.year_of_study || '',
      college: user?.college || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    }
  })

  // Synchronize form when user auth state updates/loads
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        department: user.department || '',
        year_of_study: user.year_of_study || '',
        college: user.college || '',
        phone: user.phone || '',
        bio: user.bio || ''
      })
    }
  }, [user, reset])

  // Watch fields for live preview and readiness calculation
  const watchedValues = watch()

  const checkFields = isFaculty
    ? ['full_name', 'department', 'college', 'phone', 'bio']
    : ['full_name', 'department', 'year_of_study', 'college', 'phone', 'bio']

  const filledCount = checkFields.filter((f) => {
    const val = watchedValues[f] !== undefined ? watchedValues[f] : user?.[f]
    return val && String(val).trim().length > 0
  }).length
  const completenessPercent = Math.round((filledCount / checkFields.length) * 100)

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      const payload = {
        ...data,
        year_of_study: isFaculty || isAdmin ? null : (data.year_of_study ? Number(data.year_of_study) : null)
      }
      await updateProfile(payload)
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

  const roleTheme = isFaculty
    ? {
        gradient: 'from-purple-600 to-indigo-600',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        cardBorder: 'border-purple-200',
        activeRing: 'focus:ring-purple-500',
        btnBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25',
        roleTitle: 'Faculty Advisor & Mentor',
        portalLink: '/faculty',
        portalLabel: 'Faculty Dashboard'
      }
    : isAdmin
    ? {
        gradient: 'from-red-600 to-orange-600',
        badgeBg: 'bg-red-100 text-red-800 border-red-200',
        cardBorder: 'border-red-200',
        activeRing: 'focus:ring-red-500',
        btnBg: 'bg-red-600 hover:bg-red-700 shadow-red-500/25',
        roleTitle: 'Platform Administrator',
        portalLink: '/admin',
        portalLabel: 'Admin Console'
      }
    : {
        gradient: 'from-primary-600 to-secondary-600',
        badgeBg: 'bg-primary-50 text-primary-700 border-primary-200',
        cardBorder: 'border-primary-200',
        activeRing: 'focus:ring-primary-500',
        btnBg: 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/25',
        roleTitle: 'Candidate / Student',
        portalLink: '/dashboard',
        portalLabel: 'Student Dashboard'
      }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Edit Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sm:p-8 space-y-6">
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
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
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
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
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
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
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
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-y"
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

        {/* Right 1 Column: Live Profile Card Preview & Details */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Live Profile Preview
              </h3>
              <span className="text-[11px] font-semibold text-gray-500">
                {isFaculty ? 'Faculty Advisor Card' : 'Candidate Card'}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md ${
                isFaculty
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/25'
                  : isAdmin
                  ? 'bg-gradient-to-tr from-red-600 to-orange-600'
                  : 'bg-gradient-to-tr from-primary-600 to-secondary-600 shadow-primary-500/25'
              }`}>
                {watchedValues.full_name?.[0] || user?.full_name?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-extrabold text-gray-900 truncate">
                  {watchedValues.full_name || user?.full_name || user?.username || 'Your Name'}
                </h4>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {user?.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${roleTheme.badgeBg}`}>
                    {role}
                  </span>
                  <span className="text-[11px] text-gray-600 truncate font-medium">
                    {watchedValues.department || user?.department || 'Department'}
                  </span>
                </div>
              </div>
            </div>

            {/* Completeness Bar */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Profile Readiness</span>
                <span className={`font-bold ${completenessPercent === 100 ? 'text-emerald-600' : 'text-primary-600'}`}>
                  {completenessPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFaculty ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-primary-500 to-secondary-500'
                  }`}
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                {completenessPercent === 100
                  ? 'All profile details are configured!'
                  : isFaculty
                  ? 'Add your college, contact phone, and mentorship bio.'
                  : 'Complete all fields for optimal industry match relevance.'}
              </p>
            </div>

            {/* Profile Info Summary Items */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center justify-between py-1 text-gray-600">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <OfficeBuildingIcon className="h-4 w-4 text-gray-400" />
                  College:
                </span>
                <span className="font-semibold text-gray-800 truncate max-w-[160px]">
                  {watchedValues.college || user?.college || 'Not set'}
                </span>
              </div>

              {isStudent && (
                <div className="flex items-center justify-between py-1 text-gray-600">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <BookOpenIcon className="h-4 w-4 text-gray-400" />
                    Academic Year:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {watchedValues.year_of_study ? `Year ${watchedValues.year_of_study}` : user?.year_of_study ? `Year ${user.year_of_study}` : 'Not set'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                  Contact:
                </span>
                <span className="font-semibold text-gray-800">
                  {watchedValues.phone || user?.phone || 'Not set'}
                </span>
              </div>
            </div>

            {/* Bio Snippet */}
            {(watchedValues.bio || user?.bio) && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  About / Bio:
                </span>
                <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100/80 line-clamp-3">
                  "{watchedValues.bio || user?.bio}"
                </p>
              </div>
            )}
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
      </div>
    </div>
  )
}

export default Profile