// src/components/common/Typography.jsx

import React from 'react'
import { cn } from '../../utils/helpers'

const variants = {
  h1: 'text-4xl md:text-5xl font-bold text-gray-900',
  h2: 'text-3xl md:text-4xl font-semibold text-gray-900',
  h3: 'text-2xl md:text-3xl font-semibold text-gray-900',
  h4: 'text-xl md:text-2xl font-semibold text-gray-900',
  h5: 'text-lg md:text-xl font-semibold text-gray-900',
  h6: 'text-base md:text-lg font-semibold text-gray-900',
  body1: 'text-base text-gray-700',
  body2: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500',
  overline: 'text-xs uppercase tracking-wider text-gray-500',
}

export const Typography = ({
  variant = 'body1',
  component: Component,
  className,
  children,
  ...props
}) => {
  const Tag = Component || (variant.startsWith('h') ? variant : 'p')
  return (
    <Tag className={cn(variants[variant], className)} {...props}>
      {children}
    </Tag>
  )
}

export const Heading = ({ level = 1, className, children, ...props }) => {
  const variant = `h${level}` 
  return (
    <Typography variant={variant} className={className} {...props}>
      {children}
    </Typography>
  )
}