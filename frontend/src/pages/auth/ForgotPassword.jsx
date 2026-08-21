// src/pages/auth/ForgotPassword.jsx

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import api from '../../services/api'
import toast from 'react-hot-toast'

const schema = yup.object({
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
})

export const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [resetInfo, setResetInfo] = useState(null)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      const response = await api.post('/auth/forgot-password', { email: data.email })
      toast.success(response.data.message || 'Password reset link sent!')
      
      if (response.data.reset_url) {
        setResetInfo(response.data)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request password reset')
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
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {resetInfo ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
              <p className="font-semibold mb-1">📧 Check Your Email Inbox!</p>
              <p className="text-xs mb-3 text-green-800">
                A password reset link has been sent to your email address. You can also click below to open the reset page directly:
              </p>
              <Button
                type="button"
                className="w-full text-sm py-2"
                onClick={() => navigate(resetInfo.reset_url)}
              >
                Open Password Reset Form
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md shadow-sm space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Send Reset Link
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

export default ForgotPassword
