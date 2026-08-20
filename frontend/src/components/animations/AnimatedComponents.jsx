// frontend/src/components/animations/AnimatedComponents.jsx

import React from 'react'
import { motion } from 'framer-motion'

export const FadeIn = ({ children, delay = 0, className = '', ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const ScaleIn = ({ children, delay = 0, className = '', ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', bounce: 0.3 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const SlideIn = ({ children, direction = 'left', delay = 0, className = '', ...props }) => {
  const directions = {
    left: { x: -50 },
    right: { x: 50 },
    up: { y: 50 },
    down: { y: -50 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...(directions[direction] || directions.left) }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const StaggerChildren = ({ children, staggerDelay = 0.1, className = '', ...props }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const StaggerItem = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const Pulse = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default {
  FadeIn,
  ScaleIn,
  SlideIn,
  StaggerChildren,
  StaggerItem,
  Pulse,
}
