// frontend/src/components/common/InstallPWA.jsx

import React, { useState, useEffect } from 'react'
import { XIcon } from '@heroicons/react/outline'

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      console.log(`User ${result.outcome}`)
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  const handleDismiss = () => {
    setShowInstall(false)
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white shadow-lg border-t border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            AI
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Install App</h3>
            <p className="text-sm text-gray-500">Get the best experience with our app</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}