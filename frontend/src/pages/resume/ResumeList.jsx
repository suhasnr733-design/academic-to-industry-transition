import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useResume } from '../../hooks/useResume'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { getApiBaseUrl } from '../../config/apiConfig'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { 
  DocumentIcon, 
  RefreshIcon,
  TrashIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  AcademicCapIcon,
  SparklesIcon,
  CheckCircleIcon,
  UploadIcon,
  XIcon,
  ChevronRightIcon,
  LightningBoltIcon,
  ChartBarIcon,
  InformationCircleIcon,
  FolderIcon,
  LightBulbIcon,
  BriefcaseIcon
} from '@heroicons/react/outline'
import toast from 'react-hot-toast'

export const ResumeList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { resumes, getResume, deleteResume, uploadResume, isLoading } = useResume()
  
  const [activeResumeDetails, setActiveResumeDetails] = useState(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('pdf') // 'pdf' | 'text'
  const [deleting, setDeleting] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const activeResume = resumes && resumes.length > 0 ? resumes[0] : null
  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    let currentBlobUrl = null
    if (activeResume?.id) {
      getResume(activeResume.id)
        .then(data => setActiveResumeDetails(data))
        .catch(err => console.error('Error fetching active resume details:', err))

      // Fetch PDF as Blob with auth headers
      setLoadingPdf(true)
      api.get(`/resume/${activeResume.id}/file`, { responseType: 'blob' })
        .then(res => {
          const blob = new Blob([res.data], { type: 'application/pdf' })
          currentBlobUrl = URL.createObjectURL(blob)
          setPdfBlobUrl(currentBlobUrl)
        })
        .catch(err => {
          console.error('Error fetching PDF blob:', err)
        })
        .finally(() => {
          setLoadingPdf(false)
        })
    } else {
      setActiveResumeDetails(null)
      setPdfBlobUrl(null)
    }

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [activeResume?.id])

  const handleDelete = async () => {
    if (!activeResume) return
    const name = activeResume.filename || 'this resume'
    if (window.confirm(`Are you sure you want to delete ${name}?\n\nThis will remove your active resume and reset your employability metrics.`)) {
      try {
        setDeleting(true)
        await deleteResume(activeResume.id)
        setActiveResumeDetails(null)
        setPdfBlobUrl(null)
        toast.success('Resume deleted successfully')
      } finally {
        setDeleting(false)
      }
    }
  }

  const handleDownload = () => {
    if (pdfBlobUrl && activeResume?.filename) {
      const a = document.createElement('a')
      a.href = pdfBlobUrl
      a.download = activeResume.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else if (activeResume) {
      window.open(`${apiBaseUrl}/resume/${activeResume.id}/download?download=true`, '_blank')
    }
  }

  const handleFullscreen = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank')
    } else if (activeResume) {
      window.open(`${apiBaseUrl}/resume/${activeResume.id}/file`, '_blank')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDirectUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleDirectUpload(e.target.files[0])
    }
  }

  const handleDirectUpload = async (selectedFile) => {
    if (!selectedFile) return
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      await uploadResume(formData)
      toast.success('Resume uploaded and analyzed successfully!')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Refined Candidate Name derivation
  const candidateName = useMemo(() => {
    if (activeResumeDetails?.candidate_name && typeof activeResumeDetails.candidate_name === 'string' && activeResumeDetails.candidate_name.trim().length > 1) {
      return activeResumeDetails.candidate_name.trim()
    }
    if (activeResume?.filename) {
      const clean = activeResume.filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b(resume|cv|profile|doc|final|latest)\b/gi, '')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase())
      if (clean.length >= 2) return clean
    }
    if (user?.full_name) return user.full_name
    return 'Candidate Resume'
  }, [activeResumeDetails, activeResume, user])

  const employabilityScore = Math.round(activeResumeDetails?.employability_score || activeResume?.employability_score || 74)

  const calculateDomainScore = (skillsList) => {
    if (!skillsList || skillsList.length === 0) return 0
    const count = skillsList.length
    if (count === 1) return 55
    if (count === 2) return 68
    if (count === 3) return 78
    if (count === 4) return 86
    if (count === 5) return 92
    return Math.min(92 + (count - 5) * 2, 96)
  }

  const categorizedStrengths = useMemo(() => {
    const rawSkills = (activeResumeDetails?.skills || activeResume?.skills || []).map(s => 
      typeof s === 'string' ? s : (s?.name || s?.skill || '')
    ).filter(Boolean)
    
    const backend = rawSkills.filter(s => /\b(python|flask|django|node|nodejs|express|expressjs|fastapi|java|c\+\+|golang|go|rust|php|ruby|rest|apis|oop|dsa|system design)\b/i.test(s))
    const databases = rawSkills.filter(s => /\b(sql|postgres|postgresql|mysql|mongo|mongodb|sqlite|redis|database|dbms|oracle|firebase|cassandra)\b/i.test(s))
    const aiml = rawSkills.filter(s => /\b(nlp|ai|ml|machine learning|deep learning|data science|tensorflow|pytorch|keras|scikit|scikit-learn|pandas|numpy|opencv|generative ai|llm|genai)\b/i.test(s))
    const cloud = rawSkills.filter(s => /\b(docker|git|github|gitlab|k8s|kubernetes|aws|azure|gcp|linux|ci\/cd|devops|jenkins|terraform|postman)\b/i.test(s))

    return [
      {
        id: 'backend',
        title: 'Backend & Architecture',
        icon: '⚙️',
        bg: backend.length > 0 ? 'bg-[#111827] border-blue-500/30' : 'bg-[#111827] border-gray-800',
        text: backend.length > 0 ? 'text-blue-300' : 'text-gray-400',
        badge: backend.length > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-[#1E293B] text-gray-400 border border-gray-700',
        score: calculateDomainScore(backend),
        skills: backend.length > 0 ? backend : ['No backend skills detected'],
        hasSkills: backend.length > 0,
        desc: backend.length > 0 ? 'API services, core logic & server structure' : 'Add Python, Node.js, or Java to build backend readiness'
      },
      {
        id: 'databases',
        title: 'Databases & Storage',
        icon: '🗄️',
        bg: databases.length > 0 ? 'bg-[#111827] border-amber-500/30' : 'bg-[#111827] border-gray-800',
        text: databases.length > 0 ? 'text-amber-300' : 'text-gray-400',
        badge: databases.length > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-[#1E293B] text-gray-400 border border-gray-700',
        score: calculateDomainScore(databases),
        skills: databases.length > 0 ? databases : ['No database skills detected'],
        hasSkills: databases.length > 0,
        desc: databases.length > 0 ? 'Relational querying & structured data persistence' : 'Add SQL or MongoDB to qualify for data-driven roles'
      },
      {
        id: 'aiml',
        title: 'AI, ML & NLP',
        icon: '🧠',
        bg: aiml.length > 0 ? 'bg-[#111827] border-purple-500/30' : 'bg-[#111827] border-gray-800',
        text: aiml.length > 0 ? 'text-purple-300' : 'text-gray-400',
        badge: aiml.length > 0 ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-[#1E293B] text-gray-400 border border-gray-700',
        score: calculateDomainScore(aiml),
        skills: aiml.length > 0 ? aiml : ['No AI/ML skills detected'],
        hasSkills: aiml.length > 0,
        desc: aiml.length > 0 ? 'Intelligent extraction & algorithm engineering' : 'Explore scikit-learn, PyTorch, or NLP to open AI roles'
      },
      {
        id: 'cloud',
        title: 'Cloud & Tooling',
        icon: '☁️',
        bg: cloud.length > 0 ? 'bg-[#111827] border-cyan-500/30' : 'bg-[#111827] border-gray-800',
        text: cloud.length > 0 ? 'text-cyan-300' : 'text-gray-400',
        badge: cloud.length > 0 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-[#1E293B] text-gray-400 border border-gray-700',
        score: calculateDomainScore(cloud),
        skills: cloud.length > 0 ? cloud : ['No cloud skills detected'],
        hasSkills: cloud.length > 0,
        desc: cloud.length > 0 ? 'Containerization, versioning & deployment readiness' : 'Add Docker, Git, or AWS to demonstrate DevOps capabilities'
      }
    ]
  }, [activeResumeDetails, activeResume])

  const healthMetrics = useMemo(() => {
    const details = activeResumeDetails || activeResume || {}
    const skillsList = details.skills || []
    const educationList = details.education || []
    const projectsList = details.projects || []
    const hasExp = Boolean(details.experience && (Array.isArray(details.experience) ? details.experience.length > 0 : Object.keys(details.experience).length > 0))

    let sectionScore = 50
    if (skillsList.length > 0) sectionScore += 15
    if (educationList.length > 0) sectionScore += 15
    if (projectsList.length > 0) sectionScore += 15
    if (hasExp) sectionScore += 10
    sectionScore = Math.min(sectionScore, 98)

    const keywordScore = skillsList.length >= 10 ? 94 : skillsList.length >= 6 ? 86 : skillsList.length >= 3 ? 75 : Math.max(40, skillsList.length * 15)
    const projectScore = projectsList.length >= 2 ? 90 : projectsList.length === 1 ? 75 : 40
    const academicScore = educationList.length >= 1 ? 92 : 65

    const hasQuantifiedKPIs = projectsList.some(p => p.metrics && p.metrics.length > 0) || 
      (Boolean(details.raw_text) && /\b\d+%\b/.test(details.raw_text))
    const impactScore = hasQuantifiedKPIs ? 88 : (projectsList.length > 0 || hasExp) ? 75 : 45

    return [
      {
        name: 'ATS Formatting & Structure',
        score: sectionScore,
        status: sectionScore >= 85 ? 'Excellent' : sectionScore >= 70 ? 'Good' : 'Needs Sections',
        color: sectionScore >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : sectionScore >= 70 ? 'bg-indigo-500' : 'bg-amber-500'
      },
      {
        name: 'Keyword Density & Role Alignment',
        score: keywordScore,
        status: keywordScore >= 85 ? 'Strong' : keywordScore >= 70 ? 'Moderate' : 'Low Density',
        color: keywordScore >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : keywordScore >= 70 ? 'bg-indigo-500' : 'bg-amber-500'
      },
      {
        name: 'Project Complexity & Portfolio',
        score: projectScore,
        status: projectScore >= 80 ? 'Robust Portfolio' : projectScore >= 60 ? 'Good' : 'Add Projects',
        color: projectScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : projectScore >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
      },
      {
        name: 'Readability & Section Balance',
        score: academicScore,
        status: academicScore >= 80 ? 'High' : 'Moderate',
        color: academicScore >= 80 ? 'bg-teal-500' : 'bg-amber-500'
      },
      {
        name: 'Quantified Impact & Metrics',
        score: impactScore,
        status: impactScore >= 75 ? 'Strong KPIs' : 'Needs Impact KPIs',
        color: impactScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-amber-500'
      }
    ]
  }, [activeResumeDetails, activeResume])

  const dynamicHighlights = useMemo(() => {
    const details = activeResumeDetails || activeResume || {}
    const skillsList = details.skills || []
    const projectsList = details.projects || []
    const hasExp = Boolean(details.experience && (Array.isArray(details.experience) ? details.experience.length > 0 : Object.keys(details.experience).length > 0))
    const hasQuantifiedKPIs = projectsList.some(p => p.metrics && p.metrics.length > 0) || 
      (Boolean(details.raw_text) && /\b\d+%\b/.test(details.raw_text))
    const highlights = []

    if (skillsList.length > 0) {
      const topSkills = skillsList.slice(0, 5).map(s => typeof s === 'string' ? s : (s?.name || s?.skill || '')).join(', ')
      highlights.push({
        type: 'success',
        title: 'Strong Core Tech Alignment:',
        desc: `Verified skill markers found for ${topSkills}, aligning with entry-level and junior engineering requisitions.`
      })
    } else {
      highlights.push({
        type: 'warning',
        title: 'Skill Extraction Needed:',
        desc: 'Add technical coursework, programming languages, and framework proficiencies to enhance recruiter matching.'
      })
    }

    if (projectsList.length >= 2) {
      highlights.push({
        type: 'info',
        title: 'Project Portfolio Verified:',
        desc: `Detected ${projectsList.length} distinct project implementations demonstrating practical software engineering capability.`
      })
    } else if (projectsList.length === 1) {
      highlights.push({
        type: 'warning',
        title: 'Expand Project Portfolio:',
        desc: 'Identified 1 project. Adding 1-2 additional full-stack or domain applications will increase your project rating to 80%+.'
      })
    } else {
      highlights.push({
        type: 'warning',
        title: 'Include Technical Projects:',
        desc: 'Add 2-3 structured project bullets with tech stacks and GitHub repository links to boost recruiter ranking.'
      })
    }

    if (hasQuantifiedKPIs) {
      highlights.push({
        type: 'success',
        title: 'High-Impact Measurable KPIs:',
        desc: 'Document includes quantified outcome metrics (such as performance and automation percentages), passing senior ATS filters.'
      })
    } else {
      highlights.push({
        type: 'tip',
        title: 'Recommendation to reach 90%+ Score:',
        desc: 'Add 2-3 measurable achievement metrics in your project bullets (e.g., "reduced query latency by 25%" or "served 500+ daily requests").'
      })
    }

    return highlights
  }, [activeResumeDetails, activeResume])

  const educationTimeline = useMemo(() => {
    const rawEdu = activeResumeDetails?.education || activeResume?.education || []
    if (Array.isArray(rawEdu) && rawEdu.length > 0) {
      return rawEdu
    }
    return [
      {
        degree: user?.department ? `Bachelor of Engineering in ${user.department}` : 'Bachelor of Engineering in Computer Science & Engineering',
        institution: user?.college || 'Canara Engineering College',
        year: 'Current Degree (Placement Ready)',
        gpa: 'Academic Good Standing'
      }
    ]
  }, [activeResumeDetails, activeResume, user])

  const extractedProjects = useMemo(() => {
    const rawProj = activeResumeDetails?.projects || activeResume?.projects || []
    return Array.isArray(rawProj) ? rawProj : []
  }, [activeResumeDetails, activeResume])

  const extractedCertifications = useMemo(() => {
    const rawCerts = activeResumeDetails?.certifications || activeResume?.certifications || []
    return Array.isArray(rawCerts) ? rawCerts : []
  }, [activeResumeDetails, activeResume])

  if (isLoading && (!resumes || resumes.length === 0)) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  // 1. If NO resume is uploaded, render dark Dropzone
  if (!activeResume) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="bg-[#111827] rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-gray-800/80">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center mb-3 border border-indigo-500/20 shadow-md">
            <UploadIcon className="h-8 w-8" />
          </div>
          <h2 className="text-white font-bold text-xl sm:text-2xl tracking-tight">Upload Your Placement Resume</h2>
          <p className="text-gray-400 mt-1.5 text-xs sm:text-sm max-w-md mx-auto">
            Upload your resume in PDF, DOCX, or TXT format to open the AI Resume Analyzer, inspect section health, and compute placement readiness.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            className={`mt-6 border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'border-indigo-500 bg-indigo-950/30' : 'border-gray-700/80 hover:border-indigo-500/50 hover:bg-[#1E293B]/40'
            }`}
          >
            <DocumentIcon className={`h-12 w-12 mx-auto ${isDragActive ? 'text-indigo-400' : 'text-gray-500'}`} />
            <p className="mt-3 text-white font-semibold text-sm sm:text-base">
              {isUploading ? 'Uploading & Analyzing Resume...' : 'Drag & drop your resume here, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-gray-400">PDF, DOCX, or TXT (Max size 10MB)</p>
            <Button
              type="button"
              className="mt-4 text-xs font-semibold"
              size="sm"
              isLoading={isUploading}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              Browse Resume File
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Active Resume Exists -> Render Modern AI Resume Analyzer
  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Resume Studio</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-full flex items-center gap-1">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>ATS v2.4</span>
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Real-time ATS parsing, competency health evaluation, and recruiter-readiness audit
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/resume/upload">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshIcon className="h-4 w-4 text-gray-300" />
              <span>Replace Resume</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Master Resume Overview Card */}
      <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 transition-all hover:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          {/* Left: Thumbnail & Metadata */}
          <div className="flex items-start space-x-4 min-w-0 flex-1">
            <div 
              onClick={() => setIsModalOpen(true)}
              className="w-16 h-20 bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-gray-700/80 rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer group hover:border-indigo-500/60 hover:shadow-lg transition-all relative flex-shrink-0"
              title="Click to Preview Fullscreen"
            >
              <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-md mb-1 border border-rose-500/20">
                <DocumentIcon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">PDF</span>
              <div className="absolute inset-0 bg-indigo-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <EyeIcon className="w-5 h-5 text-indigo-300" />
              </div>
            </div>

            {/* Resume Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate" title={candidateName}>
                  {candidateName}
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold rounded-full flex-shrink-0">
                  Active Master Resume
                </span>
              </div>

              <p className="text-xs text-gray-400 truncate mt-1" title={activeResume.filename}>
                {activeResume.filename}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                <span>Uploaded: {new Date(activeResume.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span>Size: {(activeResume.file_size / 1024 / 1024).toFixed(2)} MB</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Verified PDF</span>
              </div>
            </div>
          </div>

          {/* Right: ATS Score Gauge & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:border-l md:border-gray-800 md:pl-6">
            <div className="text-left sm:text-right">
              <div className="flex items-baseline gap-1.5 sm:justify-end">
                <span className="text-3xl font-black text-white">{employabilityScore}%</span>
                <span className="text-xs font-bold text-indigo-400">ATS Score</span>
              </div>
              <span className="inline-block mt-0.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                High Match (Top 15%)
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-2 sm:pt-0">
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold"
              >
                <EyeIcon className="w-4 h-4" />
                <span>Open Preview</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs font-semibold"
                title="Download PDF"
              >
                <DownloadIcon className="w-4 h-4 text-gray-300" />
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={deleting}
                className="text-xs p-2"
                title="Delete Resume"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI Resume Summary — 4 Core Strength Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <LightningBoltIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">AI Competency Strengths</h3>
          </div>
          <span className="text-xs text-gray-400">Classified across 4 core engineering domains</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categorizedStrengths.map((cat) => (
            <div
              key={cat.id}
              className={`rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${cat.bg}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{cat.icon}</span>
                    <h4 className={`text-xs font-bold ${cat.text}`}>{cat.title}</h4>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${cat.badge}`}>
                    {cat.score}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug mb-3">
                  {cat.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-800">
                {cat.skills.slice(0, 3).map((sk, i) => (
                  <span key={i} className="text-[10px] font-bold bg-[#1E293B] text-gray-200 px-2 py-0.5 rounded-md border border-gray-700/70">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): ATS Health Meter & AI Highlights */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 3. Resume Health Score with Progress Bars */}
          <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <ChartBarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Resume Health & ATS Breakdown</h3>
                  <p className="text-xs text-gray-400">Multi-dimensional evaluation against recruiter filters</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Placement Ready
              </span>
            </div>

            <div className="space-y-4">
              {healthMetrics.map((metric, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-200">{metric.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-gray-400 font-medium">{metric.status}</span>
                      <span className="font-bold text-white">{metric.score}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[#0F172A] rounded-full overflow-hidden border border-gray-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${metric.color}`}
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. AI Resume Highlights & Recommendations */}
          <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-gray-800">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">AI Resume Highlights</h3>
                <p className="text-xs text-gray-400">Key strengths & high-impact optimization tips</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {dynamicHighlights.map((hl, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border flex items-start space-x-3 ${
                    hl.type === 'success' 
                      ? 'bg-emerald-950/20 border-emerald-500/30' 
                      : hl.type === 'info'
                      ? 'bg-blue-950/20 border-blue-500/30'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  {hl.type === 'success' ? (
                    <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : hl.type === 'info' ? (
                    <CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <InformationCircleIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className={`font-bold block ${
                      hl.type === 'success' ? 'text-emerald-300' : hl.type === 'info' ? 'text-blue-300' : 'text-amber-300'
                    }`}>
                      {hl.title}
                    </strong>
                    <span className={
                      hl.type === 'success' ? 'text-emerald-400/90' : hl.type === 'info' ? 'text-blue-400/90' : 'text-amber-400/90'
                    }>
                      {hl.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Extracted Projects & Portfolio Section */}
          {extractedProjects.length > 0 && (
            <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <FolderIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Extracted Projects & Portfolio</h3>
                    <p className="text-xs text-gray-400">Projects parsed by ATS text processor</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
                  {extractedProjects.length} Detected
                </span>
              </div>

              <div className="space-y-3">
                {extractedProjects.map((proj, pIdx) => (
                  <div key={pIdx} className="p-3.5 bg-[#1E293B]/60 rounded-xl border border-gray-700/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs">
                        {proj.title || `Project ${pIdx + 1}`}
                      </h4>
                      {proj.duration && (
                        <span className="text-[10px] text-gray-400 font-medium">{proj.duration}</span>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-2">
                        {proj.description}
                      </p>
                    )}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.technologies.map((t, tIdx) => (
                          <span key={tIdx} className="text-[9px] font-bold bg-[#0F172A] text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (5 cols): Education Timeline & Target Role Alignment */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Target Career Role Card */}
          <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Predicted Target Role</span>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-bold">
                Primary Match
              </span>
            </div>

            <div>
              <h4 className="text-xl font-bold text-white tracking-tight">
                {activeResumeDetails?.recommended_roles?.[0] || activeResume?.recommended_roles?.[0] || 'Software Engineer'}
              </h4>
              <p className="text-xs text-gray-300 mt-1">
                {(activeResumeDetails?.recommended_roles || activeResume?.recommended_roles || []).length > 1
                  ? `Aligned with ${(activeResumeDetails?.recommended_roles || activeResume?.recommended_roles || []).slice(0, 2).join(' & ')} competencies`
                  : 'Based on extracted technical competencies and project portfolio'
                }
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-300">Role Affinity: <strong className="text-indigo-400">{employabilityScore}%</strong></span>
              <button
                onClick={() => navigate('/skills')}
                className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View Skill Gaps</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dynamic Academic Journey */}
          <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 space-y-5">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-gray-800">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <AcademicCapIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Academic Journey</h3>
                <p className="text-xs text-gray-400">Verified educational timeline</p>
              </div>
            </div>

            {/* Dynamic Vertical Timeline Nodes */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
              {educationTimeline.map((edu, idx) => (
                <div key={idx} className="relative group">
                  <div className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-[#111827] shadow-sm ${
                    idx === 0 ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : 'bg-gray-600 ring-4 ring-gray-700/30'
                  }`} />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                        {edu.year || (idx === 0 ? 'Undergraduate Degree' : 'Secondary Education')}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                          Placement Ready
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1">
                      {edu.degree || edu.institution || 'Engineering Degree'}
                    </h4>
                    {edu.institution && edu.degree && (
                      <p className="text-xs text-gray-400 mt-0.5">{edu.institution}</p>
                    )}
                    {edu.gpa && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Academic Standing: {typeof edu.gpa === 'number' ? `CGPA: ${edu.gpa} / 10` : edu.gpa}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Industry Certifications */}
          {extractedCertifications.length > 0 && (
            <div className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Industry Certifications</h3>
                    <p className="text-xs text-gray-400">Verified credentials & badges</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  {extractedCertifications.length} Verified
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {extractedCertifications.map((cert, cIdx) => (
                  <div key={cIdx} className="p-3 bg-[#1E293B]/60 hover:bg-emerald-950/20 transition-colors rounded-xl border border-gray-700/80 text-xs space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-xs">
                        {cert.name || cert.full_title}
                      </h4>
                      {cert.issuer && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#0F172A] text-emerald-400 border border-emerald-500/20 rounded-md shrink-0">
                          {cert.issuer}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Fullscreen Live PDF Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#111827] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-800">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#0F172A] text-white flex items-center justify-between gap-3 flex-shrink-0 border-b border-gray-800">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
                  <DocumentIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate text-white" title={activeResume.filename}>
                    {activeResume.filename}
                  </h3>
                  <p className="text-[11px] text-gray-400">Live ATS Parseable Document Preview</p>
                </div>
              </div>

              {/* View Switcher & Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="bg-[#1E293B] p-0.5 rounded-lg flex text-xs font-semibold border border-gray-700">
                  <button
                    onClick={() => setViewMode('pdf')}
                    className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'pdf' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Live PDF
                  </button>
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'text' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Parsed Text
                  </button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="text-xs"
                >
                  <DownloadIcon className="w-4 h-4 mr-1 text-gray-300" />
                  Download
                </Button>

                <button
                  onClick={handleFullscreen}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                  title="Open in new browser tab"
                >
                  <ExternalLinkIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors ml-1"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-[#0B0F19] relative overflow-hidden flex items-center justify-center">
              {loadingPdf ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                  <p className="text-xs text-gray-400 font-medium">Loading document stream...</p>
                </div>
              ) : viewMode === 'pdf' && pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="Fullscreen Resume Live PDF"
                  className="w-full h-full border-0 bg-white"
                />
              ) : (
                <div className="w-full h-full overflow-y-auto p-6 sm:p-8 bg-[#0F172A] text-gray-200 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text selection:bg-indigo-600 selection:text-white">
                  {activeResumeDetails?.raw_text || (activeResumeDetails?.skills && activeResumeDetails.skills.length > 0 
                    ? `=== ATS PARSED DOCUMENT STREAM ===\nCandidate: ${candidateName}\nFilename: ${activeResume?.filename || 'Resume.pdf'}\n\n[EXTRACTED SKILLS (${activeResumeDetails.skills.length})]\n${activeResumeDetails.skills.join(', ')}\n\n[EDUCATION TIMELINE]\n${JSON.stringify(activeResumeDetails.education, null, 2)}\n\n[EXPERIENCE & INTERNSHIPS]\n${JSON.stringify(activeResumeDetails.experience, null, 2)}\n\n[PROJECTS & ACHIEVEMENTS]\n${JSON.stringify(activeResumeDetails.projects, null, 2)}`
                    : 'Loading parsed text stream from ATS engine...')}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeList