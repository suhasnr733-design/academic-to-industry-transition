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
    <div className="w-full max-w-[440px] mx-auto bg-[#111827] backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-800/90 transition-all">
      <div className="text-center mb-6">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2.5 ${
          isFaculty
            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
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

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Set New Password
        </h2>
        <p className="mt-1.5 text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
          Please create a strong new password for your account.
        </p>
      </div>

      {!token ? (
        <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-2xl space-y-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-rose-300 font-bold text-xs">
            <span>⚠️</span> Invalid or Missing Token
          </div>
          <p className="text-xs text-rose-400/90 leading-relaxed">
            The password reset link is invalid or has expired. Please request a new link.
          </p>
          <div className="pt-1">
            <Link 
              to={isFaculty ? '/forgot-password?role=faculty' : '/forgot-password'}
              className={`inline-flex items-center justify-center w-full px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-colors ${
                isFaculty ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'
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
            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg active:scale-[0.99] transition-all ${
              isFaculty
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/25'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25'
            }`}
            isLoading={isLoading}
          >
            Update Password
          </Button>

          <div className="text-center pt-2">
            <Link 
              to={isFaculty ? '/faculty/login' : '/login'} 
              className={`text-xs font-semibold hover:underline ${
                isFaculty ? 'text-purple-400 hover:text-purple-300' : 'text-indigo-400 hover:text-indigo-300'
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
