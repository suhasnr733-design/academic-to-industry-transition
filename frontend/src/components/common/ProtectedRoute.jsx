// frontend/src/components/common/ProtectedRoute.jsx

import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export const AdminRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    )
  }

  const isAdmin = user?.role === 'admin' || user?.email === 'admin'
  return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export const FacultyRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    )
  }

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin'

  if (!isAuthenticated) {
    return <Navigate to="/faculty/login" replace />
  }

  if (!isFaculty) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}