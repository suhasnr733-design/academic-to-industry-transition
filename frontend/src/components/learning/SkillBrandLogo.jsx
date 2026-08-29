// src/components/learning/SkillBrandLogo.jsx
import React from 'react'

export const SkillBrandLogo = ({ skillName, className = "w-5 h-5" }) => {
  const normName = (skillName || '').toLowerCase().trim()

  // Python Official Logo
  if (normName.includes('python')) {
    return (
      <svg className={className} viewBox="0 0 128 128" fill="none">
        <path fill="url(#python_a)" d="M63.3 3c-24.8 0-23.3 10.7-23.3 10.7v11.1h23.7v3.4H30.4S13.7 26.3 13.7 51.5c0 25.1 14.6 24.2 14.6 24.2h8.7v-12.3s-.5-14.6 14.6-14.6h24.1s14.1.2 14.1-13.6V16.7S92.3 3 63.3 3zm-12.8 7.3a4.2 4.2 0 110 8.4 4.2 4.2 0 010-8.4z" />
        <path fill="url(#python_b)" d="M64.7 125c24.8 0 23.3-10.7 23.3-10.7v-11.1H64.3v-3.4h33.3s16.7 1.9 16.7-23.3c0-25.1-14.6-24.2-14.6-24.2h-8.7v12.3s.5 14.6-14.6 14.6H56.8s-14.1-.2-14.1 13.6v18.5S40.2 125 64.7 125zm12.8-7.3a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4z" />
        <defs>
          <linearGradient id="python_a" x1="22.2" y1="5.1" x2="79.9" y2="62.8" gradientUnits="userSpaceOnUse">
            <stop stopColor="#387EB8" />
            <stop offset="1" stopColor="#366994" />
          </linearGradient>
          <linearGradient id="python_b" x1="48.1" y1="65.2" x2="105.8" y2="122.9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE052" />
            <stop offset="1" stopColor="#FFC331" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  // Java Official Logo
  if (normName.includes('java') && !normName.includes('script')) {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <path fill="#EA2D2E" d="M47.8 89.2s-5.7 3.3 4.1 4.5c11.9 1.4 18.2 1.3 31.4-1.4 0 0 4.1.9 7.3 3.6-11.4 7.6-35.8 6.5-42.8.2-2.5-2.2 0-6.9 0-6.9z"/>
        <path fill="#5382A1" d="M42.4 76s-6.3 4.4 3.3 5.4c12.9 1.3 22.9 1.6 37.8-1.7 0 0 2.9 1.6 6 3.1-16.8 6.7-41.6 5.8-47.1-.8-2.6-3.2 0-6 0-6z"/>
        <path fill="#EA2D2E" d="M62.6 58.7s-13.8 16.3 6.9 17.6c16.2 1 29.5-6.5 29.5-6.5s-6.4 3.7-16.1 5.3c-11.9 2-25.2.7-20.3-16.4z"/>
        <path fill="#5382A1" d="M77 28.5s6.8 7.8-6.3 19.8c-10.6 9.8-4.5 15.5 0 22.6-6.4-5.8-9.4-11.7-4.1-16.7 8.2-7.8 13.9-12.7 10.4-25.7z"/>
        <path fill="#5382A1" d="M53.3 103.5s-4.6 2.5 4.5 3.3c12.2 1.1 24.9.7 38.3-2.1 0 0 2.5 2.1 4.7 3-17.7 5.7-44.5 4.7-47.5-4.2z"/>
      </svg>
    )
  }

  // Git Official Logo
  if (normName.includes('git')) {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <path fill="#F05032" d="M124.7 57.3L70.7 3.3c-4.4-4.4-11.5-4.4-15.9 0L3.3 54.8c-4.4 4.4-4.4 11.5 0 15.9l54 54c4.4 4.4 11.5 4.4 15.9 0l51.5-51.5c4.4-4.4 4.4-11.5 0-15.9z"/>
        <path fill="#FFF" d="M93.3 54.8c-3.1-3.1-8-3.3-11.3-.8L69.6 41.6v-7.1c3.1-1.4 5.3-4.5 5.3-8.2 0-4.9-4-8.9-8.9-8.9s-8.9 4-8.9 8.9c0 3.7 2.2 6.8 5.3 8.2v17.4L49 65.3c-1.4-3.1-4.5-5.3-8.2-5.3-4.9 0-8.9 4-8.9 8.9s4 8.9 8.9 8.9c3.7 0 6.8-2.2 8.2-5.3l13.4 13.4v6.8c-3.1 1.4-5.3 4.5-5.3 8.2 0 4.9 4 8.9 8.9 8.9s8.9-4 8.9-8.9c0-3.7-2.2-6.8-5.3-8.2V73.4l14.4-14.4c2.8.5 5.7-.3 7.8-2.4 3.1-3.1 3.1-8.2 0-11.8z"/>
      </svg>
    )
  }

  // React / React.js Official Logo
  if (normName.includes('react')) {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <circle cx="64" cy="64" r="11.4" fill="#61DAFB"/>
        <g stroke="#61DAFB" strokeWidth="4.5" fill="none">
          <ellipse cx="64" cy="64" rx="48" ry="18"/>
          <ellipse cx="64" cy="64" rx="48" ry="18" transform="rotate(60 64 64)"/>
          <ellipse cx="64" cy="64" rx="48" ry="18" transform="rotate(120 64 64)"/>
        </g>
      </svg>
    )
  }

  // JavaScript Official Logo
  if (normName.includes('javascript') || normName === 'js') {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <path fill="#F7DF1E" d="M2 2h124v124H2z"/>
        <path fill="#000" d="M67.3 103c3.4 5.5 8 9.3 16.1 9.3 6.8 0 11.2-3.4 11.2-8.1 0-5.6-4.4-7.7-11.8-10.9l-4.1-1.8c-11.9-5.1-19.7-11.5-19.7-24.8 0-13 10.1-23 25.8-23 11.2 0 18.7 3.9 23.9 12.8l-12.8 8.2c-2.9-4.8-6.1-7-11.2-7-5 0-8.2 3.1-8.2 7 0 4.8 3.2 6.8 10 9.7l4.1 1.8c14 6 21.8 12.2 21.8 25.8 0 15-11.7 24.5-28.7 24.5-16.1 0-25.7-7.8-31-17.7zm-39.7-1c2.4 4.3 5.4 7.9 10.9 7.9 5.5 0 8.8-2.2 8.8-10.6V44.4h17.3v55.2c0 17.5-10.1 25.2-24.4 25.2-12.8 0-20.6-6.6-24.8-15.8z"/>
      </svg>
    )
  }

  // HTML / HTML5 Official Logo
  if (normName.includes('html')) {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <path fill="#E44D26" d="M18.6 114.7L8.5 2h111l-10.1 112.7L64 126z"/>
        <path fill="#F16529" d="M64 116.8l37.2-10.3 8.7-97.5H64z"/>
        <path fill="#EBEBEB" d="M64 54.4H44.1l-1.4-15.6H64V23.2H25.7l4.1 46.8H64zM64 90.6l-.2.1-15.7-4.2-1-11.4H31.8l2 22.7 30.1 8.3.1-.1z"/>
        <path fill="#FFF" d="M64 54.4h19.9l-1.9 20.9-18 4.9v16.1l30.1-8.3 3.4-38H64zM64 23.2h39.7l-1.4 15.6H64z"/>
      </svg>
    )
  }

  // CSS / CSS3 Official Logo
  if (normName.includes('css')) {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <path fill="#1572B6" d="M18.6 114.7L8.5 2h111l-10.1 112.7L64 126z"/>
        <path fill="#33A9DC" d="M64 116.8l37.2-10.3 8.7-97.5H64z"/>
        <path fill="#EBEBEB" d="M64 54.4H44.1l-1.4-15.6H64V23.2H25.7l4.1 46.8H64zM64 90.6l-.2.1-15.7-4.2-1-11.4H31.8l2 22.7 30.1 8.3.1-.1z"/>
        <path fill="#FFF" d="M64 54.4h19.9l-3.3 37.1-16.6 4.5v16.1l30.1-8.3 4.8-53.8H64zM64 23.2h39.7l-1.4 15.6H64z"/>
      </svg>
    )
  }

  // SQL / Database Official Logo
  if (normName.includes('sql') || normName.includes('db') || normName.includes('database')) {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <ellipse cx="64" cy="28" rx="48" ry="18" fill="#336791"/>
        <path fill="#336791" d="M16 28v24c0 9.9 21.5 18 48 18s48-8.1 48-18V28"/>
        <path fill="#4183C4" d="M16 52v24c0 9.9 21.5 18 48 18s48-8.1 48-18V52"/>
        <path fill="#2E5B82" d="M16 76v24c0 9.9 21.5 18 48 18s48-8.1 48-18V76"/>
      </svg>
    )
  }

  // C++ Official Logo
  if (normName.includes('c++')) {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <path fill="#00599C" d="M64 126L8.5 94V34L64 2l55.5 32v60z"/>
        <path fill="#FFF" d="M42.2 46.2c-5.7 5.7-8.9 13.3-8.9 21.5s3.2 15.8 8.9 21.5c5.7 5.7 13.3 8.9 21.5 8.9 8.6 0 16.4-3.5 22.1-9.5l-9.8-9.8c-3.1 3.4-7.6 5.4-12.3 5.4-9.5 0-17.3-7.8-17.3-17.3s7.8-17.3 17.3-17.3c4.7 0 9.2 2 12.3 5.4l9.8-9.8c-5.7-6-13.5-9.5-22.1-9.5-8.2 0-15.8 3.2-21.5 8.9zm45.2 20.3h7v-7h6v7h7v6h-7v7h-6v-7h-7v-6zm20 0h7v-7h6v7h7v6h-7v7h-6v-7h-7v-6z"/>
      </svg>
    )
  }

  // C# Official Logo
  if (normName.includes('c#')) {
    return (
      <svg className={className} viewBox="0 0 128 128">
        <path fill="#68217A" d="M64 126L8.5 94V34L64 2l55.5 32v60z"/>
        <path fill="#FFF" d="M42.2 46.2c-5.7 5.7-8.9 13.3-8.9 21.5s3.2 15.8 8.9 21.5c5.7 5.7 13.3 8.9 21.5 8.9 8.6 0 16.4-3.5 22.1-9.5l-9.8-9.8c-3.1 3.4-7.6 5.4-12.3 5.4-9.5 0-17.3-7.8-17.3-17.3s7.8-17.3 17.3-17.3c4.7 0 9.2 2 12.3 5.4l9.8-9.8c-5.7-6-13.5-9.5-22.1-9.5-8.2 0-15.8 3.2-21.5 8.9zm44.2 22.7l2.4-9.6H82l2.4-9.6h5.3l1.8-7.2h-5.3l2.4-9.6h-5.3l-2.4 9.6h-7.2l2.4-9.6h-5.3l-2.4 9.6h-5.3l-1.8 7.2h5.3l-2.4 9.6h-5.3l-1.8 7.2h5.3l-2.4 9.6h5.3l2.4-9.6h7.2l-2.4 9.6h5.3zm-3.6-16.8h-7.2l2.4-9.6h7.2l-2.4 9.6z"/>
      </svg>
    )
  }

  // Data Structures / Algorithms / Tech Tree Logo
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="24" fill="#4F46E5"/>
      <path d="M64 28v24M64 52L40 76M64 52l24 24M40 76v24M88 76v24" stroke="#FFF" strokeWidth="8" strokeLinecap="round"/>
      <circle cx="64" cy="28" r="10" fill="#61DAFB"/>
      <circle cx="40" cy="76" r="10" fill="#34D399"/>
      <circle cx="88" cy="76" r="10" fill="#FBBF24"/>
      <circle cx="40" cy="100" r="8" fill="#F472B6"/>
      <circle cx="88" cy="100" r="8" fill="#A78BFA"/>
    </svg>
  )
}

export default SkillBrandLogo
