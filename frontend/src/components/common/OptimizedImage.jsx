// frontend/src/components/common/OptimizedImage.jsx

import React, { useState } from 'react'

export const OptimizedImage = ({ 
  src, 
  alt = '', 
  className = '', 
  width, 
  height,
  placeholder = true,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="relative overflow-hidden inline-block" style={{ width, height }}>
      {!isLoaded && !error && placeholder && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        decoding="async"
        width={width}
        height={height}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
          <span className="text-gray-400 dark:text-gray-500 text-xs text-center">Failed to load</span>
        </div>
      )}
    </div>
  )
}

export default OptimizedImage
