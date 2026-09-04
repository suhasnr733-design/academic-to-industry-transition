// src/components/common/Button.jsx

import React from 'react'
import { cn } from '../../utils/helpers'

const variants = {
  primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 focus:ring-2 focus:ring-indigo-500/50',
  secondary: 'bg-[#1E293B] text-gray-200 border border-gray-700/60 hover:bg-[#334155] hover:text-white focus:ring-2 focus:ring-gray-600',
  success: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 focus:ring-2 focus:ring-emerald-500',
  danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-500/20 focus:ring-2 focus:ring-rose-500',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-md shadow-amber-500/20 focus:ring-2 focus:ring-amber-400',
  outline: 'border border-indigo-500/40 text-indigo-400 hover:bg-indigo-950/40 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500',
  ghost: 'text-gray-300 hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-gray-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-5 py-2.5 text-base font-semibold',
  xl: 'px-7 py-3.5 text-lg font-semibold',
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}