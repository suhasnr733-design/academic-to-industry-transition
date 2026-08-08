// frontend/src/store/slices/analyticsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const getDashboardStats = createAsyncThunk(
  'analytics/dashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics/dashboard')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get stats')
    }
  }
)

export const getPlacementTrends = createAsyncThunk(
  'analytics/placementTrends',
  async (months = 6, { rejectWithValue }) => {
    try {
      const response = await api.get(`/analytics/placement-trends?months=${months}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get trends')
    }
  }
)

export const getSkillDistribution = createAsyncThunk(
  'analytics/skillDistribution',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics/skill-distribution')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get distribution')
    }
  }
)

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    dashboardStats: null,
    placementTrends: [],
    skillDistribution: [],
    isLoading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardStats.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.dashboardStats = action.payload
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Similar for other async actions
  }
})

export default analyticsSlice.reducer