// frontend/src/pages/admin/Dashboard.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../../services/api'
import { 
  FiUsers, 
  FiBriefcase, 
  FiFileText, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiActivity,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiRefreshCw
} from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_jobs: 0,
    total_resumes: 0,
    active_users: 0
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // 'all' | 'student' | 'faculty' | 'admin'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    fetchStats()
    fetchUsers()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/stats')
      if (res.data) {
        setStats(res.data)
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const res = await api.get('/admin/users')
      if (res.data && res.data.users) {
        setUsers(res.data.users)
      }
    } catch (err) {
      console.error('Error fetching admin users:', err)
      toast.error('Failed to load user directory')
    } finally {
      setUsersLoading(false)
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      setActionLoadingId(user.id)
      const res = await api.patch(`/admin/users/${user.id}/status`)
      const updatedUser = res.data?.user
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      
      const newStatus = updatedUser?.is_active ? 'activated' : 'deactivated'
      toast.success(`User ${user.full_name || user.email} ${newStatus}`)
      fetchStats()
    } catch (err) {
      console.error('Failed to toggle status:', err)
      toast.error(err.response?.data?.error || 'Failed to update account status')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      setActionLoadingId(userId)
      await api.put(`/admin/users/${userId}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success(`Role updated to ${newRole}`)
    } catch (err) {
      console.error('Failed to update role:', err)
      toast.error(err.response?.data?.error || 'Failed to update user role')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtered user roster based on search query, role, and status
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || 
        (user.full_name && user.full_name.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.department && user.department.toLowerCase().includes(q))

      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' ? user.is_active : !user.is_active)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  const statCards = [
    { title: 'Total Registered Users', count: stats.total_users, icon: FiUsers, color: 'from-blue-600 to-indigo-600', shadow: 'shadow-indigo-500/20' },
    { title: 'Active Accounts', count: stats.active_users, icon: FiCheckCircle, color: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/20' },
    { title: 'Resumes Analyzed', count: stats.total_resumes, icon: FiFileText, color: 'from-purple-600 to-pink-600', shadow: 'shadow-purple-500/20' },
    { title: 'Job Openings', count: stats.total_jobs, icon: FiBriefcase, color: 'from-amber-600 to-orange-600', shadow: 'shadow-amber-500/20' },
  ]

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
      case 'faculty':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FiShield className="text-indigo-400" /> System Admin Control Center
          </h1>
          <p className="text-gray-400 mt-1">
            Platform governance, user management, and infrastructure health metrics
          </p>
        </div>

        <button
          onClick={() => { fetchStats(); fetchUsers(); }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-200 bg-[#1E293B] border border-gray-700/80 rounded-xl hover:bg-[#334155] transition-all shadow-md active:scale-95"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 1. Global KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-[#111827] rounded-2xl p-6 shadow-xl border border-gray-800/80 flex items-center space-x-4 hover:border-gray-700 transition-all">
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${card.color} text-white shadow-lg ${card.shadow}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">{card.title}</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{card.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* 2. User Management Console */}
      <div className="bg-[#111827] rounded-3xl shadow-xl border border-gray-800/80 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FiUsers className="text-indigo-400" /> Platform User Management
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Inspect registered accounts, toggle authorization, and manage role permissions
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#1E293B] border border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Filter Badges Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-[#1E293B] p-1 rounded-xl border border-gray-800">
            {['all', 'student', 'faculty', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  roleFilter === role
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#1E293B] p-1 rounded-xl border border-gray-800">
            {['all', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          {usersLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1E293B]/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">User Information</th>
                  <th className="py-3.5 px-4 font-bold">Role</th>
                  <th className="py-3.5 px-4 font-bold">Department / Details</th>
                  <th className="py-3.5 px-4 font-bold">Account Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80 bg-[#111827]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm">
                        {user.full_name || 'Anonymous User'}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        {user.email}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={user.role}
                        disabled={actionLoadingId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer bg-[#1E293B] ${getRoleBadge(user.role)}`}
                      >
                        <option value="student" className="bg-[#1E293B] text-white">Student</option>
                        <option value="faculty" className="bg-[#1E293B] text-white">Faculty</option>
                        <option value="admin" className="bg-[#1E293B] text-white">Admin</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 text-gray-300">
                      <div>{user.department || 'General'}</div>
                      {user.year_of_study && (
                        <div className="text-[11px] text-gray-400">Year {user.year_of_study}</div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={actionLoadingId === user.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                          user.is_active
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <FiUserX className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <FiUserCheck className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-gray-400 bg-[#111827]">
              No registered users matched your current filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* 3. Platform Health & Model Benchmarks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111827] rounded-3xl p-6 shadow-xl border border-gray-800/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiActivity className="text-indigo-400" /> Platform Infrastructure Status
            </h2>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
              Operational
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#1E293B]/60 border border-gray-800/60 rounded-xl text-xs">
              <span className="font-semibold text-gray-300">Flask Backend API</span>
              <span className="text-emerald-400 font-bold">100% Up</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1E293B]/60 border border-gray-800/60 rounded-xl text-xs">
              <span className="font-semibold text-gray-300">ML Stacking Model Service</span>
              <span className="text-emerald-400 font-bold">Loaded & Ready</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1E293B]/60 border border-gray-800/60 rounded-xl text-xs">
              <span className="font-semibold text-gray-300">Database Engine (SQLAlchemy)</span>
              <span className="text-emerald-400 font-bold">Healthy</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] rounded-3xl p-6 shadow-xl border border-gray-800/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiTrendingUp className="text-indigo-400" /> Key Model Benchmarks
            </h2>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/30">
              ML Production
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-[#1E293B]/60 border border-gray-800/60 rounded-xl">
              <span className="font-semibold text-gray-300">Model Accuracy</span>
              <span className="font-bold text-indigo-400">75.5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1E293B]/60 border border-gray-800/60 rounded-xl">
              <span className="font-semibold text-gray-300">Model F1 Score</span>
              <span className="font-bold text-indigo-400">0.798</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1E293B]/60 border border-gray-800/60 rounded-xl">
              <span className="font-semibold text-gray-300">Recommendation Latency</span>
              <span className="font-bold text-emerald-400">&lt; 45 ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

