import React from 'react'
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

const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
})

export const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      const user = await login(data)
      sessionStorage.setItem('just_logged_in', 'true')
      toast.success(`Welcome back, ${user?.full_name || user?.username || 'User'}!`)
      if (user?.role === 'faculty') {
        navigate('/faculty')
      } else if (user?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${getApiBaseUrl()}/auth/google`
  }

  const handleLinkedInLogin = () => {
    window.location.href = `${getApiBaseUrl()}/auth/linkedin`
  }

  return (
    <div className="w-full max-w-[420px] mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-5 sm:p-7 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/70 dark:border-gray-700/80 transition-all">
      
      {/* Role Switcher Pills */}
      <div className="flex p-1 bg-slate-100 dark:bg-gray-700/60 rounded-xl mb-5 border border-slate-200/50 dark:border-gray-600/50">
        <button
          type="button"
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm transition-all"
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Student Portal</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/faculty/login')}
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
        >
          <AcademicCapIcon className="w-3.5 h-3.5" />
          <span>Faculty Portal</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Sign in to your account to continue
        </p>
      </div>

      <form className="space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Username or Email"
          placeholder="Enter your username or email"
          {...register('username')}
          error={errors.username?.message}
        />
        
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          {...register('password')}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center text-gray-600 dark:text-gray-400 cursor-pointer select-none">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
            />
            <span className="ml-2">Remember me</span>
          </label>

          <Link to="/forgot-password?role=student" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-primary-500/25 active:scale-[0.99] transition-all"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </form>

      {/* Social login */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-700/60">
        <div className="relative mb-3 text-center">
          <span className="px-2 text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
            Or continue with
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center items-center py-2 px-3 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xs bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 hover:border-slate-300 transition-all"
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
            onClick={handleLinkedInLogin}
            className="w-full inline-flex justify-center items-center py-2 px-3 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xs bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 hover:border-slate-300 transition-all"
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

export default Login