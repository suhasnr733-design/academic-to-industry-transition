// src/components/common/Image.jsx

import React, { useState } from 'react'
import { optimizeImage } from '../../utils/performance'

export const Image = ({ src, alt, className, width, height, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  const optimizedSrc = optimizeImage(src, width, height)

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        width={width}
        height={height}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  )
}