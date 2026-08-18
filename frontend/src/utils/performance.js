// frontend/src/utils/performance.js

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

export const performanceMonitor = {
  metrics: [],
  maxMetrics: 100,
  
  startMeasure(name) {
    if (typeof window === 'undefined' || !window.performance) {
      return () => 0
    }
    
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.addMetric({ name, duration, timestamp: Date.now() })
      return duration
    }
  },
  
  addMetric(metric) {
    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
    
    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`⚠️ Slow operation: ${metric.name} took ${metric.duration.toFixed(2)}ms`)
    }
  },
  
  getMetrics() {
    return this.metrics
  },
  
  getAverageLatency(name) {
    const metrics = this.metrics.filter(m => m.name === name)
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
  },
  
  getSlowOperations(threshold = 500) {
    return this.metrics.filter(m => m.duration > threshold)
  },
  
  clear() {
    this.metrics = []
  },
  
  // Component render tracking
  trackRender(componentName) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value
      
      descriptor.value = function(...args) {
        const endMeasure = performanceMonitor.startMeasure(`${componentName}.${propertyKey}`)
        const result = originalMethod.apply(this, args)
        endMeasure()
        return result
      }
      
      return descriptor
    }
  },
  
  // API call tracking
  async trackAPI(apiName, apiCall) {
    const endMeasure = this.startMeasure(`api:${apiName}`)
    try {
      const result = await apiCall()
      endMeasure()
      return result
    } catch (error) {
      endMeasure()
      throw error
    }
  },
}

// Performance Observer for Long Tasks
if (typeof window !== 'undefined' && window.PerformanceObserver) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`)
          performanceMonitor.addMetric({
            name: 'long_task',
            duration: entry.duration,
            timestamp: Date.now(),
          })
        }
      }
    })
    observer.observe({ entryTypes: ['longtask', 'layout-shift', 'largest-contentful-paint'] })
  } catch (e) {
    // Unsupported entryTypes fallback
  }
}

export default performanceMonitor