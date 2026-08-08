// frontend/src/utils/accessibility.js

export const focusTrap = (element, options = {}) => {
  const { onEscape, onTab } = options
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && onEscape) {
      onEscape()
      return
    }
    
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable.focus()
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable.focus()
      }
    }
  }
  
  element.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

// Skip to main content
export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:p-4 focus:rounded-lg focus:shadow-lg focus:text-primary-600"
    >
      Skip to main content
    </a>
  )
}

// ARIA live announcements
export const announce = (message, polite = true) => {
  const announcer = document.getElementById('a11y-announcer')
  if (announcer) {
    announcer.setAttribute('aria-live', polite ? 'polite' : 'assertive')
    announcer.textContent = message
  }
}

// Focus management
export const setFocus = (element, options = {}) => {
  if (!element) return
  
  const { preventScroll = false } = options
  
  // Ensure element is focusable
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1')
  }
  
  // Focus the element
  element.focus({ preventScroll })
  
  // Scroll into view if needed
  if (!preventScroll) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}