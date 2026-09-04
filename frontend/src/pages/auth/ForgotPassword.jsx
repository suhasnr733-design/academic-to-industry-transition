// src/pages/auth/ForgotPassword.jsx

import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { UserIcon, AcademicCapIcon } from '@heroicons/react/outline'
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
              Academic & Faculty Advisor
            </>
          ) : (
            <>
              <UserIcon className="w-3.5 h-3.5" />
              Student Career Portal
            </>
          )}
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {isSubmitted
            ? 'Reset Link Sent!'
            : isFaculty
            ? 'Forgot Faculty Password?'
            : 'Forgot Password?'}
        </h2>
        <p className="mt-1.5 text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
          {isSubmitted
            ? 'Please check your inbox to complete the password reset process.'
            : isFaculty
            ? "Enter your registered faculty email and we'll send you a secure link to reset your password."
            : "Enter your registered email address and we'll send you a secure link to reset your password."}
        </p>
      </div>

      {notRegisteredError && (
        <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-2xl space-y-3 text-left animate-in fade-in duration-200 mb-6">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
            <span>⚠️</span> Account Not Found
          </div>
          <p className="text-xs text-amber-400/90 leading-relaxed">
            {notRegisteredError}
          </p>
          <div className="pt-1">
            {isFaculty ? (
              <Link 
                to="/faculty/register" 
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Create Faculty Account →
              </Link>
            ) : (
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Create Student Account →
              </Link>
            )}
          </div>
        </div>
      )}

      {isSubmitted ? (
        <div className="space-y-4 text-center">
          <div className="p-5 bg-emerald-950/30 text-emerald-300 rounded-2xl text-sm border border-emerald-800/50 space-y-3 shadow-xs">
            <div className="w-11 h-11 bg-emerald-900/50 text-emerald-400 rounded-xl flex items-center justify-center mx-auto text-xl shadow-xs">
              ✉️
            </div>
            <h3 className="text-sm font-bold text-emerald-200">Check Your Email Inbox</h3>
            <p className="text-xs text-emerald-400/90 leading-relaxed">
              A reset link has been dispatched to <strong className="font-semibold text-emerald-200">{submittedEmail}</strong>. Please check your inbox or spam folder. The link is valid for <strong className="font-semibold text-emerald-200">10 minutes</strong>.
            </p>
          </div>

          {/* Resend & Edit Email Controls */}
          <div className="flex items-center justify-center gap-3 text-xs pt-1">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSubmit({ email: submittedEmail })}
              className={`font-bold ${
                isFaculty ? 'text-purple-400 hover:text-purple-300' : 'text-indigo-400 hover:text-indigo-300'
              } hover:underline disabled:opacity-50 transition-colors`}
            >
              {isLoading ? 'Resending...' : 'Resend Link'}
            </button>
            <span className="text-gray-600">•</span>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false)
                setNotRegisteredError(null)
              }}
              className="text-gray-400 hover:text-white hover:underline font-medium transition-colors"
            >
              Try another email
            </button>
          </div>

          <div className="pt-3 border-t border-gray-800">
            <Link 
              to={isFaculty ? '/faculty/login' : '/login'} 
              className={`text-xs font-bold ${
                isFaculty ? 'text-purple-400 hover:text-purple-300' : 'text-indigo-400 hover:text-indigo-300'
              } hover:underline`}
            >
              ← Back to {isFaculty ? 'Faculty Sign In' : 'Sign In'}
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
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
            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg active:scale-[0.99] transition-all ${
              isFaculty
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/25'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25'
            }`}
            isLoading={isLoading}
          >
            Send Reset Link
          </Button>

          <div className="text-center pt-2">
            <Link 
              to={isFaculty ? '/faculty/login' : '/login'} 
              className={`text-xs font-semibold ${isFaculty ? 'text-purple-400 hover:text-purple-300' : 'text-indigo-400 hover:text-indigo-300'} hover:underline`}
            >
              ← Back to {isFaculty ? 'Faculty Sign In' : 'Sign In'}
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}

export default ForgotPassword
