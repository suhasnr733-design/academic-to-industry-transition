// src/pages/auth/ForgotPassword.jsx

import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') // 'student' or 'faculty'
  const isFaculty = role === 'faculty'

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [notRegisteredError, setNotRegisteredError] = useState(null)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setNotRegisteredError(null)
      const response = await api.post('/auth/forgot-password', { email: data.email })
      setSubmittedEmail(data.email)
      toast.success(response.data.message || 'Password reset link sent!')
      setIsSubmitted(true)
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to request password reset'
      if (error.response?.status === 404) {
        setNotRegisteredError(msg)
      }
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <div className={`mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr ${isFaculty ? 'from-indigo-600 to-purple-600' : 'from-primary-600 to-indigo-500'} flex items-center justify-center text-white font-bold text-xl shadow-md`}>
            AI
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isFaculty ? 'Faculty Password Reset' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your {isFaculty ? 'faculty ' : ''}email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {notRegisteredError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-left animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
              <span>⚠️</span> Account Not Found
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              {notRegisteredError}
            </p>
            <div className="pt-1">
              {isFaculty ? (
                <Link 
                  to="/faculty/register" 
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Create Faculty Account →
                </Link>
              ) : (
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Create Student Account →
                </Link>
              )}
            </div>
          </div>
        )}

        {isSubmitted ? (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-green-50 text-green-800 rounded-xl text-sm border border-green-200 space-y-3">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                📧
              </div>
              <h3 className="text-base font-bold text-green-900">Check Your Email Inbox</h3>
              <p className="text-xs text-green-700 leading-relaxed">
                A password reset link has been dispatched to <strong>{submittedEmail}</strong>. Please check your inbox or spam folder to set a new password.
              </p>
            </div>
            <div className="pt-2">
              <Link 
                to={isFaculty ? '/faculty/login' : '/login'} 
                className={`text-sm font-medium ${isFaculty ? 'text-indigo-600 hover:text-indigo-500' : 'text-primary-600 hover:text-primary-500'}`}
              >
                ← Back to {isFaculty ? 'Faculty Portal' : 'Sign In'}
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md shadow-sm space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder={isFaculty ? 'faculty@university.edu' : 'name@example.com'}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <Button
              type="submit"
              className={`w-full ${isFaculty ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
              isLoading={isLoading}
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-1">
              <Link 
                to={isFaculty ? '/faculty/login' : '/login'} 
                className={`text-xs font-medium ${isFaculty ? 'text-indigo-600 hover:text-indigo-500' : 'text-primary-600 hover:text-primary-500'}`}
              >
                ← Back to {isFaculty ? 'Faculty Sign In' : 'Sign In'}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
