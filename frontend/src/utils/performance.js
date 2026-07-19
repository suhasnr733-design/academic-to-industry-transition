// src/utils/performance.js

import { lazy } from 'react'

// Lazy load components
export const lazyLoad = (importFn) => {
  return lazy(() => importFn())
}

// Memoization helper
export const memoize = (fn) => {
  const cache = {}
  return (...args) => {
    const key = JSON.stringify(args)
    if (cache[key] === undefined) {
      cache[key] = fn(...args)
    }
    return cache[key]
  }
}

// Debounce function
export const debounce = (fn, delay = 300) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Throttle function
export const throttle = (fn, limit = 300) => {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Image optimization
export const optimizeImage = (src, width = 300, height = 300) => {
  return `${src}?w=${width}&h=${height}&fit=crop&auto=format&q=80`
}