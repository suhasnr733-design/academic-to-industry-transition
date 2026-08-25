// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
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
      setUser(response.data)
      setIsAuthenticated(true)
      return response.data
    } catch (error) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      delete api.defaults.headers.common['Authorization']
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    const { access_token, refresh_token, user } = response.data
    
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    
    setUser(user)
    setIsAuthenticated(true)
    return user
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  }

  const handleOAuthLogin = async (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    const userProfile = await fetchUser()
    return userProfile
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile', data)
    setUser(response.data.user)
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