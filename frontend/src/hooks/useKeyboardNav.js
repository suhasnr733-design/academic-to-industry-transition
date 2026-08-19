// frontend/src/hooks/useKeyboardNav.js

import { useState, useEffect } from 'react'

export const useKeyboardNav = ({ onEscape, onEnter, onArrow, onSpace } = {}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onEscape?.()
          break
        case 'Enter':
          onEnter?.()
          break
        case 'ArrowDown':
        case 'ArrowUp':
          onArrow?.(e)
          break
        case ' ':
          onSpace?.(e)
          break
        default:
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onEscape, onEnter, onArrow, onSpace])
}

export const useRovingIndex = (itemCount, initialIndex = 0) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  
  const getNextIndex = (direction) => {
    if (direction === 'next') {
      return (currentIndex + 1) % itemCount
    }
    return (currentIndex - 1 + itemCount) % itemCount
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCurrentIndex(getNextIndex('next'))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCurrentIndex(getNextIndex('prev'))
    }
  }
  
  return { currentIndex, setCurrentIndex, handleKeyDown }
}

export default useKeyboardNav
