// frontend/src/components/common/AccessibleModal.jsx

import React, { useEffect, useRef } from 'react'
import { focusTrap } from '../../utils/accessibility'
import { XIcon } from '@heroicons/react/outline'

export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true
}) => {
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // Focus trap
    const cleanup = focusTrap(modalRef.current, {
      onEscape: onClose
    })

    // Focus first focusable element
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      cleanup()
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="min-h-screen px-4 text-center flex items-center justify-center"
        onClick={handleOverlayClick}
      >
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        <div 
          ref={modalRef}
          className={`inline-block w-full ${sizeClasses[size]} align-middle bg-[#111827] border border-gray-800/80 rounded-2xl shadow-2xl shadow-indigo-950/40 transform transition-all my-8 p-6 relative text-left`}
          role="document"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
            <h2 id="modal-title" className="text-lg font-semibold text-white tracking-tight">
              {title}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-2 text-gray-300 text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}