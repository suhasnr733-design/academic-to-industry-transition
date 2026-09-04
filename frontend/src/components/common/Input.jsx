// src/components/common/Input.jsx

import React, { forwardRef, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { cn } from '../../utils/helpers'

export const Input = forwardRef(({
  label,
  error,
  className,
  type = 'text',
  required,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-gray-300 mb-1.5 tracking-wide">
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={effectiveType}
          className={cn(
            'w-full px-3.5 py-2.5 bg-[#1E293B] border rounded-xl text-sm text-white placeholder-gray-400',
            'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none shadow-sm',
            'disabled:bg-[#0F172A] disabled:text-gray-500 disabled:cursor-not-allowed',
            isPassword && 'pr-11',
            error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-gray-700/80 hover:border-gray-600',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none transition-colors duration-150"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <FiEyeOff className="w-4 h-4" />
            ) : (
              <FiEye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'