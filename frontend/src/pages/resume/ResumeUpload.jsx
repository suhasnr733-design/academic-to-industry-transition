// src/pages/resume/ResumeUpload.jsx

import React from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { DocumentIcon, UploadIcon, XIcon } from '@heroicons/react/outline'
import toast from 'react-hot-toast'

export const ResumeUpload = () => {
  const navigate = useNavigate()
  const { uploadResume, isLoading } = useResume()
  const [file, setFile] = React.useState(null)

  const { register, handleSubmit } = useForm()

  const onDrop = React.useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile) {
      setFile(uploadedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const onSubmit = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const result = await uploadResume(formData)
      toast.success('Resume uploaded successfully!')
      navigate(`/resume/${result.id}/status`)
    } catch (error) {
      toast.error(error.message || 'Upload failed')
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <Heading level={2} className="text-center">Upload Your Resume</Heading>
        <p className="text-center text-gray-500 mt-2">
          Upload your resume in PDF or DOCX format to get personalized recommendations
        </p>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`mt-8 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon className={`h-16 w-16 mx-auto ${
            isDragActive ? 'text-primary-500' : 'text-gray-400'
          }`} />
          {isDragActive ? (
            <p className="mt-4 text-primary-600 font-medium">Drop your resume here</p>
          ) : (
            <>
              <p className="mt-4 text-gray-600">
                Drag & drop your resume here, or click to select
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Supported formats: PDF, DOCX (Max size: 10MB)
              </p>
            </>
          )}
        </div>

        {/* File Preview */}
        {file && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-8 w-8 text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            className="w-full"
            size="lg"
            onClick={onSubmit}
            isLoading={isLoading}
            disabled={!file}
          >
            Upload Resume
          </Button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Your resume will be analyzed to extract skills, 
            education, and experience. This helps us provide personalized job 
            matches and skill recommendations.
          </p>
        </div>
      </div>
    </div>
  )
}
