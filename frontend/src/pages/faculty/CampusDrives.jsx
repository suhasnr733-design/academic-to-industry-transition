// src/pages/faculty/CampusDrives.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import toast from 'react-hot-toast'
import {
  OfficeBuildingIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  SparklesIcon,
  DownloadIcon,
  DocumentDownloadIcon,
  ArrowLeftIcon,
  SearchIcon,
  RefreshIcon
} from '@heroicons/react/outline'

export const CampusDrives = ({ onNavigateToShortlist }) => {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Drill-down state
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [driveStats, setDriveStats] = useState(null)
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('confirmed') // 'confirmed', 'pending', 'declined', 'placed', 'all'
  const [isExportingZip, setIsExportingZip] = useState(false)
  const [isMarkingHired, setIsMarkingHired] = useState(null)

  // Fetch all drives summary
  const fetchDrivesSummary = async () => {
    try {
      setLoading(true)
      const res = await api.get('/placement/drives-summary')
      setDrives(res.data?.drives || [])
    } catch (err) {
      console.error('Failed to fetch campus drives:', err)
      toast.error('Failed to load campus drives')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivesSummary()
  }, [])

  // Fetch attendees for a specific company drive
  const fetchDriveAttendees = async (companyName, filter = statusFilter) => {
    if (!companyName) return
    try {
      setAttendeesLoading(true)
      const filterParam = filter === 'all' ? 'all' : filter
      const res = await api.get(
        `/placement/drives/${encodeURIComponent(companyName)}/attendees?status=${filterParam}`
      )
      setAttendees(res.data?.attendees || [])
      setDriveStats(res.data?.stats || null)
    } catch (err) {
      console.error('Failed to fetch drive attendees:', err)
      toast.error('Failed to load drive attendees')
    } finally {
      setAttendeesLoading(false)
    }
  }

  // Handle drill down into a company drive
  const handleOpenDriveDetail = (companyName) => {
    setSelectedCompany(companyName)
    setStatusFilter('confirmed')
    fetchDriveAttendees(companyName, 'confirmed')
  }

  // Handle status tab change in drill-down view
  const handleStatusFilterChange = (filter) => {
    setStatusFilter(filter)
    fetchDriveAttendees(selectedCompany, filter)
  }

  // Mark student as final placed/hired
  const handleMarkStudentHired = async (attendee) => {
    try {
      setIsMarkingHired(attendee.nomination_id)
      const res = await api.post(`/placement/nominations/${attendee.nomination_id}/mark-hired`, {
        package_lpa: attendee.package_lpa || null
      })
      if (res.data?.success) {
        toast.success(
          `🎉 ${attendee.student.full_name} is officially marked as Placed at ${selectedCompany}!`,
          { duration: 5000 }
        )
        // Refresh attendees and drives summary
        fetchDriveAttendees(selectedCompany, statusFilter)
        fetchDrivesSummary()
      }
    } catch (err) {
      console.error('Failed to mark student as hired:', err)
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update status')
    } finally {
      setIsMarkingHired(null)
    }
  }

  // Download Confirmed Resumes ZIP for HR
  const handleExportZip = async () => {
    const studentIds = attendees.map((a) => a.student.id)
    if (studentIds.length === 0) {
      toast.error('No candidate resumes to export in this view')
      return
    }

    try {
      setIsExportingZip(true)
      toast.loading(`Packaging ${studentIds.length} verified candidate resumes...`, { id: 'zip-toast' })

      const payload = {
        company_name: selectedCompany,
        student_ids: studentIds,
        criteria: {
          required_skills: [],
          department: 'All Departments'
        }
      }

      const res = await api.post('/analytics/placement/export-bundle', payload, {
        responseType: 'blob'
      })

      const blob = new Blob([res.data], { type: 'application/zip' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${selectedCompany.replace(/\s+/g, '_')}_Confirmed_Attendees_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('ZIP package downloaded successfully!', { id: 'zip-toast' })
    } catch (err) {
      console.error('ZIP export failed:', err)
      toast.error('Failed to generate ZIP package', { id: 'zip-toast' })
    } finally {
      setIsExportingZip(false)
    }
  }

  // Export Attendees CSV
  const handleExportCSV = () => {
    if (attendees.length === 0) {
      toast.error('No attendees to export')
      return
    }

    const headers = [
      'Student Name',
      'Roll / Username',
      'Email',
      'Phone',
      'Department',
      'Year',
      'Drive Status',
      'Employability Score',
      'Offered Package (LPA)',
      'Student Note'
    ]

    const rows = attendees.map((a) => [
      `"${a.student.full_name || ''}"`,
      `"${a.student.username || ''}"`,
      `"${a.student.email || ''}"`,
      `"${a.student.phone || 'N/A'}"`,
      `"${a.student.department || 'General'}"`,
      `"${a.student.year_of_study || 'N/A'}"`,
      `"${a.status}"`,
      `"${a.resume.employability_score || 0}%"`,
      `"${a.package_lpa || 'N/A'}"`,
      `"${a.student_response_note || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${selectedCompany}_Drive_Attendees_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Attendee roster exported successfully!')
  }

  // Filter drives by search
  const visibleDrives = useMemo(() => {
    if (!searchQuery.trim()) return drives
    const q = searchQuery.toLowerCase()
    return drives.filter((d) => d.company_name.toLowerCase().includes(q) || d.job_role.toLowerCase().includes(q))
  }, [drives, searchQuery])

  // Aggregate totals
  const totalStats = useMemo(() => {
    return drives.reduce(
      (acc, d) => ({
        total_drives: acc.total_drives + 1,
        total_invited: acc.total_invited + d.total_invited,
        confirmed_attending: acc.confirmed_attending + d.confirmed_attending,
        placed: acc.placed + d.placed
      }),
      { total_drives: 0, total_invited: 0, confirmed_attending: 0, placed: 0 }
    )
  }, [drives])

  // =========================================================================
  // VIEW 2: DRILL-DOWN COMPANY DRIVE MANAGER & CONFIRMED ATTENDEES PAGE
  // =========================================================================
  if (selectedCompany) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Navigation Breadcrumb & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <button
              onClick={() => setSelectedCompany(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors mb-2 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg border border-purple-200"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Back to All Campus Drives
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <OfficeBuildingIcon className="h-8 w-8 text-purple-600" />
                {selectedCompany}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Drive Attendance Manager
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Verify student RSVPs, export candidate resume bundles for HR, and mark final hired candidates.
            </p>
          </div>

          {/* Quick Action Exports */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={attendees.length === 0}
              className="text-xs flex items-center gap-1.5 border-gray-300"
            >
              <DownloadIcon className="h-4 w-4" />
              Export Roster CSV
            </Button>
            <Button
              size="sm"
              onClick={handleExportZip}
              isLoading={isExportingZip}
              disabled={attendees.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <DocumentDownloadIcon className="h-4 w-4" />
              Download Resumes ZIP
            </Button>
          </div>
        </div>

        {/* Live RSVP Status Counter Bar */}
        {driveStats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => handleStatusFilterChange('confirmed')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Confirmed Attending</span>
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{driveStats.confirmed_attending}</div>
              <span className="text-[11px] text-emerald-600/80">Ready for Drive Day</span>
            </button>

            <button
              onClick={() => handleStatusFilterChange('pending')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                statusFilter === 'pending'
                  ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-amber-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">Awaiting RSVP</span>
                <ClockIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">{driveStats.pending_rsvp}</div>
              <span className="text-[11px] text-amber-600/80">Pending Student Action</span>
            </button>

            <button
              onClick={() => handleStatusFilterChange('declined')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                statusFilter === 'declined'
                  ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-rose-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">Declined Drive</span>
                <XCircleIcon className="h-5 w-5 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700 mt-1">{driveStats.declined}</div>
              <span className="text-[11px] text-rose-600/80">Cannot Attend</span>
            </button>

            <button
              onClick={() => handleStatusFilterChange('placed')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                statusFilter === 'placed'
                  ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-purple-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800">Final Placed</span>
                <SparklesIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-700 mt-1">{driveStats.placed}</div>
              <span className="text-[11px] text-purple-600/80">Officially Hired</span>
            </button>

            <button
              onClick={() => handleStatusFilterChange('all')}
              className={`p-4 rounded-2xl border text-left transition-all col-span-2 sm:col-span-1 relative overflow-hidden ${
                statusFilter === 'all'
                  ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-500/20 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Total Shortlisted</span>
                <UserGroupIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1">{driveStats.total_invited}</div>
              <span className="text-[11px] text-gray-500">All Candidates</span>
            </button>
          </div>
        )}

        {/* Attendees Table / Roster */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">
                {statusFilter === 'confirmed'
                  ? '🟢 Confirmed Drive Attendees'
                  : statusFilter === 'pending'
                  ? '⏳ Awaiting Student RSVP'
                  : statusFilter === 'declined'
                  ? '🔴 Declined Invitations'
                  : statusFilter === 'placed'
                  ? '🏆 Officially Hired Students'
                  : '👥 All Shortlisted Candidates'}{' '}
                ({attendees.length})
              </span>
            </div>
            <span className="text-[11px] text-gray-500">
              Click "Mark as Final Hired" once interview selection results are declared.
            </span>
          </div>

          {attendeesLoading ? (
            <div className="py-16 text-center">
              <RefreshIcon className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Fetching drive candidates...</p>
            </div>
          ) : attendees.length === 0 ? (
            <div className="py-16 text-center px-4">
              <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-gray-700">No students found in this category</h4>
              <p className="text-xs text-gray-500 mt-1">
                Switch filters above to view other candidate statuses.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {attendees.map((attendee) => {
                const student = attendee.student
                const resume = attendee.resume
                const isConfirmed = attendee.status === 'confirmed_attending' || attendee.status === 'accepted'
                const isPlaced = attendee.status === 'placed'
                const isPending = attendee.status === 'pending'
                const isDeclined = attendee.status === 'rejected'

                return (
                  <div
                    key={attendee.nomination_id}
                    className="p-5 hover:bg-gray-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Avatar, Name & Student Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm flex-shrink-0">
                        {(student.full_name || student.username || 'S')[0].toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900">
                            {student.full_name || student.username}
                          </h3>
                          <span className="text-xs text-gray-500 font-normal">(@{student.username})</span>

                          {isConfirmed && !isPlaced && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                              Confirmed Attending
                            </span>
                          )}

                          {isPlaced && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                              <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
                              Officially Placed
                            </span>
                          )}

                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <ClockIcon className="h-3.5 w-3.5 text-amber-600" />
                              Awaiting RSVP
                            </span>
                          )}

                          {isDeclined && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <XCircleIcon className="h-3.5 w-3.5 text-rose-600" />
                              Declined Drive
                            </span>
                          )}

                          {attendee.package_lpa && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              ₹{attendee.package_lpa} LPA CTC
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 flex-wrap">
                          <span>📧 {student.email}</span>
                          <span>📞 {student.phone || 'Phone not set'}</span>
                          <span>🏫 {student.department || 'General'}</span>
                          <span>🎓 Year {student.year_of_study || 'N/A'}</span>
                        </div>

                        {attendee.student_response_note && (
                          <p className="text-xs text-gray-600 mt-2 bg-gray-100/70 border border-gray-200 rounded-lg px-2.5 py-1.5 max-w-xl">
                            <span className="font-semibold text-gray-700">Student Note:</span> "{attendee.student_response_note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Employability Score & Final Placement Action */}
                    <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0 self-end lg:self-center">
                      {/* Score Badge */}
                      <div className="text-right">
                        <span className="text-[11px] text-gray-500 block">Employability Score</span>
                        <span className="text-sm font-black text-purple-700">
                          {resume.employability_score || 0}%
                        </span>
                      </div>

                      {/* Final Placement Action Button */}
                      {isConfirmed && !isPlaced && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkStudentHired(attendee)}
                          isLoading={isMarkingHired === attendee.nomination_id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <SparklesIcon className="h-4 w-4 text-amber-300" />
                          Mark as Final Hired
                        </Button>
                      )}

                      {isPlaced && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 font-bold text-xs border border-purple-200">
                          <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                          Hired & Placed
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 1: CAMPUS DRIVES OVERVIEW (LIST OF ALL COMPANY DRIVES)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
              Campus Drives Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1.5">
            Active Campus Placement Drives
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Track confirmed candidate attendees, student RSVPs, and manage final placements for visiting companies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDrivesSummary}
            isLoading={loading}
            className="flex items-center text-xs"
          >
            <RefreshIcon className="h-4 w-4 mr-1.5" />
            Refresh Drives
          </Button>

          {onNavigateToShortlist && (
            <Button
              size="sm"
              onClick={onNavigateToShortlist}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center shadow-md shadow-purple-600/20"
            >
              <SparklesIcon className="h-4 w-4 mr-1.5 text-amber-300" />
              New Candidate Shortlist
            </Button>
          )}
        </div>
      </div>

      {/* Aggregate Overview Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Active Company Drives</span>
            <OfficeBuildingIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-1">{totalStats.total_drives}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Shortlisted</span>
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-1">{totalStats.total_invited}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Confirmed Attending</span>
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{totalStats.confirmed_attending}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Officially Placed</span>
            <SparklesIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">{totalStats.placed}</div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drives by company name, job role..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium">{visibleDrives.length} Company Drives</span>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshIcon className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading campus placement drives...</p>
        </div>
      ) : visibleDrives.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
          <OfficeBuildingIcon className="h-16 w-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No Campus Drives Created Yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Use the Candidate Shortlist tool to select candidates for visiting companies and send drive invitations.
          </p>
          {onNavigateToShortlist && (
            <Button size="sm" onClick={onNavigateToShortlist} className="mt-4 bg-purple-600 text-white text-xs">
              Open Shortlist Tool
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleDrives.map((drive) => {
            return (
              <div
                key={drive.company_name}
                onClick={() => handleOpenDriveDetail(drive.company_name)}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 bg-purple-50 text-purple-700 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <OfficeBuildingIcon className="h-6 w-6" />
                    </div>

                    {drive.package_lpa && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        ₹{drive.package_lpa} LPA CTC
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-gray-900 mt-3 group-hover:text-purple-700 transition-colors">
                    {drive.company_name}
                  </h3>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {drive.job_role || 'Software Engineer'} • Coordinated by {drive.faculty_name}
                  </p>

                  {/* Attendance Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-gray-600 font-semibold">RSVP Confirmation</span>
                      <span className="text-emerald-700 font-bold">
                        {drive.confirmed_attending} of {drive.total_invited} Confirmed
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(drive.confirmed_attending / (drive.total_invited || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-purple-500 h-full"
                        style={{ width: `${(drive.placed / (drive.total_invited || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${(drive.pending_rsvp / (drive.total_invited || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-rose-400 h-full"
                        style={{ width: `${(drive.declined / (drive.total_invited || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Mini RSVP Pills */}
                  <div className="flex items-center gap-2 flex-wrap mt-3.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      🟢 {drive.confirmed_attending} Confirmed
                    </span>
                    {drive.pending_rsvp > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        ⏳ {drive.pending_rsvp} Pending
                      </span>
                    )}
                    {drive.placed > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        🏆 {drive.placed} Placed
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">
                    {drive.last_activity ? new Date(drive.last_activity).toLocaleDateString() : 'Active'}
                  </span>
                  <span className="font-bold text-purple-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Manage Confirmed Attendees ➔
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
