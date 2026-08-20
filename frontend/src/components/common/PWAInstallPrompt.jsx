// frontend/src/components/common/PWAInstallPrompt.jsx

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, DownloadIcon } from '@heroicons/react/outline'

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // App installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      
      if (result.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setShowPrompt(false)
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  if (isInstalled || !showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  AI
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Install App</h3>
                  <p className="text-sm text-gray-500">Get faster experience</p>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>✅ Works offline</li>
                <li>✅ Faster loading</li>
                <li>✅ Push notifications</li>
              </ul>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center"
            >
              <DownloadIcon className="h-5 w-5 mr-2" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}