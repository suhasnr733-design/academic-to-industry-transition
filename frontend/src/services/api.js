// frontend/src/services/api.js (Updated with RTK Query)

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'https://academic-to-industry-transition.onrender.com/api/v1',
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

// Export hooks
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
} = api

export default api