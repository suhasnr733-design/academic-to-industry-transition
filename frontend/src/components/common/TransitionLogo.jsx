import React from 'react'

export const TransitionLogo = ({ className = "w-10 h-10" }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Modern Vibrant Gradient */}
        <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* Top Gloss Flare */}
        <linearGradient id="flareGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Ambient Drop Shadow */}
        <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4338CA" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Vibrant Squircle Badge */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="24"
        fill="url(#badgeGrad)"
        filter="url(#badgeShadow)"
      />

      {/* Top Subtle Gloss */}
      <rect
        x="3"
        y="3"
        width="94"
        height="47"
        rx="24"
        fill="url(#flareGrad)"
      />

      {/* Graduation Cap (Academia) */}
      <polygon
        points="32,22 56,33 32,44 8,33"
        fill="#FFFFFF"
      />
      {/* Cap Underbase */}
      <path
        d="M17 38 V45 C17 50.5 47 50.5 47 45 V38"
        fill="#E0E7FF"
      />
      {/* Cap Tassel */}
      <path
        d="M32 33 L14 41 V50"
        stroke="#E0E7FF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="14" cy="51" r="2.8" fill="#FFFFFF" />

      {/* Infinity Career Transition Ribbon */}
      <path
        d="M30,57 C20,57 14,64 14,72 C14,81 22,86 31,84 C41,82 52,66 64,58 C73,51 83,55 83,65 C83,74 75,80 65,78 C58,76 53,71 50,66"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Upward Career Growth Arrow */}
      <polygon
        points="65,18 92,23 85,49 79,40 62,47"
        fill="#FFFFFF"
      />
    </svg>
  )
}

export default TransitionLogo
