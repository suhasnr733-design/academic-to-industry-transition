// frontend/src/components/layout/Footer.jsx

import React from 'react'

export const Footer = () => {
  return (
    <footer className="bg-[#111827]/80 backdrop-blur border-t border-gray-800/80 py-4 relative z-10">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} TransitionAI. Intelligent Academic-to-Industry Platform.</p>
        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Operational • 2026 Edition</span>
        </p>
      </div>
    </footer>
  )
}

export default Footer
