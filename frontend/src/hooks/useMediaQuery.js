// frontend/src/hooks/useMediaQuery.js

import { useState, useEffect } from 'react'

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(query).matches
    }
    return false
  })
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    
    const media = window.matchMedia(query)
    setMatches(media.matches)
    
    const listener = (e) => setMatches(e.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [query])
  
  return matches
}

export const useBreakpoints = () => {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  
  return { isMobile, isTablet, isDesktop }
}

export default useMediaQuery
