// src/pages/auth/ResetPassword.jsx

import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import api from '../../services/api'
import toast from 'react-hot-toast'

const schema = yup.object({
  new_password: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirm_password: yup.string()
    .oneOf([yup.ref('new_password'), null], 'Passwords must match')
    .required('Confirm password is required'),
})

export const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
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
      toast.success(response.data.message || 'Password reset successful!')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
            AI
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>

        {!token ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 text-center">
            <p className="font-semibold mb-2">Invalid or Missing Reset Token</p>
            <p className="text-xs mb-4">Please request a new password reset link.</p>
            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-500 font-medium">
              Go to Forgot Password Page
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md shadow-sm space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  error={errors.new_password?.message}
                  {...register('new_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-[36px] text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  error={errors.confirm_password?.message}
                  {...register('confirm_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[36px] text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Reset Password
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
