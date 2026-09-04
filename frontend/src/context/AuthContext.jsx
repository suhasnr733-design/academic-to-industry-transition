import React, { createContext, useState, useContext, useEffect } from 'react'
import { api, getAuthToken, clearAuthTokens } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// Storage helpers for cached user profile (Optimization 2)
const getCachedUser = () => {
  try {
    const cached = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

const saveCachedUser = (userData, rememberMe = false) => {
  if (!userData) return
  const primary = rememberMe ? localStorage : sessionStorage
  const secondary = rememberMe ? sessionStorage : localStorage
  try {
    primary.setItem('auth_user', JSON.stringify(userData))
    secondary.removeItem('auth_user')
  } catch {}
}

const clearCachedUser = () => {
  try {
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_user')
  } catch {}
}

export const AuthProvider = ({ children }) => {
  // Optimization 2: Instant SWR hydration from storage (0.00s initial render, zero auth flicker)
  const [user, setUser] = useState(() => getCachedUser())
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getAuthToken()
    const cached = getCachedUser()
    return Boolean(token && cached)
  })
  const [isLoading, setIsLoading] = useState(() => {
    const token = getAuthToken()
    const cached = getCachedUser()
    if (!token) return false
    return !cached
  })

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/profile')
      const freshUser = response.data
      setUser(freshUser)
      setIsAuthenticated(true)
      const hasLocalToken = Boolean(localStorage.getItem('access_token'))
      saveCachedUser(freshUser, hasLocalToken)
      return freshUser
    } catch (error) {
      clearAuthTokens()
      clearCachedUser()
      delete api.defaults.headers.common['Authorization']
      setUser(null)
      setIsAuthenticated(false)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials, rememberMe = false) => {
    const response = await api.post('/auth/login', credentials)
    const { access_token, refresh_token, user } = response.data
    
    // 1. Clear any existing tokens across storages
    clearAuthTokens()
    clearCachedUser()

    // 2. Save tokens to localStorage if Remember Me is checked, otherwise sessionStorage
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('access_token', access_token)
    storage.setItem('refresh_token', refresh_token)
    saveCachedUser(user, rememberMe)
    
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    
    setUser(user)
    setIsAuthenticated(true)
    return user
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    const data = response.data

    // If backend returns tokens (student 201), auto-authenticate immediately
    if (data.access_token && data.refresh_token && data.user) {
      clearAuthTokens()
      clearCachedUser()
      // Use sessionStorage by default (equivalent to no "Remember Me" on sign-up)
      sessionStorage.setItem('access_token', data.access_token)
      sessionStorage.setItem('refresh_token', data.refresh_token)
      saveCachedUser(data.user, false)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
      setUser(data.user)
      setIsAuthenticated(true)
    }

    return data
  }

  const handleOAuthLogin = async (accessToken, refreshToken) => {
    clearAuthTokens()
    clearCachedUser()
    localStorage.setItem('access_token', accessToken)
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    const userProfile = await fetchUser()
    return userProfile
  }

  const logout = () => {
    clearAuthTokens()
    clearCachedUser()
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile', data)
    const updatedUser = response.data.user
    setUser(updatedUser)
    const hasLocalToken = Boolean(localStorage.getItem('access_token'))
    saveCachedUser(updatedUser, hasLocalToken)
    return response.data
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      handleOAuthLogin,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      handleOAuthLogin: async () => {},
      updateProfile: async () => {}
    }
  }
  return context
}