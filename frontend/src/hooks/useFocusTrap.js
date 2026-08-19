// frontend/src/hooks/useFocusTrap.js

import { useEffect, useRef } from 'react'

export const useFocusTrap = (isActive = true) => {
  const elementRef = useRef(null)
  
  useEffect(() => {
    if (!isActive || !elementRef.current) return
    
    const focusableElements = elementRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
      
      if (e.key === 'Escape') {
        // Allow escape handlers if needed
      }
    }
    
    // Focus first element on activation
    firstElement.focus()
    
    const currentRef = elementRef.current
    currentRef.addEventListener('keydown', handleKeyDown)
    
    return () => {
      currentRef?.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive])
  
  return elementRef
}

export default useFocusTrap
