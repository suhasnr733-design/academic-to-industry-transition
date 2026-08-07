// frontend/src/store/slices/resumeSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const uploadResume = createAsyncThunk(
  'resume/upload',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Upload failed')
    }
  }
)

export const getResumes = createAsyncThunk(
  'resume/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/resume/list')
      return response.data.resumes
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get resumes')
    }
  }
)

export const getResume = createAsyncThunk(
  'resume/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/resume/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get resume')
    }
  }
)

export const deleteResume = createAsyncThunk(
  'resume/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/resume/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete resume')
    }
  }
)

export const processResume = createAsyncThunk(
  'resume/process',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/resume/${id}/process`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to process resume')
    }
  }
)

export const getResumeStatus = createAsyncThunk(
  'resume/status',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/resume/${id}/status`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get status')
    }
  }
)

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    resumes: [],
    currentResume: null,
    isLoading: false,
    error: null,
    uploadProgress: 0,
  },
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload
    },
    clearCurrentResume: (state) => {
      state.currentResume = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload
      .addCase(uploadResume.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.isLoading = false
        state.resumes.unshift(action.payload)
        toast.success('Resume uploaded successfully!')
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Get All
      .addCase(getResumes.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getResumes.fulfilled, (state, action) => {
        state.isLoading = false
        state.resumes = action.payload
      })
      .addCase(getResumes.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get One
      .addCase(getResume.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getResume.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentResume = action.payload
      })
      .addCase(getResume.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Delete
      .addCase(deleteResume.fulfilled, (state, action) => {
        state.resumes = state.resumes.filter(r => r.id !== action.payload)
        toast.success('Resume deleted successfully')
      })
      .addCase(deleteResume.rejected, (state, action) => {
        toast.error(action.payload)
      })
      // Process
      .addCase(processResume.fulfilled, (state, action) => {
        toast.success('Resume processing started')
        const index = state.resumes.findIndex(r => r.id === action.payload.resume_id)
        if (index !== -1) {
          state.resumes[index].status = 'processing'
        }
      })
      // Status
      .addCase(getResumeStatus.fulfilled, (state, action) => {
        const index = state.resumes.findIndex(r => r.id === action.payload.resume_id)
        if (index !== -1) {
          state.resumes[index] = { ...state.resumes[index], ...action.payload }
        }
      })
  },
})

export const { setUploadProgress, clearCurrentResume, clearError } = resumeSlice.actions
export default resumeSlice.reducer