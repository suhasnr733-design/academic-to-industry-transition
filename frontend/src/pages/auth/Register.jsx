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
  college: yup.string().required('College / University is required'),
  year_of_study: yup.number()
    .typeError('Year of study must be a number')
    .required('Year of study is required')
    .min(1, 'Please select your academic year')
    .max(6, 'Year must be between 1 and 6'),
})

export const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      year_of_study: 1
    }
  })

  const selectedYear = watch('year_of_study')

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      await registerUser({ ...data, role: 'student' })

      // Tokens are now stored in AuthContext.register() — navigate directly to dashboard
      const firstName = data.full_name?.split(' ')[0] || data.username
      toast.success(`🎉 Welcome to TransitionAI, ${firstName}! Your account is ready.`, { duration: 5000 })
      navigate('/dashboard')
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
    <div className="w-full max-w-lg mx-auto bg-[#111827] backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-800/90 transition-all">
      
      {/* Role Switcher Pills */}
      <div className="flex p-1 bg-[#1E293B] rounded-2xl mb-6 border border-gray-800">
        <button
          type="button"
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md transition-all"
        >
          <UserIcon className="w-4 h-4" />
          <span>Student Sign Up</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/faculty/register')}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 text-gray-400 hover:text-white transition-all"
        >
          <AcademicCapIcon className="w-4 h-4" />
          <span>Faculty Sign Up</span>
        </button>
      </div>

      {/* Header with Explicit Student Badge */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2.5">
          <UserIcon className="w-3.5 h-3.5" />
          Student Career Portal
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Student Account
        </h2>
        <p className="mt-1.5 text-xs text-gray-400">
          Join to accelerate your transition from academia to industry
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
              placeholder="Enter your university or personal email"
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

          <Input
            label="College / University"
            placeholder="e.g. IIT Bombay, VIT, MIT"
            {...register('college')}
            error={errors.college?.message}
          />
          
          <div className="w-full sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 tracking-wide">
              Year / Academic Stage
            </label>
            <div className={`grid grid-cols-3 gap-1.5 p-1.5 bg-[#1E293B] rounded-2xl border ${
              errors.year_of_study ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-800'
            } items-center`}>
              {[
                { val: 1, label: '1st' },
                { val: 2, label: '2nd' },
                { val: 3, label: '3rd' },
                { val: 4, label: '4th' },
                { val: 5, label: "Master's" },
                { val: 6, label: 'PhD' },
              ].map((item) => {
                const isSelected = Number(selectedYear) === item.val
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setValue('year_of_study', item.val, { shouldValidate: true })}
                    className={`py-2 flex items-center justify-center text-xs font-bold rounded-xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
            {errors.year_of_study && (
              <p className="mt-1 text-xs text-rose-400">{errors.year_of_study.message}</p>
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
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all mt-2"
          isLoading={isLoading}
        >
          Create Student Account
        </Button>

        <p className="text-center text-xs text-gray-400 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </form>

      {/* Social login for students */}
      <div className="mt-5 pt-4 border-t border-gray-800">
        <div className="relative mb-3.5 text-center">
          <span className="px-2 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
            Or continue with
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleStudentAuth}
            className="w-full inline-flex justify-center items-center py-2.5 px-3 border border-gray-700/80 rounded-xl shadow-sm bg-[#1E293B] text-xs font-semibold text-gray-200 hover:bg-[#334155] hover:border-gray-600 transition-all active:scale-95"
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
            className="w-full inline-flex justify-center items-center py-2.5 px-3 border border-gray-700/80 rounded-xl shadow-sm bg-[#1E293B] text-xs font-semibold text-gray-200 hover:bg-[#334155] hover:border-gray-600 transition-all active:scale-95"
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