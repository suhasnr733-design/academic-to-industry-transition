// frontend/src/services/api.js

import axios from 'axios'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// 1. Create standard Axios instance for direct REST calls across the application
const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to automatically attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for session expiration handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
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