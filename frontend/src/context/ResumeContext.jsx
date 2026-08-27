// frontend/src/context/ResumeContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const ResumeContext = createContext(null)

export const ResumeProvider = ({ children }) => {
  const [resumes, setResumes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { isAuthenticated, user } = useAuth()

  const fetchResumes = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setResumes([])
      setIsLoading(false)
      return []
    }

    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get('/resume/list')
      const items = res.data?.resumes || []
      setResumes(items)
      return items
    } catch (err) {
      console.log('Error fetching resumes:', err)
      setError(err.response?.data?.error || 'Failed to load resumes')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-fetch resumes whenever auth status becomes true or user changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchResumes()
    } else {
      setResumes([])
    }
  }, [isAuthenticated, user, fetchResumes])

  const uploadResume = async (fileOrFormData) => {
    try {
      setIsLoading(true)
      let formData
      if (fileOrFormData instanceof FormData) {
        formData = fileOrFormData
      } else {
        formData = new FormData()
        formData.append('file', fileOrFormData)
      }

      const res = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': undefined
        }
      })

      const newResume = res.data?.resume || {
        id: res.data?.resume_id || res.data?.id,
        filename: res.data?.filename || 'Resume.pdf',
        file_size: res.data?.file_size,
        file_type: res.data?.file_type || 'pdf',
        status: res.data?.status || 'completed',
        skills: res.data?.skills || [],
        employability_score: res.data?.employability_score || 80,
        created_at: res.data?.created_at || new Date().toISOString()
      }

      // Single active resume policy: replace previous resume in state
      setResumes([newResume])

      toast.success('Resume uploaded successfully')
      
      // Re-sync with backend
      await fetchResumes()
      return res.data
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Upload failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getResume = async (id) => {
    try {
      setIsLoading(true)
      const res = await api.get(`/resume/${id}`)
      return res.data
    } catch (err) {
      console.log('Error fetching resume:', err)
      setError(err.response?.data?.error || 'Failed to load resume details')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteResume = async (id) => {
    try {
      await api.delete(`/resume/${id}`)
      toast.success('Resume deleted')
      
      const updatedResumes = resumes.filter(r => r.id !== id)
      setResumes(updatedResumes)

      // Invalidate assessment flags
      localStorage.removeItem(`assessment_completed_for_resume_${id}`)
      localStorage.removeItem(`assessment_score_for_resume_${id}`)
      
      if (updatedResumes.length === 0) {
        localStorage.removeItem('assessment_completed')
        localStorage.removeItem('latest_assessment_score')
      }
      
      window.dispatchEvent(new Event('storage'))
      await fetchResumes()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deletion failed')
      throw err
    }
  }

  const latestResume = resumes && resumes.length > 0 ? resumes[0] : null

  return (
    <ResumeContext.Provider
      value={{
        resumes,
        latestResume,
        isLoading,
        error,
        uploadProgress: 0,
        fetchResumes,
        getResume,
        uploadResume,
        upload: uploadResume,
        deleteResume
      }}
    >
      {children}
    </ResumeContext.Provider>
  )
}

export const useResume = () => {
  const context = useContext(ResumeContext)
  if (!context) {
    return {
      resumes: [],
      latestResume: null,
      isLoading: false,
      error: null,
      uploadProgress: 0,
      fetchResumes: async () => [],
      getResume: async () => null,
      uploadResume: async () => null,
      upload: async () => null,
      deleteResume: async () => null
    }
  }
  return context
}

export default ResumeContext
