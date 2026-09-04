// src/pages/auth/AuthCallback.jsx

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'

export const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthLogin } = useAuth()
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const processCallback = async () => {
      const error = searchParams.get('error')
      const token = searchParams.get('token')
      const refreshToken = searchParams.get('refresh_token')

      if (error) {
        let readableError = 'Authentication failed. Please try again.'
        if (error.includes('google_oauth_not_configured')) {
          readableError = 'Google OAuth is not yet configured on the backend environment.'
        } else if (error.includes('linkedin_oauth_not_configured')) {
          readableError = 'LinkedIn OAuth is not yet configured on the backend environment.'
        } else if (error.includes('access_denied')) {
          readableError = 'OAuth access was cancelled or denied.'
        }
        setErrorMsg(readableError)
        toast.error(readableError)
        return
      }

      if (token) {
        try {
          const user = await handleOAuthLogin(token, refreshToken)
          toast.success('Successfully authenticated!')
          if (user?.role === 'faculty' || user?.role === 'admin') {
            navigate('/faculty', { replace: true })
          } else {
            navigate('/dashboard', { replace: true })
          }
        } catch (err) {
          console.error('OAuth token processing error:', err)
          setErrorMsg('Failed to process authentication tokens.')
          toast.error('Failed to process authentication tokens.')
        }
      } else {
        setErrorMsg('Invalid authentication response from server.')
      }
    }

    processCallback()
  }, [searchParams, handleOAuthLogin, navigate])

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 text-center bg-[#111827] border border-gray-800/90 p-8 rounded-3xl shadow-2xl">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-950/50 border border-rose-800/50 text-rose-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <Heading level={3} className="text-white font-extrabold text-xl">Authentication Error</Heading>
          <p className="text-sm text-gray-400">{errorMsg}</p>
          <Button onClick={() => navigate('/login')} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25">
            Return to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A]">
      <div className="relative flex items-center justify-center mb-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500/20 border-t-indigo-500" />
        <div className="absolute w-4 h-4 rounded-full bg-indigo-500/30 blur-sm animate-pulse" />
      </div>
      <p className="text-gray-300 font-semibold text-sm">Completing authentication...</p>
    </div>
  )
}

export default AuthCallback
