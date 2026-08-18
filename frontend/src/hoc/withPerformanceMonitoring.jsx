// frontend/src/hoc/withPerformanceMonitoring.jsx

import React, { useEffect } from 'react'

export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    useEffect(() => {
      // Log component mount
      console.log(`🔷 ${componentName} mounted`)
      
      // Measure render time
      const start = performance.now()
      
      return () => {
        const end = performance.now()
        console.log(`🔶 ${componentName} unmounted after ${(end - start).toFixed(2)}ms`)
      }
    }, [])

    // Track props changes
    const prevPropsRef = React.useRef(props)
    useEffect(() => {
      const changes = []
      Object.keys(props).forEach(key => {
        if (prevPropsRef.current[key] !== props[key]) {
          changes.push({
            key,
            from: prevPropsRef.current[key],
            to: props[key]
          })
        }
      })
      if (changes.length > 0) {
        console.log(`🔄 ${componentName} props changed:`, changes)
      }
      prevPropsRef.current = props
    })

    return <WrappedComponent {...props} />
  }
}