// src/pages/resume/ResumeUpload.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { DocumentIcon, UploadIcon, XIcon } from '@heroicons/react/outline'
import toast from 'react-hot-toast'

export const ResumeUpload = () => {
  const navigate = useNavigate()
  const { uploadResume, isLoading } = useResume()
  const [file, setFile] = React.useState(null)
  const [isDragActive, setIsDragActive] = React.useState(false)
  const fileInputRef = React.useRef(null)

  const handleFile = (selectedFile) => {
    if (!selectedFile) return
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit')
      return
    }

    setFile(selectedFile)
    toast.success(`Selected file: ${selectedFile.name}`)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const openFilePicker = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const onSubmit = async () => {
    if (!file) {
      toast.error('Please select a resume file first')
      return
    }

    try {
      const result = await uploadResume(file)
      toast.success('Resume uploaded successfully!')
      const resumeId = result?.id || result?.resume_id || result?.resume?.id
      if (resumeId) {
        navigate(`/resume/${resumeId}`)
      } else {
        navigate('/resume')
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed')
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <Heading level={2} className="text-center">Upload Your Resume</Heading>
        <p className="text-center text-gray-500 mt-2">
          Upload your resume in PDF, DOCX, or TXT format to get personalized recommendations
        </p>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          id="resume-file-input"
          type="file"
          accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Dropzone Container */}
        <div
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-8 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <UploadIcon className={`h-16 w-16 mx-auto ${
            isDragActive ? 'text-primary-500' : 'text-gray-400'
          }`} />
          
          {isDragActive ? (
            <p className="mt-4 text-primary-600 font-medium">Drop your resume here</p>
          ) : (
            <>
              <p className="mt-4 text-gray-600 font-medium">
                Drag & drop your resume here, or click to select
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Supported formats: PDF, DOCX, TXT (Max size: 10MB)
              </p>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="px-6 py-2.5 bg-primary-50 text-primary-600 font-semibold rounded-lg hover:bg-primary-100 transition-colors shadow-sm"
                >
                  Browse Files
                </button>
              </div>
            </>
          )}
        </div>

        {/* Selected File Preview Card */}
        {file && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                type="button"
                onClick={removeFile}
                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                title="Remove file"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={onSubmit}
            isLoading={isLoading}
            disabled={!file}
          >
            Upload Resume
          </Button>
        </div>

        {/* Tip Box */}
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

export default ResumeUpload
