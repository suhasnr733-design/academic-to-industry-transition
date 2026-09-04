// frontend/src/components/common/DataExport.jsx

import React, { useState } from 'react'
import { Button } from './Button'
import { 
  DownloadIcon, 
  DocumentIcon, 
  TableIcon,
  ChartBarIcon,
  XIcon
} from '@heroicons/react/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export const DataExport = ({ data, filename = 'export', formats = ['csv', 'json', 'pdf'] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const exportData = async (format) => {
    setIsExporting(true)
    try {
      let content = ''
      let mimeType = ''
      let extension = ''

      switch (format) {
        case 'csv':
          content = convertToCSV(data)
          mimeType = 'text/csv'
          extension = 'csv'
          break
        case 'json':
          content = JSON.stringify(data, null, 2)
          mimeType = 'application/json'
          extension = 'json'
          break
        case 'pdf':
          // Use pdf generation library
          content = await generatePDF(data)
          mimeType = 'application/pdf'
          extension = 'pdf'
          break
        default:
          throw new Error('Unsupported format')
      }

      // Download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported successfully as ${format.toUpperCase()}`)
      setIsOpen(false)
    } catch (error) {
      toast.error(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const rows = data.map(item => headers.map(h => JSON.stringify(item[h] || '')))
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const generatePDF = async (data) => {
    // Simple PDF generation (placeholder)
    return `PDF Export: ${JSON.stringify(data, null, 2)}`
  }

  const exportOptions = [
    { format: 'csv', icon: TableIcon, label: 'CSV' },
    { format: 'json', icon: DocumentIcon, label: 'JSON' },
    { format: 'pdf', icon: ChartBarIcon, label: 'PDF' }
  ]

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={!data || data.length === 0}
      >
        <DownloadIcon className="h-5 w-5 mr-2" />
        Export
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute right-0 mt-2 w-56 bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl z-50 py-2"
            >
              <div className="px-4 py-2 border-b border-gray-800">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Export Format</p>
              </div>
              
              {exportOptions
                .filter(opt => formats.includes(opt.format))
                .map(({ format, icon: Icon, label }) => (
                  <button
                    key={format}
                    onClick={() => exportData(format)}
                    disabled={isExporting}
                    className="w-full flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-[#1E293B] hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Icon className="h-4 w-4 mr-3 text-indigo-400" />
                    {label}
                    {isExporting && (
                      <span className="ml-auto">
                        <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </span>
                    )}
                  </button>
                ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}