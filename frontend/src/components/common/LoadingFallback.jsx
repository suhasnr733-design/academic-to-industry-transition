// frontend/src/components/common/LoadingFallback.jsx

import React from 'react'

export const LoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-indigo-500/20 border-t-indigo-500" />
          <div className="absolute w-4 h-4 rounded-full bg-indigo-500/30 blur-sm animate-pulse" />
        </div>
        <p className="mt-4 text-gray-400 font-semibold text-xs tracking-wider uppercase">Loading TransitionAI...</p>
      </div>
    </div>
  )
}