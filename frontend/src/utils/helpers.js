// frontend/src/utils/helpers.js

/**
 * Classnames utility to conditionally join classNames
 */
export function cn(...inputs) {
  return inputs.flat(Infinity).filter(Boolean).join(' ')
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function truncateText(str, maxLength = 100) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}
