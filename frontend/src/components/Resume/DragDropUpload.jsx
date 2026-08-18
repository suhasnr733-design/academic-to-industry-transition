// frontend/src/components/resume/DragDropUpload.jsx

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useResume } from '../../hooks/useResume'
import { UploadIcon, DocumentIcon, XIcon, CheckCircleIcon } from '@heroicons/react/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export const DragDropUpload = ({ onUploadSuccess }) => {
  const { upload, isLoading, uploadProgress } = useResume()
  const [files, setFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const handleUpload = async (fileItem) => {
    try {
      const formData = new FormData()
      formData.append('file', fileItem.file)
      
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'uploading' } : f
      ))
      
      const result = await upload(formData)
      
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'completed', result } : f
      ))
      
      setUploadedFiles(prev => [...prev, result])
      
      if (onUploadSuccess) {
        onUploadSuccess(result)
      }
      
      toast.success(`${fileItem.name} uploaded successfully!`)
      
      // Remove from pending after 3 seconds
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.id !== fileItem.id))
      }, 3000)
      
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f
      ))
      toast.error(`Failed to upload ${fileItem.name}`)
    }
  }

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    for (const file of pendingFiles) {
      await handleUpload(file)
    }
  }

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const getFileIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error': return <XIcon className="h-5 w-5 text-red-500" />
      case 'uploading': return <div className="h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      default: return <DocumentIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <UploadIcon className={`h-16 w-16 mx-auto ${
          isDragActive ? 'text-primary-500' : 'text-gray-400'
        }`} />
        <p className="mt-4 text-gray-600 font-medium">
          {isDragActive ? 'Drop your files here' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Supported formats: PDF, DOCX (Max size: 10MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Files ({files.length})</h4>
            <button
              onClick={handleUploadAll}
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              Upload All
            </button>
          </div>

          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getFileIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                      {file.status === 'uploading' && ` - ${uploadProgress}%`}
                    </p>
                  </div>
                  {file.status === 'uploading' && (
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                )}
                {file.status === 'pending' && (
                  <button
                    onClick={() => handleUpload(file)}
                    className="ml-2 px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    Upload
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}