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

export const SkipLink = ({ targetId = 'main-content', text = 'Skip to main content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-primary-600 focus:p-4 focus:rounded-lg focus:shadow-xl focus:ring-2 focus:ring-primary-500"
    >
      {text}
    </a>
  )
}

export default useAria
