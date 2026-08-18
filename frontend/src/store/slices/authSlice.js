// frontend/src/store/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const { access_token, refresh_token, user } = response.data
      
      // Store tokens
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      return { user, access_token, refresh_token }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed')
    }
  }
)

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/profile')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get profile')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', data)
      return response.data.user
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
    return null
  }
)

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.access_token
        toast.success('Login successful!')
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false
        toast.success('Registration successful! Please login.')
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(getProfile.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
        toast.success('Profile updated successfully!')
      })
      .addCase(updateProfile.rejected, (state, action) => {
        toast.error(action.payload)
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        toast.success('Logged out successfully')
      })
  },
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer