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
        <div className="max-w-md mx-auto bg-[#111827] rounded-3xl shadow-2xl p-6 border border-gray-800/90 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25">
                  AI
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Install App</h3>
                  <p className="text-xs text-gray-400">Get an ultra-fast desktop experience</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-gray-300 font-medium">
                <li>✅ Works offline with persistent cache</li>
                <li>✅ Faster rendering and low latency</li>
                <li>✅ Instant desktop & mobile launch</li>
              </ul>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-5 flex space-x-3">
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl transition-all font-bold text-xs flex items-center justify-center shadow-lg shadow-indigo-500/25"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Install Application
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] border border-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors font-semibold text-xs"
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}