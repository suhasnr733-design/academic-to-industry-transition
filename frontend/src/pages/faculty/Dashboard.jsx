// src/pages/faculty/Dashboard.jsx

import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Button } from '../../components/common/Button'
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentIcon,
  DownloadIcon
} from '@heroicons/react/outline'

export const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    resumesProcessed: 0,
    placementRate: '0%'
  })
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFacultyData()
  }, [])

  const fetchFacultyData = async () => {
    try {
      setLoading(true)
      const [analyticsRes, usersRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/admin/users')
      ])

      let totalStudents = 0
      let resumesProcessed = 0

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data) {
        const data = analyticsRes.value.data
        totalStudents = data.users?.students || data.users?.total || 0
        resumesProcessed = data.resumes?.processed || data.resumes?.total || 0
      }

      let studentsList = []
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.users) {
        studentsList = usersRes.value.data.users.filter(u => u.role === 'student' || !u.role)
        if (totalStudents === 0) totalStudents = studentsList.length
      }

      setStats({
        totalStudents,
        placedStudents: 0,
        resumesProcessed,
        placementRate: totalStudents > 0 ? `${Math.round((0 / totalStudents) * 100)}%` : '0%'
      })
      setStudents(studentsList)
    } catch (err) {
      console.error('Error fetching faculty data:', err)
    } finally {
      setLoading(false)
    }
  }

  const facultyStatCards = [
    { name: 'Total Students', value: `${stats.totalStudents}`, icon: UserGroupIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Placed Students', value: `${stats.placedStudents}`, icon: ChartBarIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Placement Rate', value: stats.placementRate, icon: AcademicCapIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Resumes Processed', value: `${stats.resumesProcessed}`, icon: DocumentIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor student progress and placement readiness</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {facultyStatCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Registered Students ({students.length})</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.full_name || student.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.department || 'General'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.year_of_study ? `Year ${student.year_of_study}` : 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{student.role || 'student'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 text-sm">
            No registered students found yet.
          </div>
        )}
      </div>
    </div>
  )
}

export default FacultyDashboard