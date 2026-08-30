import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { UserIcon, AcademicCapIcon } from '@heroicons/react/outline'
import toast from 'react-hot-toast'
import { getApiBaseUrl } from '../../config/apiConfig'

const facultyRegisterSchema = yup.object({
  full_name: yup.string()
    .required('Full Name / Title is required')
    .min(2, 'Name must be at least 2 characters'),
  username: yup.string()
    .required('Faculty ID / Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup.string()
    .required('Faculty Email is required')
    .email('Please enter a valid email address'),
  department: yup.string()
    .required('Academic Department is required'),
  college: yup.string()
    .required('College / University Name is required'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
})

export const FacultyRegister = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, touchedFields } } = useForm({
    resolver: yupResolver(facultyRegisterSchema),
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      const payload = {
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        department: data.department,
        college: data.college,
        password: data.password,
        role: 'faculty'
      }

      const result = await registerUser(payload)

      // Backend returns 202 for faculty (pending approval), 201 for students
      if (result?.pending) {
        toast.success(
          'Your Faculty account has been submitted for review. An administrator will activate your account shortly.',
          { duration: 7000 }
        )
      } else {
        toast.success('Faculty account created successfully! Please sign in.')
      }
      navigate('/faculty/login')
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Faculty registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleFacultyAuth = () => {
    window.location.href = `${getApiBaseUrl()}/auth/google?role=faculty`
  }

  const handleLinkedInFacultyAuth = () => {
    window.location.href = `${getApiBaseUrl()}/auth/linkedin?role=faculty`
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-5 sm:p-7 rounded-2xl shadow-xl shadow-purple-100/50 dark:shadow-none border-t-4 border-t-purple-600 border-x border-b border-purple-100/80 dark:border-gray-700/80 transition-all">
      
      {/* Role Switcher Pills */}
      <div className="flex p-1 bg-slate-100 dark:bg-gray-700/60 rounded-xl mb-4 border border-slate-200/50 dark:border-gray-600/50">
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Student Sign Up</span>
        </button>
        <button
          type="button"
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm transition-all"
        >
          <AcademicCapIcon className="w-3.5 h-3.5" />
          <span>Faculty Sign Up</span>
        </button>
      </div>

      {/* Header with Explicit Faculty Badge */}
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-700/60 mb-2">
          <AcademicCapIcon className="w-3.5 h-3.5" />
          Academic & Faculty Advisor
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Faculty Registration
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Create an educator account to manage student placements & analytics
        </p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Full Name / Title"
              placeholder="e.g. Dr. Jane Smith, Prof. Robert Miller"
              {...register('full_name')}
              error={errors.full_name?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Faculty ID / Username"
              placeholder="e.g. jsmith_faculty"
              {...register('username')}
              error={errors.username?.message}
            />
          </div>

          {/* Email is full-width so its hint stays in the same column */}
          <div className="sm:col-span-2">
            <Input
              label="Faculty Email"
              type="email"
              placeholder="e.g. professor@college.edu or faculty@rediffmail.com"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>

          <Input
            label="Department"
            placeholder="e.g. Computer Science & Eng"
            {...register('department')}
            error={errors.department?.message}
          />

          <Input
            label="College / University"
            placeholder="e.g. MIT, State University"
            {...register('college')}
            error={errors.college?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create strong password"
            {...register('password')}
            error={errors.password?.message}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button
          type="submit"
          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-md shadow-indigo-500/25 active:scale-[0.99] transition-all mt-1"
          isLoading={isLoading}
        >
          Create Faculty Account
        </Button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
          Already registered?{' '}
          <Link to="/faculty/login" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold hover:underline">
            Faculty Sign In
          </Link>
        </p>
      </form>

      {/* Social Registration */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-700/60">
        <div className="relative mb-3 text-center">
          <span className="px-2 text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
            Or continue with
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleGoogleFacultyAuth}
            className="w-full inline-flex justify-center items-center py-2 px-3 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xs bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-[#4285F4] hover:text-[#4285F4] hover:bg-blue-50/40 transition-all"
          >
            <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={handleLinkedInFacultyAuth}
            className="w-full inline-flex justify-center items-center py-2 px-3 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xs bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-[#0A66C2] hover:text-[#0A66C2] hover:bg-blue-50/40 transition-all"
          >
            <svg className="w-3.5 h-3.5 mr-2" fill="#0A66C2" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.77a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94Z"/>
            </svg>
            LinkedIn
          </button>
        </div>
      </div>
    </div>
  )
}

export default FacultyRegister

