// frontend/src/utils/performance.js

export const trackPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Get navigation timing
    const perfData = performance.getEntriesByType('navigation')[0]
    
    const metrics = {
      // Page load time
      loadTime: perfData.loadEventEnd - perfData.startTime,
      
      // DOM ready time
      domReady: perfData.domContentLoadedEventEnd - perfData.startTime,
      
      // First paint
      firstPaint: performance.getEntriesByType('paint')
        .find(entry => entry.name === 'first-paint')?.startTime || 0,
      
      // First contentful paint
      firstContentfulPaint: performance.getEntriesByType('paint')
        .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      
      // Time to interactive
      tti: perfData.domInteractive - perfData.startTime,
      
      // Total blocking time
      // (Calculate using Long Tasks API)
      totalBlockingTime: 0
    }
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('🚀 Performance Metrics:', metrics)
    }
    
    // Send to analytics if in production
    if (import.meta.env.PROD) {
      sendMetricsToAnalytics(metrics)
    }
    
    return metrics
  }
}

const sendMetricsToAnalytics = (metrics) => {
  // Send metrics to backend for monitoring
  try {
    fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    })
  } catch (error) {
    console.error('Failed to send metrics:', error)
  }
}

// Measure component render time
export const measureRender = (componentName) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args) {
      const start = performance.now()
      const result = originalMethod.apply(this, args)
      const end = performance.now()
      
      console.log(`⏱️ ${componentName}.${propertyKey} took ${(end - start).toFixed(2)}ms`)
      
      return result
    }
    
    return descriptor
  }
}

// Debounce for performance
export const debounce = (fn, delay = 300) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Throttle for performance
export const throttle = (fn, limit = 300) => {
  let inThrottle = false
  return (...args) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memoization
export const memoize = (fn) => {
  const cache = new Map()
  return (...args) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}