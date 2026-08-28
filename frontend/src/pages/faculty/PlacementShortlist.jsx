// frontend/src/pages/faculty/PlacementShortlist.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import toast from 'react-hot-toast'
import {
  BriefcaseIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  AcademicCapIcon,
  UserGroupIcon,
  RefreshIcon,
  DocumentDownloadIcon,
  TagIcon,
  CheckIcon,
  TrashIcon,
  InformationCircleIcon,
  OfficeBuildingIcon,
  XIcon
} from '@heroicons/react/outline'

const POPULAR_SKILLS = [
  'Python',
  'SQL',
  'React',
  'JavaScript',
  'Docker',
  'AWS',
  'Node.js',
  'Machine Learning',
  'Java',
  'C++',
  'FastAPI',
  'PostgreSQL',
  'Git',
  'Data Structures'
]

export const PlacementShortlist = ({ departments = [], initialScope = 'all' }) => {
  // Criteria states
  const [companyName, setCompanyName] = useState('Google Campus Hiring')
  const [selectedSkills, setSelectedSkills] = useState(['Python', 'SQL'])
  const [popularSkillsList, setPopularSkillsList] = useState(POPULAR_SKILLS)
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [placementStatus, setPlacementStatus] = useState('seeking')
  const [minEmployability, setMinEmployability] = useState(0)
  const [filterScope, setFilterScope] = useState(initialScope) // 'all' or 'mentees'

  // Results & Selection states
  const [candidates, setCandidates] = useState([])
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [isExportingZip, setIsExportingZip] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  // Company Nomination modal states
  const [showNominateModal, setShowNominateModal] = useState(false)
  const [nominateTargetStudents, setNominateTargetStudents] = useState([])
  const [nominateRole, setNominateRole] = useState('Software Engineer')
  const [nominatePackage, setNominatePackage] = useState('')
  const [nominateNotes, setNominateNotes] = useState('')
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(false)

  // Drive RSVP & Stats state
  const [rsvpFilter, setRsvpFilter] = useState('all') // 'all', 'confirmed', 'pending', 'declined', 'placed'
  const [driveStats, setDriveStats] = useState({
    total_invited: 0,
    confirmed_attending: 0,
    pending_rsvp: 0,
    declined: 0,
    placed: 0
  })
  const [isMarkingHired, setIsMarkingHired] = useState(null)

  // Fetch shortlist from backend
  const fetchShortlist = async () => {
    try {
      setLoading(true)
      const payload = {
        company_name: companyName,
        required_skills: selectedSkills,
        department: selectedDept,
        min_year: selectedYear,
        placement_status: placementStatus,
        min_employability_score: minEmployability,
        filter_scope: filterScope
      }

      const res = await api.post('/analytics/placement/shortlist', payload)
      const list = res.data?.candidates || []
      setCandidates(list)
      // Auto-select all candidates by default on new fetch
      setSelectedStudentIds(list.map((c) => c.id))
    } catch (err) {
      console.error('Failed to fetch placement shortlist:', err)
      toast.error('Failed to generate candidate shortlist')
    } finally {
      setLoading(false)
    }
  }

  // Fetch real-time company drive statistics
  const fetchDriveStats = async () => {
    if (!companyName.trim()) return
    try {
      const res = await api.get(
        `/placement/company-nominations?company_name=${encodeURIComponent(companyName.trim())}`
      )
      if (res.data?.stats) {
        setDriveStats(res.data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch drive stats:', err)
    }
  }

  // Trigger shortlist whenever criteria change
  useEffect(() => {
    fetchShortlist()
  }, [selectedSkills, selectedDept, selectedYear, placementStatus, minEmployability, filterScope])

  // Trigger drive statistics whenever company name or candidates change
  useEffect(() => {
    fetchDriveStats()
  }, [companyName, candidates])

  // Add a skill to required list
  const handleAddSkill = (skill) => {
    const clean = (skill || '').trim()
    if (!clean) return
    if (!selectedSkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setSelectedSkills([...selectedSkills, clean])
    }
    if (!popularSkillsList.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setPopularSkillsList([...popularSkillsList, clean])
    }
    setCustomSkillInput('')
  }

  // Remove a skill
  const handleRemoveSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase()))
  }

  // Toggle selection for a single student
  const handleToggleStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === visibleCandidates.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(visibleCandidates.map((c) => c.id))
    }
  }

  // Filter candidates by search text and RSVP filter
  const visibleCandidates = useMemo(() => {
    let list = candidates
    if (rsvpFilter === 'confirmed') {
      list = list.filter((c) => c.nomination_status === 'confirmed_attending')
    } else if (rsvpFilter === 'pending') {
      list = list.filter((c) => c.nomination_status === 'pending')
    } else if (rsvpFilter === 'declined') {
      list = list.filter((c) => c.nomination_status === 'rejected')
    } else if (rsvpFilter === 'placed') {
      list = list.filter(
        (c) => c.nomination_status === 'placed' || c.placement_status === 'placed'
      )
    }

    if (!searchFilter.trim()) return list
    const q = searchFilter.toLowerCase()
    return list.filter(
      (c) =>
        (c.full_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.department || '').toLowerCase().includes(q)
    )
  }, [candidates, searchFilter, rsvpFilter])

  // Faculty marks confirmed student as officially Placed / Hired
  const handleMarkStudentHired = async (student) => {
    if (!student.nomination_id) return
    try {
      setIsMarkingHired(student.id)
      const res = await api.post(`/placement/nominations/${student.nomination_id}/mark-hired`, {
        package_lpa: student.nomination_package || null
      })
      if (res.data?.success) {
        toast.success(
          `🎉 ${student.full_name || student.username} is officially marked as Placed at ${companyName}!`
        )
        // Update local candidate status
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === student.id
              ? {
                  ...c,
                  nomination_status: 'placed',
                  placement_status: 'placed',
                  placed_company: companyName
                }
              : c
          )
        )
        fetchDriveStats()
      }
    } catch (err) {
      console.error('Failed to mark student hired:', err)
      toast.error(
        err.response?.data?.message || err.response?.data?.error || 'Failed to update status'
      )
    } finally {
      setIsMarkingHired(null)
    }
  }

  // Open nomination modal
  const handleOpenNominateModal = (students) => {
    if (!students || students.length === 0) {
      toast.error('Please select at least one student to nominate')
      return
    }
    setNominateTargetStudents(students)
    setNominateRole('Software Engineer')
    setNominatePackage('')
    setNominateNotes('')
    setShowNominateModal(true)
  }

  // Submit candidate nomination(s) for the company
  const handleSubmitNomination = async () => {
    if (!companyName.trim()) {
      toast.error('Please specify a company name')
      return
    }
    if (nominateTargetStudents.length === 0) {
      toast.error('No students selected for nomination')
      return
    }

    try {
      setIsSubmittingNomination(true)
      const payload = {
        company_name: companyName.trim(),
        student_ids: nominateTargetStudents.map((s) => s.id),
        job_role: nominateRole.trim() || 'Software Engineer',
        package_lpa: nominatePackage ? parseFloat(nominatePackage) : null,
        faculty_notes: nominateNotes.trim()
      }

      const res = await api.post('/placement/nominate', payload)
      if (res.data?.success) {
        toast.success(res.data.message || `Nominated ${nominateTargetStudents.length} candidate(s)!`)
        
        // Update local candidate status
        const targetIds = new Set(nominateTargetStudents.map((s) => s.id))
        setCandidates((prev) =>
          prev.map((c) =>
            targetIds.has(c.id)
              ? {
                  ...c,
                  nomination_status: 'pending',
                  nomination_role: nominateRole.trim(),
                  nomination_package: nominatePackage ? parseFloat(nominatePackage) : null
                }
              : c
          )
        )
        setShowNominateModal(false)
      }
    } catch (err) {
      console.error('Failed to submit nomination:', err)
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to nominate students')
    } finally {
      setIsSubmittingNomination(false)
    }
  }

  // 1-Click ZIP Bundle Export
  const handleDownloadZipBundle = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student to export')
      return
    }

    try {
      setIsExportingZip(true)
      toast.loading('Packaging verified resumes & CSV summary...', { id: 'zip-toast' })

      const payload = {
        company_name: companyName || 'Company_Campus_Drive',
        student_ids: selectedStudentIds,
        criteria: {
          required_skills: selectedSkills,
          department: selectedDept,
          min_year: selectedYear,
          placement_status: placementStatus,
          min_employability_score: minEmployability
        }
      }

      const response = await api.post('/analytics/placement/export-bundle', payload, {
        responseType: 'blob'
      })

      // Create download blob
      const blob = new Blob([response.data], { type: 'application/zip' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      const cleanCompany = (companyName || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_')
      link.setAttribute('download', `${cleanCompany}_Placement_Shortlist_${new Date().toISOString().slice(0, 10)}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success(`Exported bundle with ${selectedStudentIds.length} candidate resumes!`, { id: 'zip-toast' })
    } catch (err) {
      console.error('Export ZIP failed:', err)
      toast.error('Failed to export resume bundle', { id: 'zip-toast' })
    } finally {
      setIsExportingZip(false)
    }
  }

  // Export Shortlist CSV
  const handleExportCSV = () => {
    const toExport = candidates.filter((c) => selectedStudentIds.includes(c.id))
    if (toExport.length === 0) {
      toast.error('No students selected for CSV export')
      return
    }

    const headers = [
      'Student Name',
      'Email',
      'Phone',
      'Department',
      'Year of Study',
      'Match Percentage',
      'Employability Score',
      'Placement Status',
      'Matched Skills',
      'All Skills'
    ]

    const rows = toExport.map((s) => [
      `"${s.full_name || s.username || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || 'N/A'}"`,
      `"${s.department || 'General'}"`,
      `"${s.year_of_study || 'N/A'}"`,
      `"${s.match_percentage}%"`,
      `"${s.employability_score}%"`,
      `"${s.placement_status || 'seeking'}"`,
      `"${(s.matched_skills || []).join(', ')}"`,
      `"${(s.skills || []).join(', ')}"`
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const cleanCompany = (companyName || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_')
    link.setAttribute('download', `${cleanCompany}_Shortlist_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Exported ${toExport.length} candidates to CSV!`)
  }

  return (
    <div className="space-y-6">
      {/* Top Value Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-purple-100 border border-white/20 mb-2">
              <SparklesIcon className="h-4 w-4 text-amber-300" />
              Company Eligibility & Instant Shortlisting Tool
            </div>
            <h2 className="text-2xl font-bold text-white">Campus Placement Shortlist & Bundle Packager</h2>
            <p className="text-purple-100 text-sm mt-1 max-w-2xl">
              Match visiting company criteria in seconds, verify candidate readiness scores, and download a complete ZIP package with all student resumes ready for HR.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadZipBundle}
              isLoading={isExportingZip}
              disabled={selectedStudentIds.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-amber-400"
            >
              <DocumentDownloadIcon className="h-5 w-5 text-gray-950" />
              📦 Export ZIP Bundle ({selectedStudentIds.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Criteria Filter Builder */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-base">Company Hiring Criteria</h3>
          </div>
          <button
            onClick={() => {
              setCompanyName('Campus Placement Drive')
              setSelectedSkills(['Python', 'SQL'])
              setSelectedDept('all')
              setSelectedYear('all')
              setPlacementStatus('seeking')
              setMinEmployability(0)
            }}
            className="text-xs text-gray-500 hover:text-purple-600 font-medium"
          >
            Reset Filters
          </button>
        </div>

        {/* Row 1: Company Name & Scope */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Company / Drive Title
            </label>
            <div className="relative">
              <BriefcaseIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google SWE Drive, Microsoft SDE"
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Target Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Cohort Scope
            </label>
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
            >
              <option value="all">Entire Student Cohort (All Students)</option>
              <option value="mentees">My Assigned Mentees Only</option>
            </select>
          </div>
        </div>

        {/* Row 2: Year, Status, Minimum Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Academic Year of Study
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Any Academic Year</option>
              <option value="4">Final Year (Year 4 - Graduating)</option>
              <option value="3">Pre-Final Year (Year 3 - Internships)</option>
              <option value="2">Year 2</option>
              <option value="1">Year 1</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Placement Status
            </label>
            <select
              value={placementStatus}
              onChange={(e) => setPlacementStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="seeking">Seeking Placement (Unplaced)</option>
              <option value="placed">Already Placed</option>
              <option value="all">All Placement Statuses</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Min. Employability Score
              </label>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                {minEmployability}%+
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minEmployability}
              onChange={(e) => setMinEmployability(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
            />
          </div>
        </div>

        {/* Row 3: Required Technical Skills Builder */}
        <div className="space-y-2.5 pt-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Required Technical Skills for this Drive
          </label>

          {/* Selected Skills Badges */}
          <div className="flex flex-wrap items-center gap-2 min-h-[44px] p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            {selectedSkills.length > 0 ? (
              selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white shadow-xs"
                >
                  <TagIcon className="h-3 w-3" />
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:bg-purple-700 p-0.5 rounded transition-colors focus:outline-none ml-0.5"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">
                No specific skills selected (all candidates matching year/status will be included).
              </span>
            )}
          </div>

          {/* Quick-add popular skills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-gray-500 font-medium mr-1">Quick Add:</span>
            {popularSkillsList.map((skill) => {
              const isSelected = selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase())
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => (isSelected ? handleRemoveSkill(skill) : handleAddSkill(skill))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-purple-100 text-purple-800 border border-purple-300 font-bold shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-400 hover:text-purple-700 shadow-xs'
                  }`}
                >
                  {isSelected && <CheckIcon className="h-3 w-3 text-purple-600" />}
                  {skill}
                </button>
              )
            })}
          </div>

          {/* Custom skill text input */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSkill(customSkillInput)
                }
              }}
              placeholder="Type custom skill (e.g. Kubernetes, Golang, PyTorch) and press Enter"
              className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white text-gray-900"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!customSkillInput.trim()}
              onClick={() => handleAddSkill(customSkillInput)}
              className="text-xs font-semibold rounded-xl px-4 py-2"
            >
              Add Skill
            </Button>
          </div>
        </div>
      </div>

      {/* Active Campus Drives Helper Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-white p-4 rounded-xl border border-purple-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-sm">
            <OfficeBuildingIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Campus Drives & Confirmed Attendance Manager
            </h3>
            <p className="text-xs text-gray-500">
              Shortlist and invite candidates here. Track confirmed RSVPs and finalize placements in the Campus Drives tab.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href)
            url.searchParams.set('tab', 'drives')
            window.history.pushState({}, '', url)
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
          className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white hover:bg-purple-50 border border-purple-300 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <OfficeBuildingIcon className="h-4 w-4 text-purple-600" />
          Open Campus Drives Manager ➔
        </button>
      </div>

      {/* Results Header & Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center h-5">
            <input
              id="select-all"
              type="checkbox"
              checked={
                visibleCandidates.length > 0 &&
                selectedStudentIds.length === visibleCandidates.length
              }
              onChange={handleToggleSelectAll}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
            />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900">
              {visibleCandidates.length} Candidates Matched
            </span>
            <span className="text-xs text-gray-500 ml-2">
              ({selectedStudentIds.length} selected for ZIP export)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by name, email..."
              className="pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 w-48 sm:w-60"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            disabled={selectedStudentIds.length === 0}
            className="text-xs flex items-center gap-1.5"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadZipBundle}
            isLoading={isExportingZip}
            disabled={selectedStudentIds.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs flex items-center gap-1.5 font-semibold"
          >
            <DocumentDownloadIcon className="h-3.5 w-3.5" />
            Download Resumes ZIP
          </Button>

          <Button
            size="sm"
            onClick={() =>
              handleOpenNominateModal(candidates.filter((c) => selectedStudentIds.includes(c.id)))
            }
            disabled={selectedStudentIds.length === 0}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs flex items-center gap-1.5 font-semibold shadow-sm"
          >
            <SparklesIcon className="h-3.5 w-3.5 text-amber-300" />
            Invite Selected ({selectedStudentIds.length})
          </Button>
        </div>
      </div>

      {/* Candidate List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshIcon className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Matching candidate skill matrices against criteria...</p>
          </div>
        ) : visibleCandidates.length === 0 ? (
          <div className="py-16 text-center px-4">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-700">No candidates match this criteria</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Try adjusting the required skills, lowering the minimum employability score, or setting the academic year to "Any Year".
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleCandidates.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id)
              const matchPct = student.match_percentage || 0
              const empScore = student.employability_score || 0

              let matchBadgeColor = 'bg-green-100 text-green-800 border-green-200'
              if (matchPct < 50) matchBadgeColor = 'bg-rose-100 text-rose-800 border-rose-200'
              else if (matchPct < 80) matchBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200'

              return (
                <div
                  key={student.id}
                  onClick={() => handleToggleStudent(student.id)}
                  className={`p-4 transition-colors cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isSelected ? 'bg-purple-50/40 hover:bg-purple-50/70' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Left Column: Checkbox, Avatar, Name & Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleStudent(student.id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                      />
                    </div>

                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                      {(student.full_name || student.username || 'S')[0].toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {student.full_name || student.username}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold border ${matchBadgeColor}`}
                        >
                          🎯 {matchPct}% Match
                        </span>
                        {student.placement_status === 'placed' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Placed ({student.placed_company || 'Company'})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            Seeking Placement
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {student.email} • {student.phone || 'Phone not set'}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                        <span>🏫 {student.department || 'General'}</span>
                        <span>🎓 Year {student.year_of_study || 'N/A'}</span>
                        <span>
                           📄 {student.has_resume ? (
                            <span className="text-emerald-700 font-medium">Verified Resume</span>
                          ) : (
                            <span className="text-gray-400">Profile Dossier</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Skills, Scores & Nomination Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 pl-12 lg:pl-0">
                    {/* Employability Score */}
                    <div className="min-w-[100px]">
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-gray-500">Readiness:</span>
                        <span className="font-bold text-purple-700">{empScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${Math.min(empScore, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Matched vs Missing Skills */}
                    <div className="max-w-xs">
                      <div className="flex flex-wrap items-center gap-1">
                        {(student.matched_skills || []).map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800 border border-green-300"
                          >
                            ✓ {sk}
                          </span>
                        ))}
                        {(student.missing_skills || []).map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 border border-dashed border-gray-300"
                          >
                            ✕ {sk}
                          </span>
                        ))}
                        {(!student.matched_skills || student.matched_skills.length === 0) &&
                          (!student.missing_skills || student.missing_skills.length === 0) &&
                          (student.skills || []).slice(0, 3).map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700"
                            >
                              {sk}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Nomination Action / Status */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {student.nomination_status === 'confirmed_attending' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          🟢 Confirmed Attending
                        </span>
                      ) : student.nomination_status === 'pending' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          ⏳ Invited (Pending RSVP)
                        </span>
                      ) : student.nomination_status === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          🔴 Declined Drive
                        </span>
                      ) : student.nomination_status === 'placed' || student.placement_status === 'placed' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                          🏆 Placed ({student.placed_company || companyName})
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenNominateModal([student])}
                          className="text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50 flex items-center gap-1 font-medium py-1 px-2.5"
                        >
                          <SparklesIcon className="h-3.5 w-3.5 text-indigo-600" />
                          Invite to Drive
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Company Drive Nomination Modal */}
      {showNominateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Nominate Candidates for Company</h3>
                  <p className="text-xs text-gray-500">
                    Students will receive an in-app alert to Accept or Decline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNominateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-5">
              {/* Selected candidates summary */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3">
                <span className="text-xs font-bold text-purple-900 block mb-1">
                  Selected Candidate(s) ({nominateTargetStudents.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {nominateTargetStudents.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-purple-800 border border-purple-200 shadow-2xs"
                    >
                      {s.full_name || s.username}
                    </span>
                  ))}
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company / Organization <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Samsung Electronics"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Job Role & Package */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Designation / Job Role
                  </label>
                  <input
                    type="text"
                    value={nominateRole}
                    onChange={(e) => setNominateRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Offered CTC (LPA, Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nominatePackage}
                    onChange={(e) => setNominatePackage(e.target.value)}
                    placeholder="e.g. 14.5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Faculty Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Faculty Note / Interview Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={nominateNotes}
                  onChange={(e) => setNominateNotes(e.target.value)}
                  placeholder="e.g. Shortlisted based on resume match. First round technical interview on Friday 10 AM."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNominateModal(false)}
                disabled={isSubmittingNomination}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitNomination}
                isLoading={isSubmittingNomination}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5"
              >
                <SparklesIcon className="h-4 w-4 text-amber-300" />
                Confirm & Notify Candidate(s)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
