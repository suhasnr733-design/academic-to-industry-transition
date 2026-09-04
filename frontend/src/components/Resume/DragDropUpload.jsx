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
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
      case 'error': return <XIcon className="h-5 w-5 text-rose-400" />
      case 'uploading': return <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
            ? 'border-indigo-500 bg-indigo-950/40'
            : 'border-gray-700/80 hover:border-indigo-500/60 hover:bg-[#1E293B]/40'
        }`}
      >
        <input {...getInputProps()} />
        <UploadIcon className={`h-14 w-14 mx-auto ${
          isDragActive ? 'text-indigo-400' : 'text-gray-500'
        }`} />
        <p className="mt-4 text-white font-medium text-sm">
          {isDragActive ? 'Drop your files here' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="mt-1.5 text-xs text-gray-400">
          Supported formats: PDF, DOCX (Max size: 10MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white text-sm">Files ({files.length})</h4>
            <button
              onClick={handleUploadAll}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-xs rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50"
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
                className="flex items-center justify-between p-3.5 bg-[#1E293B] border border-gray-700 rounded-xl"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {formatFileSize(file.size)}
                      {file.status === 'uploading' && ` - ${uploadProgress}%`}
                    </p>
                  </div>
                  {file.status === 'uploading' && (
                    <div className="w-24 h-1.5 bg-[#0F172A] rounded-full overflow-hidden border border-gray-700">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
                {file.status === 'pending' && (
                  <button
                    onClick={() => handleUpload(file)}
                    className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-xs font-semibold"
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