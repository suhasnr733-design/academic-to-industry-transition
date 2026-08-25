// frontend/src/pages/auth/FacultyLogin.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { AcademicCapIcon } from '@heroicons/react/outline'
import toast from 'react-hot-toast'
import { getApiBaseUrl } from '../../config/apiConfig'

const facultyLoginSchema = yup.object({
  username: yup.string().required('Faculty ID / Email is required'),
  password: yup.string().required('Password is required'),
})

export const FacultyLogin = () => {
  const navigate = useNavigate()
  const { login, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(facultyLoginSchema),
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      const user = await login(data)

      // Role check: Only faculty or admin are permitted
      if (user.role !== 'faculty' && user.role !== 'admin') {
        logout()
        toast.error('Access Denied: This account is not registered as Faculty.')
        return
      }

      toast.success(`Welcome back, Professor ${user.full_name || user.username}!`)
      navigate('/faculty')
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleFacultyLogin = () => {
    window.location.href = `${getApiBaseUrl()}/auth/google?role=faculty`
  }

  const handleLinkedInFacultyLogin = () => {
    window.location.href = `${getApiBaseUrl()}/auth/linkedin?role=faculty`
  }

  return (
    <div className="w-full max-w-md mx-auto my-auto bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-100">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <AcademicCapIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Faculty Portal</h2>
        <p className="mt-1 text-sm text-gray-500">Sign in to manage student placements & analytics</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Faculty Email or Username"
          placeholder="faculty@university.edu"
          {...register('username')}
          error={errors.username?.message}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-end text-xs sm:text-sm">
          <Link to="/forgot-password?role=faculty" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20" isLoading={isLoading}>
          Sign In to Faculty Portal
        </Button>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2 pt-2 border-t border-gray-100">
          <div>
            Need an account?{' '}
            <Link to="/faculty/register" className="text-indigo-600 font-semibold hover:underline">
              Faculty Sign Up
            </Link>
          </div>
          <div>
            Are you a student?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">
              Student Portal →
            </Link>
          </div>
        </div>
      </form>

      {/* Social login for Faculty */}
      <div className="mt-5">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2.5 bg-white text-gray-400 uppercase tracking-wider font-medium">Or continue with</span>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleFacultyLogin}
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
            onClick={handleLinkedInFacultyLogin}
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

export default FacultyLogin
