// src/pages/faculty/Dashboard.jsx

import React from 'react'
import { Heading } from '../../components/common/Typography'
import { Button } from '../../components/common/Button'
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentIcon,
  DownloadIcon
} from '@heroicons/react/outline'

const facultyStats = [
  { name: 'Total Students', value: '156', icon: UserGroupIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Placed Students', value: '89', icon: ChartBarIcon, color: 'text-green-600', bg: 'bg-green-50' },
  { name: 'Placement Rate', value: '57%', icon: AcademicCapIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
  { name: 'Resumes Processed', value: '234', icon: DocumentIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
]

const recentStudents = [
  { name: 'Priya Sharma', department: 'CS', year: 4, skills: ['Python', 'SQL', 'React'], status: 'High' },
  { name: 'Rahul Verma', department: 'IS', year: 3, skills: ['Java', 'Spring', 'AWS'], status: 'Medium' },
  { name: 'Ananya Reddy', department: 'CS', year: 4, skills: ['Python', 'ML', 'Docker'], status: 'High' },
  { name: 'Vikram Singh', department: 'ECE', year: 3, skills: ['C++', 'MATLAB', 'Arduino'], status: 'Low' },
]

export const FacultyDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor student progress and placement readiness</p>
        </div>
        <Button>
          <DownloadIcon className="h-5 w-5 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {facultyStats.map((stat) => (
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Placement</h3>
          <div className="space-y-3">
            {['Computer Science', 'Information Science', 'Electronics', 'Mechanical', 'Civil'].map((dept) => (
              <div key={dept}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{dept}</span>
                  <span className="text-gray-900 font-medium">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Employability Score Distribution</span>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs text-gray-500">Low</span>
                <div className="flex-1 flex h-4 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full" style={{ width: '20%' }} />
                  <div className="bg-yellow-500 h-full" style={{ width: '40%' }} />
                  <div className="bg-green-500 h-full" style={{ width: '40%' }} />
                </div>
                <span className="text-xs text-gray-500">High</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>20%</span>
                <span>40%</span>
                <span>40%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Students</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentStudents.map((student, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Year {student.year}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {student.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                      {student.skills.length > 3 && (
                        <span className="text-xs text-gray-500">+{student.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === 'High' ? 'bg-green-100 text-green-800' :
                      student.status === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}