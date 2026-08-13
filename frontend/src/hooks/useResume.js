// frontend/src/hooks/useResume.js

import { useState, useEffect } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export const useResume = () => {
  const [resumes, setResumes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchResumes = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/resume/list')
      setResumes(res.data.resumes || [])
    } catch (err) {
      console.log('Error fetching resumes:', err)
      setError(err.response?.data?.error || 'Failed to load resumes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

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
      
      const res = await api.post('/resume/upload', formData)
      toast.success('Resume uploaded successfully')
      fetchResumes()
      return res.data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteResume = async (id) => {
    try {
      await api.delete(`/resume/${id}`)
      toast.success('Resume deleted')
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deletion failed')
    }
  }

  return {
    resumes,
    isLoading,
    error,
    fetchResumes,
    uploadResume,
    deleteResume
  }
}
