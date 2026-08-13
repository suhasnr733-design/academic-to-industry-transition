// frontend/src/components/layout/Footer.jsx

import React from 'react'

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Academic-to-Industry Transition System. Intelligent Career & Skill Matching Platform.</p>
      </div>
    </footer>
  )
}

export default Footer
