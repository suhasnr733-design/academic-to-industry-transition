// frontend/src/components/common/DataTable.jsx

import React, { useState, useMemo } from 'react'
import { ChevronUpIcon, ChevronDownIcon, SearchIcon } from '@heroicons/react/outline'

export const DataTable = ({
  columns,
  data,
  onRowClick,
  searchable = true,
  pagination = true,
  pageSize = 10,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return data || []
    
    return (data || []).filter(row => {
      return columns.some(column => {
        const value = row[column.accessor]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(searchTerm.toLowerCase())
      })
    })
  }, [data, searchTerm, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      return sortDirection === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }, [filteredData, sortField, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData
    
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return sortedData.slice(start, end)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (accessor) => {
    if (sortField === accessor) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(accessor)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (accessor) => {
    if (sortField !== accessor) return null
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-indigo-400" />
      : <ChevronDownIcon className="h-4 w-4 text-indigo-400" />
  }

  return (
    <div className={`bg-[#111827] border border-gray-800/80 rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="p-4 border-b border-gray-800 bg-[#0F172A]/50">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1E293B] border border-gray-700/70 rounded-xl text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0F172A] border-b border-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  onClick={() => column.sortable !== false && handleSort(column.accessor)}
                  className={`px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:text-indigo-400' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{column.header}</span>
                    {getSortIcon(column.accessor)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-indigo-950/20' : 'hover:bg-white/[0.02]'} transition-colors`}
                >
                  {columns.map((column) => (
                    <td key={column.accessor} className="px-6 py-4 text-sm text-gray-200">
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-800 bg-[#0F172A]/40 flex items-center justify-between text-xs text-gray-400">
          <div>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-[#1E293B] border border-gray-700/80 rounded-lg text-xs font-medium text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-[#1E293B] border border-gray-700/80 rounded-lg text-xs font-medium text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}