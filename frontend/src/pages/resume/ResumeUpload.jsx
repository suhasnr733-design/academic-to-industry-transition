// src/pages/resume/ResumeUpload.jsx

import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useResume } from '../../hooks/useResume'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  DocumentIcon, 
  UploadIcon, 
  XIcon, 
  ExclamationIcon, 
  RefreshIcon,
  CheckCircleIcon 
} from '@heroicons/react/outline'
import toast from 'react-hot-toast'

export const ResumeUpload = () => {
  const navigate = useNavigate()
  const { resumes, uploadResume, isLoading } = useResume()
  const [file, setFile] = useState(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const fileInputRef = useRef(null)

  const activeResume = resumes && resumes.length > 0 ? resumes[0] : null

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

  const handleInitiateUpload = () => {
    if (!file) {
      toast.error('Please select a resume file first')
      return
    }

    if (activeResume) {
      setShowConfirmModal(true)
    } else {
      executeUpload()
    }
  }

  const executeUpload = async () => {
    setShowConfirmModal(false)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      await uploadResume(formData)
      toast.success(activeResume ? 'Resume replaced successfully!' : 'Resume uploaded successfully!')
      
      localStorage.removeItem('assessment_completed')
      localStorage.removeItem('latest_assessment_score')
      window.dispatchEvent(new Event('storage'))

      navigate('/resume')
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
    <div className="max-w-3xl mx-auto py-4">
      <div className="bg-[#111827] rounded-2xl shadow-2xl border border-gray-800/80 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white text-center tracking-tight">
          {activeResume ? 'Update Your Resume' : 'Upload Your Resume'}
        </h2>
        <p className="text-center text-gray-400 mt-2 text-sm max-w-lg mx-auto">
          {activeResume 
            ? 'Upload a new resume to update your profile, extracted skills, and employability score'
            : 'Upload your resume in PDF, DOCX, or TXT format to get personalized recommendations'
          }
        </p>

        {/* Existing Active Resume Banner */}
        {activeResume && (
          <div className="mt-6 p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start space-x-3">
            <ExclamationIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-amber-200">
              <span className="font-bold">Active Resume on Profile:</span>{' '}
              <span className="font-semibold text-white">{activeResume.filename}</span>
              {activeResume.employability_score && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-medium">
                  {Math.round(activeResume.employability_score)}% Score
                </span>
              )}
              <p className="mt-1 text-amber-300/80">
                Uploading a new resume will automatically delete this resume and recalculate your analysis.
              </p>
            </div>
            <Link 
              to={`/resume/${activeResume.id}`}
              className="text-xs font-semibold text-amber-400 underline hover:text-amber-300 flex-shrink-0"
            >
              View Current
            </Link>
          </div>
        )}

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
          className={`mt-8 border-2 border-dashed rounded-2xl p-10 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-950/40'
              : 'border-gray-700/80 hover:border-indigo-500/60 hover:bg-[#1E293B]/40'
          }`}
        >
          <UploadIcon className={`h-14 w-14 mx-auto ${
            isDragActive ? 'text-indigo-400' : 'text-gray-500'
          }`} />
          
          {isDragActive ? (
            <p className="mt-4 text-indigo-400 font-semibold text-sm">Drop your resume here</p>
          ) : (
            <>
              <p className="mt-4 text-gray-200 font-semibold text-sm sm:text-base">
                Drag & drop your resume here, or click to select
              </p>
              <p className="mt-1.5 text-xs text-gray-400">
                Supported formats: PDF, DOCX, TXT (Max size: 10MB)
              </p>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold rounded-xl transition-colors text-xs"
                >
                  Browse Files
                </button>
              </div>
            </>
          )}
        </div>

        {/* Selected File Preview Card */}
        {file && (
          <div className="mt-6 p-4 bg-[#1E293B] rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-8 w-8 text-indigo-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
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
            onClick={handleInitiateUpload}
            isLoading={isLoading}
            disabled={!file}
          >
            {activeResume ? 'Update & Replace Resume' : 'Upload Resume'}
          </Button>
        </div>

        {/* Tip Box */}
        <div className="mt-6 p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
          <p className="text-xs text-indigo-300">
            <strong className="text-white">Tip:</strong> Your resume will be analyzed to extract skills, 
            education, and experience. This helps us provide personalized job 
            matches and skill recommendations.
          </p>
        </div>
      </div>

      {/* Confirmation & Replacement Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-amber-400 mb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                <RefreshIcon className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Replace Existing Resume?</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              You already have an active resume on your profile:
            </p>

            <div className="p-3 bg-[#1E293B] rounded-xl border border-gray-700 text-xs text-gray-300 mb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white truncate max-w-[220px]">{activeResume?.filename}</span>
                {activeResume?.employability_score && (
                  <span className="font-bold text-emerald-400">{Math.round(activeResume.employability_score)}% Score</span>
                )}
              </div>
              <p className="text-gray-400 text-[11px]">
                Uploaded on {activeResume?.created_at ? new Date(activeResume.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-6">
              Uploading <strong className="text-white">{file?.name}</strong> will permanently delete your previous resume file and replace your employability metrics and skill analysis.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="warning"
                size="sm"
                onClick={executeUpload}
                isLoading={isLoading}
              >
                Yes, Replace & Upload
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeUpload
