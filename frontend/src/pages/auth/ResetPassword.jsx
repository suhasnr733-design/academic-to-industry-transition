// src/pages/auth/ResetPassword.jsx

import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { UserIcon, AcademicCapIcon } from '@heroicons/react/outline'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import api from '../../services/api'
import toast from 'react-hot-toast'

const schema = yup.object({
  new_password: yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirm_password: yup.string()
    .oneOf([yup.ref('new_password'), null], 'Passwords must match')
    .required('Confirm password is required'),
})

export const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const role = searchParams.get('role')
  const isFaculty = role === 'faculty'
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Missing or invalid reset token.')
      return
    }

    try {
      setIsLoading(true)
      const response = await api.post('/auth/reset-password', {
        token: token,
        new_password: data.new_password
      })
      toast.success(response.data.message || 'Password reset successful! Please sign in.')
      navigate(isFaculty ? '/faculty/login' : '/login')
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`w-full max-w-[420px] mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-5 sm:p-7 rounded-2xl shadow-xl border-x border-b transition-all ${
      isFaculty
        ? 'border-t-4 border-t-purple-600 border-purple-100/80 dark:border-gray-700/80 shadow-purple-100/50 dark:shadow-none'
        : 'border-t-4 border-t-primary-600 border-primary-100/80 dark:border-gray-700/80 shadow-primary-100/50 dark:shadow-none'
    }`}>
      <div className="text-center mb-5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border mb-2.5 ${
          isFaculty
            ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-700/60'
            : 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border-primary-200/80 dark:border-primary-700/60'
        }`}>
          {isFaculty ? (
            <>
              <AcademicCapIcon className="w-3.5 h-3.5" />
              Faculty Security
            </>
          ) : (
            <>
              <UserIcon className="w-3.5 h-3.5" />
              Account Security
            </>
          )}
        </span>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Set New Password
        </h2>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
          Please create a strong new password for your account.
        </p>
      </div>

      {!token ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-xl space-y-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-red-800 dark:text-red-300 font-semibold text-xs">
            <span>⚠️</span> Invalid or Missing Token
          </div>
          <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
            The password reset link is invalid or has expired. Please request a new link.
          </p>
          <div className="pt-1">
            <Link 
              to={isFaculty ? '/forgot-password?role=faculty' : '/forgot-password'}
              className={`inline-flex items-center justify-center w-full px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                isFaculty ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              Request New Link →
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="New Password"
            type="password"
            placeholder="Create strong password"
            error={errors.new_password?.message}
            {...register('new_password')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Repeat new password"
            error={errors.confirm_password?.message}
            {...register('confirm_password')}
          />

          <Button
            type="submit"
            className={`w-full py-2.5 text-white font-medium shadow-md active:scale-[0.99] transition-all ${
              isFaculty
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25'
                : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-primary-500/25'
            }`}
            isLoading={isLoading}
          >
            Update Password
          </Button>

          <div className="text-center pt-1">
            <Link 
              to={isFaculty ? '/faculty/login' : '/login'} 
              className={`text-xs font-medium hover:underline ${
                isFaculty ? 'text-indigo-600 dark:text-indigo-400' : 'text-primary-600 dark:text-primary-400'
              }`}
            >
              ← Back to {isFaculty ? 'Faculty Sign In' : 'Sign In'}
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}

export default ResetPassword
