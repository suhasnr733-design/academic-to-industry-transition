// frontend/src/store/slices/jobSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchJobs = createAsyncThunk(
  'job/fetchJobs',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/jobs', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch jobs')
    }
  }
)

export const fetchJobById = createAsyncThunk(
  'job/fetchJobById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/jobs/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch job details')
    }
  }
)

const jobSlice = createSlice({
  name: 'job',
  initialState: {
    jobs: [],
    selectedJob: null,
    total: 0,
    page: 1,
    pages: 1,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearJobError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload.jobs || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.pages = action.payload.pages || 1;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
  },
})

export const { clearJobError } = jobSlice.actions
export default jobSlice.reducer
