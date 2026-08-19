// frontend/src/utils/performance.js

import React, { lazy } from 'react'

// Lazy loading with prefetch
export const lazyLoad = (importFn, prefetch = false) => {
  const Component = lazy(importFn)
  
  if (prefetch && typeof window !== 'undefined') {
    // Prefetch the component
    importFn()
  }
  
  return Component
}

// Virtual scrolling for large lists
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight
  
  return {
    visibleItems,
    offsetY,
    onScroll: (e) => setScrollTop(e.target.scrollTop),
    totalHeight: items.length * itemHeight
  }
}

// Memoization with TTL
export const memoizeWithTTL = (fn, ttl = 60000) => {
  const cache = new Map()
  
  return (...args) => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value
    }
    
    const result = fn(...args)
    cache.set(key, { value: result, timestamp: Date.now() })
    return result
  }
}

// Debounce with immediate option
export const debounce = (fn, delay = 300, immediate = false) => {
  let timeoutId
  let called = false
  
  return (...args) => {
    if (immediate && !called) {
      fn(...args)
      called = true
    }
    
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      if (!immediate) {
        fn(...args)
      }
      called = false
    }, delay)
  }
}

// Throttle with trailing option
export const throttle = (fn, limit = 300, trailing = true) => {
  let inThrottle = false
  let lastArgs = null
  let timeoutId = null
  
  return (...args) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      
      timeoutId = setTimeout(() => {
        inThrottle = false
        if (trailing && lastArgs) {
          fn(...lastArgs)
          lastArgs = null
        }
      }, limit)
    } else {
      lastArgs = args
    }
  }
}

// Image optimization
export const optimizeImage = (src, width = 300, height = 300) => {
  if (!src) return ''
  
  // If src is already optimized, return as is
  if (src.includes('?w=')) return src
  
  // Add optimization parameters
  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}w=${width}&h=${height}&fit=crop&auto=format&q=80`
}

// Resource hints
export const addResourceHints = (resources) => {
  if (typeof document === 'undefined') return
  
  resources.forEach(({ rel, href, as, type }) => {
    const link = document.createElement('link')
    link.rel = rel
    link.href = href
    if (as) link.as = as
    if (type) link.type = type
    document.head.appendChild(link)
  })
}

// Measure component performance
export const measureComponent = (componentName) => {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args) {
      const start = performance.now()
      const result = originalMethod.apply(this, args)
      const end = performance.now()
      
      console.log(`⚡ ${componentName}.${propertyKey} took ${(end - start).toFixed(2)}ms`)
      
      return result
    }
    
    return descriptor
  }
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
