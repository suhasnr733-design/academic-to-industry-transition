// frontend/src/services/api.js

import axios from 'axios'
import toast from 'react-hot-toast'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getApiBaseUrl } from '../config/apiConfig'

const baseURL = getApiBaseUrl()

// 1. Create standard Axios instance for direct REST calls across the application
const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to automatically attach JWT token & handle FormData
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor with automatic token refresh and error toast handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )
          
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }

    // Show error toast message
    if (error.response?.data?.message) {
      toast.error(error.response.data.message)
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error)
    }

    return Promise.reject(error)
  }
)

// 2. RTK Query API slice for Redux Toolkit integration
export const rtkApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: baseURL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token')
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['User', 'Resume', 'Job', 'Notification', 'Prediction'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    getProfile: builder.query({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),
    
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Resume endpoints
    uploadResume: builder.mutation({
      query: (formData) => ({
        url: '/resume/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Resume'],
    }),
    
    getResumes: builder.query({
      query: () => '/resume/list',
      providesTags: ['Resume'],
    }),
    
    getResume: builder.query({
      query: (id) => `/resume/${id}`,
      providesTags: ['Resume'],
    }),
    
    processResume: builder.mutation({
      query: (id) => ({
        url: `/resume/${id}/process`,
        method: 'POST',
      }),
      invalidatesTags: ['Resume', 'Prediction'],
    }),
    
    deleteResume: builder.mutation({
      query: (id) => ({
        url: `/resume/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Resume'],
    }),
    
    // Job endpoints
    getJobs: builder.query({
      query: (params) => ({
        url: '/jobs',
        params,
      }),
      providesTags: ['Job'],
    }),
    
    getJob: builder.query({
      query: (id) => `/jobs/${id}`,
      providesTags: ['Job'],
    }),
    
    getJobDomains: builder.query({
      query: () => '/jobs/domains',
      providesTags: ['Job'],
    }),
    
    matchJobs: builder.query({
      query: (resumeId) => `/jobs/match/${resumeId}`,
      providesTags: ['Job'],
    }),
    
    // Prediction endpoints
    getEmployability: builder.query({
      query: (resumeId) => `/prediction/employability/${resumeId}`,
      providesTags: ['Prediction'],
    }),
    
    getSkillGap: builder.query({
      query: ({ resumeId, targetRole }) => 
        `/prediction/gap/${resumeId}?target_role=${targetRole || ''}`,
      providesTags: ['Prediction'],
    }),
    
    getRecommendations: builder.query({
      query: (resumeId) => `/prediction/recommendations/${resumeId}`,
      providesTags: ['Prediction'],
    }),
    
    // Notification endpoints
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
    
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
})

// Attach RTK Query properties to the Axios instance so Redux store and thunks work seamlessly together
Object.assign(axiosInstance, {
  reducerPath: rtkApi.reducerPath,
  reducer: rtkApi.reducer,
  middleware: rtkApi.middleware,
  endpoints: rtkApi.endpoints,
  util: rtkApi.util,
})

// Export hooks for components using RTK Query
export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadResumeMutation,
  useGetResumesQuery,
  useGetResumeQuery,
  useProcessResumeMutation,
  useDeleteResumeMutation,
  useGetJobsQuery,
  useGetJobQuery,
  useGetJobDomainsQuery,
  useMatchJobsQuery,
  useGetEmployabilityQuery,
  useGetSkillGapQuery,
  useGetRecommendationsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = rtkApi

// Export api both as named export and default export
export const api = axiosInstance
export default axiosInstance
