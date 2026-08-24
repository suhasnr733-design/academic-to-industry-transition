// src/pages/auth/Register.jsx

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import toast from 'react-hot-toast'
import { getApiBaseUrl } from '../../config/apiConfig'

const registerSchema = yup.object({
  username: yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup.string()
    .required('Email is required')
    .email('Invalid email address'),
  full_name: yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
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
  department: yup.string().required('Department is required'),
  year_of_study: yup.number()
    .typeError('Year of study must be a number')
    .required('Year of study is required')
    .min(1, 'Year must be between 1 and 4')
    .max(4, 'Year must be between 1 and 4'),
})

export const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      await registerUser({ ...data, role: 'student' })
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleStudentAuth = () => {
    window.location.href = `${getApiBaseUrl()}/auth/google?role=student`
  }

  const handleLinkedInStudentAuth = () => {
    window.location.href = `${getApiBaseUrl()}/auth/linkedin?role=student`
  }

  return (
    <div className="w-full max-w-lg mx-auto my-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100/80">
      <div>
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
            <span className="text-white text-xl font-bold">AI</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold text-gray-900 tracking-tight">
          Create Student Account
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-gray-500">
          Join us to accelerate your transition from academia to industry
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            {...register('full_name')}
            error={errors.full_name?.message}
          />
          
          <Input
            label="Username"
            placeholder="Choose a username"
            {...register('username')}
            error={errors.username?.message}
          />
          
          <div className="sm:col-span-2">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
          
          <Input
            label="Department"
            placeholder="e.g. Computer Science"
            {...register('department')}
            error={errors.department?.message}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
            <select
              {...register('year_of_study')}
              className={`w-full px-3.5 py-2.5 bg-white border ${
                errors.year_of_study ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all`}
            >
              <option value="">Select Year of Study</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            {errors.year_of_study && (
              <p className="mt-1 text-xs text-red-500">{errors.year_of_study.message}</p>
            )}
          </div>
          
          <Input
            label="Password"
            type="password"
            placeholder="Create password"
            {...register('password')}
            error={errors.password?.message}
          />
          
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button
          type="submit"
          className="w-full py-2.5 mt-2"
          isLoading={isLoading}
        >
          Create Student Account
        </Button>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2 pt-2 border-t border-gray-100">
          <div>
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-semibold">
              Sign in
            </Link>
          </div>
          <div>
            <Link to="/faculty/register" className="text-indigo-600 hover:text-indigo-800 font-semibold">
              🎓 Faculty Sign Up →
            </Link>
          </div>
        </div>
      </form>

      {/* Social login for students */}
      <div className="mt-5">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleStudentAuth}
            className="w-full inline-flex justify-center items-center py-2 px-3 border border-gray-200 rounded-lg shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={handleLinkedInStudentAuth}
            className="w-full inline-flex justify-center items-center py-2 px-3 border border-gray-200 rounded-lg shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            <svg className="w-4 h-4 mr-2" fill="#0A66C2" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.77a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94Z"/>
            </svg>
            LinkedIn
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register