// frontend/src/hooks/useKeyboardNav.js

import { useEffect } from 'react'

export const useKeyboardNav = (handlers = {}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { key, target } = e
      
      // Arrow keys for navigation
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault()
        const current = target
        const next = key === 'ArrowDown' 
          ? current.nextElementSibling 
          : current.previousElementSibling
        
        if (next && next.focus) {
          next.focus()
        }
      }
      
      // Enter to click
      if (key === 'Enter' && target?.click) {
        target.click()
      }
      
      // Escape to close
      if (key === 'Escape' && handlers?.onEscape) {
        handlers.onEscape()
      }
      
      // Space to toggle
      if (key === ' ' && handlers?.onSpace) {
        e.preventDefault()
        handlers.onSpace()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers])
}

export default useKeyboardNav
