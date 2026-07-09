// src/utils/monitoring.js

export const trackPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const metrics = {
      // Page load time
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      
      // DOM ready time
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      
      // First paint
      firstPaint: performance.getEntriesByType('paint').find(
        entry => entry.name === 'first-paint'
      )?.startTime || 0,
      
      // First contentful paint
      firstContentfulPaint: performance.getEntriesByType('paint').find(
        entry => entry.name === 'first-contentful-paint'
      )?.startTime || 0,
    }
    
    // Send metrics to analytics
    console.log('Performance Metrics:', metrics)
    return metrics
  }
}