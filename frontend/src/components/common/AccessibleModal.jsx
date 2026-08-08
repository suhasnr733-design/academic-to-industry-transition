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
        className="min-h-screen px-4 text-center"
        onClick={handleOverlayClick}
      >
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          aria-hidden="true"
        />

        <div 
          ref={modalRef}
          className={`inline-block w-full ${sizeClasses[size]} align-middle bg-white rounded-2xl shadow-xl transform transition-all my-8 p-6 relative`}
          role="document"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}