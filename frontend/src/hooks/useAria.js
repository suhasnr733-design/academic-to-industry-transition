// frontend/src/hooks/useAria.js

import React from 'react'

export const useAria = () => {
  const getAriaProps = (props = {}) => {
    const ariaProps = {}
    const ariaAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby',
      'aria-required', 'aria-invalid', 'aria-valuenow',
      'aria-valuemin', 'aria-valuemax', 'aria-expanded',
      'aria-controls', 'aria-haspopup', 'aria-hidden',
      'aria-live', 'aria-atomic', 'aria-relevant', 'aria-disabled'
    ]
    
    ariaAttributes.forEach(attr => {
      if (props[attr] !== undefined) {
        ariaProps[attr] = props[attr]
      }
    })
    
    return ariaProps
  }
  
  return { getAriaProps }
}

export const ScreenReaderOnly = ({ children }) => {
  return <span className="sr-only">{children}</span>
}

export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:p-4 focus:rounded-lg focus:shadow-lg focus:text-primary-600"
    >
      Skip to main content
    </a>
  )
}

export const LiveRegion = ({ children, polite = true }) => {
  return (
    <div 
      aria-live={polite ? 'polite' : 'assertive'}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  )
}

export default useAria
