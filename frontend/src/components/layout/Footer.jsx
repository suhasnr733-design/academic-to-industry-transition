// frontend/src/components/layout/Footer.jsx

import React from 'react'

export const Footer = () => {
  return (
    <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-t border-gray-200/70 dark:border-gray-700/70 py-3.5 sm:py-4 relative z-10">
      <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Academic-to-Industry Transition System. Intelligent Career & Skill Matching Platform.</p>
      </div>
    </footer>
  )
}

export default Footer
