import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import { WelcomeActionsModal } from '../../components/dashboard/WelcomeActionsModal'
import toast from 'react-hot-toast'
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  DownloadIcon,
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  EyeIcon,
  XIcon,
  SparklesIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  BadgeCheckIcon,
  InboxInIcon,
  CheckIcon,
  BanIcon,
  ClockIcon,
  UserAddIcon,
  UserRemoveIcon,
  OfficeBuildingIcon
} from '@heroicons/react/outline'
import { PlacementShortlist } from './PlacementShortlist'
import { CampusDrives } from './CampusDrives'

export const FacultyDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  // Dynamic faculty profile completeness
  const facultyProfileFields = ['full_name', 'email', 'department', 'college', 'phone', 'bio']
  const filledFacultyFields = facultyProfileFields.filter((f) => Boolean(user?.[f] && String(user?.[f]).trim().length > 0))
  const facultyProfilePercentage = Math.round((filledFacultyFields.length / facultyProfileFields.length) * 100)

  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    resumesProcessed: 0,
    placementRate: '0%',
    activeJobs: 0,
    hasAssignedMentees: false
  })
  const [cohortSkills, setCohortSkills] = useState([])
  const [advisorInsight, setAdvisorInsight] = useState({
    title: 'Awaiting Resume Submissions',
    top_deficit_skill: 'No Resumes Uploaded',
    gap_percentage: 100,
    message: 'No student resumes have been uploaded for AI skill verification yet. Encourage your student cohort to upload their resumes to unlock live skill deficit analytics and placement recommendations.',
    action_label: 'Inspect Student Cohort'
  })
  const [students, setStudents] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [directoryScope, setDirectoryScope] = useState(searchParams.get('scope') === 'mentees' ? 'mentees' : 'mentees')
  const [loading, setLoading] = useState(true)

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')

  // Selected Student Modal & Placement Form
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isUpdatingPlacement, setIsUpdatingPlacement] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(null)
  const [isReleasingMentee, setIsReleasingMentee] = useState(null)
  const [placementForm, setPlacementForm] = useState({
    placement_status: 'seeking',
    placed_company: '',
    package_lpa: ''
  })

  const fetchFacultyData = async () => {
    try {
      setLoading(true)
      const [statsRes, skillsRes, adviceRes, usersRes] = await Promise.allSettled([
        api.get(`/analytics/faculty/stats?filter_type=${directoryScope}`),
        api.get('/analytics/cohort-skills'),
        api.get('/analytics/advisor-recommendations'),
        api.get(`/analytics/faculty/students?filter_type=${directoryScope}`)
      ])

      let studentsList = []
      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const raw = usersRes.value.data
        studentsList = raw.students || raw.users || []
        studentsList = studentsList.filter(u => u.role === 'student' || !u.role)
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data.stats || statsRes.value.data)
      } else {
        const total = studentsList.length
        const placed = studentsList.filter(s => s.placement_status === 'placed').length
        setStats({
          totalStudents: total,
          placedStudents: placed,
          resumesProcessed: 0,
          placementRate: total > 0 ? `${Math.round((placed / total) * 100)}%` : '0%',
          activeJobs: 0,
          hasAssignedMentees: false
        })
      }

      if (skillsRes.status === 'fulfilled' && skillsRes.value?.data) {
        setCohortSkills(skillsRes.value.data.top_skills || skillsRes.value.data.skills || [])
      }

      if (adviceRes.status === 'fulfilled' && adviceRes.value?.data) {
        setAdvisorInsight(adviceRes.value.data.advisor_advice || adviceRes.value.data)
      }

      setStudents(studentsList)
    } catch (err) {
      console.error('Error fetching faculty data:', err)
      toast.error('Failed to sync live faculty metrics')
    } finally {
      setLoading(false)
    }
  }

  const fetchIncomingRequests = async () => {
    try {
      const res = await api.get('/mentorship/incoming-requests')
      setIncomingRequests(res.data?.requests || [])
      setPendingRequestsCount(res.data?.pending_count || res.data?.requests?.filter(r => r.status === 'pending').length || 0)
    } catch (err) {
      console.error('Error fetching mentorship requests:', err)
    }
  }

  useEffect(() => {
    fetchFacultyData()
    fetchIncomingRequests()
  }, [directoryScope])

  // Automatically open student modal if selectedStudent is in query params
  useEffect(() => {
    const studentIdParam = searchParams.get('selectedStudent')
    if (studentIdParam && students.length > 0) {
      const studentId = parseInt(studentIdParam)
      const targetStudent = students.find(s => s.id === studentId)
      if (targetStudent) {
        handleOpenStudentModal(targetStudent)
      }
    }
  }, [searchParams, students])

  const handleRequestAction = async (requestId, action) => {
    try {
      setIsProcessingAction(requestId)
      await api.put(`/mentorship/requests/${requestId}/action`, { action })
      toast.success(`Mentorship request ${action === 'accept' ? 'accepted' : 'declined'}!`)
      fetchIncomingRequests()
      fetchFacultyData()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to process request')
    } finally {
      setIsProcessingAction(null)
    }
  }

  const handleRemoveMentee = async (student) => {
    if (!student) return
    const name = student.full_name || student.username || 'this student'
    const confirmed = window.confirm(
      `Are you sure you want to release ${name} from your assigned mentees?\n\nThis will free up your mentee capacity and allow the student to request a new faculty advisor.`
    )
    if (!confirmed) return

    try {
      setIsReleasingMentee(student.id)
      await api.delete(`/mentorship/faculty/mentees/${student.id}`)
      toast.success(`${name} released from assigned mentees`)
      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(null)
      }
      fetchFacultyData()
      fetchIncomingRequests()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to release mentee')
    } finally {
      setIsReleasingMentee(null)
    }
  }

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const name = (student.full_name || student.username || '').toLowerCase()
      const email = (student.email || '').toLowerCase()
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())

      const dept = student.department || 'General'
      const matchesDept = selectedDept === 'all' || dept.toLowerCase() === selectedDept.toLowerCase()

      const year = student.year_of_study ? String(student.year_of_study) : 'all'
      const matchesYear = selectedYear === 'all' || year === selectedYear

      return matchesSearch && matchesDept && matchesYear
    })
  }, [students, searchQuery, selectedDept, selectedYear])

  // Reset pagination when filter criteria change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedDept, selectedYear, directoryScope])

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredStudents.slice(start, start + pageSize)
  }, [filteredStudents, currentPage, pageSize])

  const departments = useMemo(() => {
    const depts = new Set(students.map(s => s.department || 'General').filter(Boolean))
    return Array.from(depts)
  }, [students])

  const handleOpenStudentModal = (student) => {
    setSelectedStudent(student)
    setPlacementForm({
      placement_status: student.placement_status || 'seeking',
      placed_company: student.placed_company || '',
      package_lpa: student.package_lpa ? String(student.package_lpa) : ''
    })
  }

  const handleSavePlacement = async (e) => {
    e.preventDefault()
    if (!selectedStudent) return
    try {
      setIsUpdatingPlacement(true)
      const payload = {
        placement_status: placementForm.placement_status,
        placed_company: placementForm.placed_company,
        package_lpa: placementForm.package_lpa ? parseFloat(placementForm.package_lpa) : null
      }
      const res = await api.put(`/analytics/student/${selectedStudent.id}/placement`, payload)
      toast.success('Placement status updated successfully!')

      const updated = res.data?.student || payload
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, ...updated } : s))
      setSelectedStudent(prev => ({ ...prev, ...updated }))
      fetchFacultyData()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update placement')
    } finally {
      setIsUpdatingPlacement(false)
    }
  }

  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.error('No students available to export')
      return
    }
    const headers = ['Full Name', 'Username', 'Email', 'Department', 'Year of Study', 'Placement Status', 'Placed Company', 'Package LPA']
    const rows = students.map(s => [
      `"${s.full_name || ''}"`,
      `"${s.username || ''}"`,
      `"${s.email || ''}"`,
      `"${s.department || 'General'}"`,
      `"${s.year_of_study || 'N/A'}"`,
      `"${s.placement_status || 'seeking'}"`,
      `"${s.placed_company || 'N/A'}"`,
      `"${s.package_lpa || 'N/A'}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `cohort_${directoryScope}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Student cohort CSV downloaded successfully!')
  }

  const facultyStatCards = [
    { name: directoryScope === 'mentees' ? 'My Assigned Mentees' : 'Total Department Students', value: `${stats.totalStudents || stats.total_students || 0}`, icon: UserGroupIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Verified Resumes', value: `${stats.resumesProcessed || stats.total_resumes || 0}`, icon: DocumentTextIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Placed Students', value: `${stats.placedStudents || stats.placed_count || 0}`, icon: AcademicCapIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Cohort Placement Rate', value: stats.placementRate || '0%', icon: ChartBarIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Faculty Welcome / Onboarding Actions Modal */}
      <WelcomeActionsModal />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
              Faculty Command Center
            </span>
            {pendingRequestsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                {pendingRequestsCount} Pending Requests
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1.5">
            Department & Cohort Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Real-time tracking of assigned mentees, resume evaluations, and placement outcomes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchFacultyData(); fetchIncomingRequests(); }}
            isLoading={loading}
            className="flex items-center"
          >
            <RefreshIcon className="h-4 w-4 mr-1.5" />
            Refresh Live Data
          </Button>
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white"
          >
            <DownloadIcon className="h-4 w-4 mr-1.5" />
            Export Cohort CSV
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-6">
        <button
          onClick={() => setSearchParams({ tab: 'overview' })}
          className={`pb-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ChartBarIcon className="h-4 w-4" />
          Overview & Metrics
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'requests' })}
          className={`pb-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <InboxInIcon className="h-4 w-4" />
          Mentorship Requests
          {pendingRequestsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-purple-600 text-white font-bold">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'students' })}
          className={`pb-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserGroupIcon className="h-4 w-4" />
          Student Directory ({students.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'analytics' })}
          className={`pb-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <SparklesIcon className="h-4 w-4" />
          Cohort Skill Gap Analytics
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Profile Readiness & Mentorship Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Completeness Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Profile Readiness</span>
                  <span className={`text-sm font-bold ${facultyProfilePercentage === 100 ? 'text-emerald-600' : 'text-purple-600'}`}>
                    {facultyProfilePercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${facultyProfilePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  {facultyProfilePercentage < 100
                    ? 'Complete department, institution, contact phone, and bio for verified student mentorship.'
                    : 'Your faculty advisor profile is fully configured!'}
                </p>
              </div>
              {facultyProfilePercentage < 100 && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    Complete Profile &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Academic Department & Advisor Overview Card */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <AcademicCapIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Faculty Advisor Status</h3>
                    <p className="text-xs text-gray-500">
                      {user?.department ? `${user.department} • ${user.college || 'Academic Institution'}` : 'Connect with students and guide campus placement drives'}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 self-start sm:self-auto">
                  {stats.totalStudents || 0} Students in Cohort
                </span>
              </div>

              <div className="bg-purple-50/50 rounded-xl p-3.5 border border-purple-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-purple-950">
                    {pendingRequestsCount > 0
                      ? `${pendingRequestsCount} new mentorship request(s) waiting for review`
                      : 'Department mentorship channel active'}
                  </p>
                  <p className="text-[11px] text-purple-700/80 mt-0.5">
                    {pendingRequestsCount > 0
                      ? 'Review incoming requests to accept students into your mentee cohort.'
                      : 'Guide student resumes, endorse top talent, and coordinate campus placement shortlists.'}
                  </p>
                </div>

                <button
                  onClick={() => setSearchParams({ tab: 'requests' })}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs shrink-0"
                >
                  {pendingRequestsCount > 0 ? 'Review Requests' : 'View Mentees'} &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {facultyStatCards.map((stat) => (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Insights Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Cohort Skill Readiness Breakdown</h2>
                  <p className="text-xs text-gray-500">Live technical competency distribution computed from verified resumes</p>
                </div>
                <button
                  onClick={() => setSearchParams({ tab: 'analytics' })}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                >
                  View Details &rarr;
                </button>
              </div>
              <div className="space-y-4">
                {cohortSkills.length > 0 ? (
                  cohortSkills.slice(0, 4).map((item) => (
                    <div key={item.skill} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-700">{item.skill}</span>
                        <span className={`font-semibold ${item.profCount > 0 ? 'text-purple-700' : 'text-gray-400'}`}>
                          {item.profCount}% Ready
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                        <div className={`h-full ${item.color}`} style={{ width: `${item.profCount}%` }} />
                        <div className="h-full bg-rose-200" style={{ width: `${item.gapCount}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400">
                    No verified resumes uploaded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-6 text-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-800 text-purple-200 mb-3">
                  <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                  Advisor Recommendation
                </div>
                <h3 className="text-lg font-bold">{advisorInsight.title || 'Curriculum Focus Needed'}</h3>
                <p className="text-sm text-purple-200 mt-2 leading-relaxed">
                  {advisorInsight.message}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-purple-800">
                <Button
                  onClick={() => setSearchParams({ tab: 'students' })}
                  className="w-full bg-white text-purple-900 hover:bg-purple-50 font-semibold text-sm"
                >
                  {advisorInsight.action_label || 'Inspect Student Cohort'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Incoming Mentorship Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Incoming Mentorship Requests</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Students requesting your mentorship for career advising, resume reviews, and placement guidance.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">
              {incomingRequests.length} Total Requests
            </span>
          </div>

          <div className="p-6">
            {incomingRequests.length > 0 ? (
              <div className="space-y-4">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50/70 hover:bg-purple-50/40 rounded-xl border border-gray-100 transition-colors gap-4"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 text-white font-bold flex items-center justify-center shadow-sm shrink-0">
                        {req.student?.full_name?.[0] || req.student?.username?.[0] || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-base">{req.student?.full_name || req.student?.username}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                            {req.student?.department || 'General'}
                          </span>
                          {req.student?.year_of_study && (
                            <span className="text-xs text-gray-500 font-medium">
                              Year {req.student.year_of_study}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{req.student?.email}</p>

                        {req.message && (
                          <div className="mt-2.5 p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 max-w-xl">
                            <span className="font-semibold text-gray-900 block mb-0.5">Student Note:</span>
                            "{req.message}"
                          </div>
                        )}
                        <p className="text-[11px] text-gray-400 mt-2">
                          Requested on {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <Button
                            size="sm"
                            isLoading={isProcessingAction === req.id}
                            onClick={() => handleRequestAction(req.id, 'accept')}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Accept Mentee
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={isProcessingAction === req.id}
                            onClick={() => handleRequestAction(req.id, 'reject')}
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold flex items-center"
                          >
                            <BanIcon className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          req.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {req.status === 'accepted' ? 'Accepted Mentee' : 'Declined'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500 text-sm">
                <InboxInIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                No incoming mentorship requests at the moment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Student Directory */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Student Cohort Directory</h3>
              <p className="text-xs text-gray-500">Filter between your personal assigned mentees and the department-wide roster.</p>
            </div>

            <div className="inline-flex rounded-xl bg-gray-100 p-1 self-start sm:self-auto border border-gray-200">
              <button
                onClick={() => setDirectoryScope('mentees')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  directoryScope === 'mentees'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Assigned Mentees
              </button>
              <button
                onClick={() => setDirectoryScope('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  directoryScope === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Department Students
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50/50">
            <div className="relative w-full sm:w-80">
              <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Academic Year</th>
                    <th className="px-6 py-3.5">Placement Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedStudents.map((student, idx) => (
                    <tr key={student.id || idx} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                            {student.full_name?.[0] || student.username?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.full_name || student.username}</p>
                            <p className="text-xs text-gray-400">@{student.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{student.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{student.department || 'General'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {student.year_of_study ? `Year ${student.year_of_study}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.placement_status === 'placed'
                            ? 'bg-green-100 text-green-800'
                            : student.placement_status === 'higher_studies'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {student.placement_status === 'placed' ? (
                            <>
                              <BadgeCheckIcon className="h-3.5 w-3.5 mr-1 text-green-600" />
                              Placed {student.placed_company ? `(${student.placed_company})` : ''}
                            </>
                          ) : student.placement_status === 'higher_studies' ? (
                            'Higher Studies'
                          ) : (
                            'Seeking Placement'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStudentModal(student)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View / Edit
                          </Button>

                          {directoryScope === 'mentees' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMentee(student)}
                              isLoading={isReleasingMentee === student.id}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Release Mentee"
                            >
                              <UserRemoveIcon className="h-4 w-4 mr-1" />
                              Release
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Client-side Pagination Controls */}
              {filteredStudents.length > pageSize && (
                <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-semibold text-gray-800">{Math.min(currentPage * pageSize, filteredStudents.length)}</span> of{' '}
                    <span className="font-semibold text-gray-800">{filteredStudents.length}</span> students
                  </p>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                          currentPage === pg
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 text-sm">
              {directoryScope === 'mentees' ? (
                <div className="space-y-3">
                  <UserAddIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="font-semibold text-gray-700">No assigned mentees found yet.</p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Students can request you as their advisor from their dashboard, or you can switch to "All Department Students" to view all registered students.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDirectoryScope('all')}
                    className="mt-2 text-xs"
                  >
                    View All Department Students
                  </Button>
                </div>
              ) : (
                'No matching students found for the current search filter.'
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Cohort Skill Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Live Cohort Skill Deficit Analysis</h2>
                <p className="text-sm text-gray-500">
                  Aggregated insights comparing student technical competencies against live industry requirements.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFacultyData}
                className="text-xs"
              >
                <RefreshIcon className="h-3.5 w-3.5 mr-1" />
                Recalculate
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cohortSkills.map((item) => (
                <div key={item.skill} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900 text-sm">{item.skill}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-800">
                      {item.profCount}% Proficient
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.profCount}%` }} />
                    <div className="h-full bg-rose-300" style={{ width: `${item.gapCount}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                      Ready: {item.profCount}%
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                      Gap to Close: {item.gapCount}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Campus Drives & Confirmed Attendees */}
      {activeTab === 'drives' && (
        <CampusDrives
          onNavigateToShortlist={() => setSearchParams({ tab: 'shortlist' })}
        />
      )}

      {/* Tab 6: Placement Shortlist & Bundle Export */}
      {activeTab === 'shortlist' && (
        <PlacementShortlist
          departments={departments}
          initialScope={directoryScope}
          onNavigateToDrives={() => setSearchParams({ tab: 'drives' })}
        />
      )}

      {/* Student Detail & Placement Update Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center">
                  {selectedStudent.full_name?.[0] || selectedStudent.username?.[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedStudent.full_name || selectedStudent.username}</h3>
                  <p className="text-xs text-gray-500">Student Placement & Academic Record</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 block">Username</span>
                <span className="font-semibold text-gray-900">@{selectedStudent.username}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 block">Email Address</span>
                <span className="font-semibold text-gray-900 truncate block">{selectedStudent.email}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 block">Department</span>
                <span className="font-semibold text-gray-900">{selectedStudent.department || 'General'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 block">Year of Study</span>
                <span className="font-semibold text-gray-900">
                  {selectedStudent.year_of_study ? `Year ${selectedStudent.year_of_study}` : 'Not Specified'}
                </span>
              </div>
            </div>

            {/* Resume Access / Preview */}
            <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    {selectedStudent.has_resume ? 'Verified Student Resume' : 'Resume Status'}
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    {selectedStudent.has_resume ? 'AI skill verified & parsed' : 'No verified resume PDF uploaded yet'}
                  </span>
                </div>
              </div>
              {selectedStudent.has_resume && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      toast.loading('Fetching student resume...', { id: 'modal-resume-dl' })
                      const res = await api.post('/analytics/placement/export-bundle', {
                        student_ids: [selectedStudent.id]
                      }, {
                        responseType: 'blob'
                      })
                      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }))
                      const link = document.createElement('a')
                      link.href = blobUrl
                      link.setAttribute('download', `${selectedStudent.username || 'student'}_resume_bundle.zip`)
                      document.body.appendChild(link)
                      link.click()
                      link.remove()
                      window.URL.revokeObjectURL(blobUrl)
                      toast.success('Resume bundle ready!', { id: 'modal-resume-dl' })
                    } catch (err) {
                      toast.error('Resume bundle unavailable for export', { id: 'modal-resume-dl' })
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  Download Resume
                </button>
              )}
            </div>

            {/* Student's Target Companies & Job Applications */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BriefcaseIcon className="h-4 w-4 text-purple-600" />
                  Target Companies & Saved Jobs ({selectedStudent.job_interests?.length || 0})
                </h4>
                {selectedStudent.job_interests?.length > 0 && (
                  <span className="text-[11px] text-gray-500">Live Student Pipeline</span>
                )}
              </div>

              {selectedStudent.job_interests && selectedStudent.job_interests.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedStudent.job_interests.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-white rounded-lg border border-gray-200/80 shadow-xs flex items-center justify-between text-xs hover:border-purple-200 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-gray-900 truncate">{item.company}</p>
                        <p className="text-gray-500 text-[11px] truncate">{item.job_title}</p>
                        {item.notes && (
                          <p className="text-gray-400 text-[10px] italic mt-0.5 truncate">"{item.notes}"</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'offer'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'interviewing'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'applied'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status || 'Interested'}
                        </span>
                        {item.job_id && (
                          <a
                            href={`/jobs/${item.job_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                            title="View Job Details"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic bg-white p-3 rounded-lg border border-dashed border-gray-200 text-center">
                  This mentee has not marked interest in any company roles or campus jobs yet.
                </p>
              )}
            </div>

            <form onSubmit={handleSavePlacement} className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 space-y-3">
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Manage Placement Status
              </h4>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Status</label>
                <select
                  value={placementForm.placement_status}
                  onChange={(e) => setPlacementForm({ ...placementForm, placement_status: e.target.value })}
                  className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="seeking">Seeking Placement (Unplaced)</option>
                  <option value="placed">Placed (Offer Received)</option>
                  <option value="higher_studies">Higher Studies</option>
                  <option value="opted_out">Opted Out</option>
                </select>
              </div>

              {placementForm.placement_status === 'placed' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Microsoft"
                      value={placementForm.placed_company}
                      onChange={(e) => setPlacementForm({ ...placementForm, placed_company: e.target.value })}
                      className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Package (LPA)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 14.5"
                      value={placementForm.package_lpa}
                      onChange={(e) => setPlacementForm({ ...placementForm, package_lpa: e.target.value })}
                      className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isUpdatingPlacement}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Save Placement Details
                </Button>
              </div>
            </form>

            <div className="pt-1 flex items-center justify-between">
              {directoryScope === 'mentees' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMentee(selectedStudent)}
                  isLoading={isReleasingMentee === selectedStudent?.id}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs"
                >
                  <UserRemoveIcon className="h-3.5 w-3.5 mr-1" />
                  Release Mentee
                </Button>
              ) : (
                <div />
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default FacultyDashboard