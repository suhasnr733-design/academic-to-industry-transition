// frontend/src/utils/learningDateUtils.js

/**
 * Parses YYYY-MM-DD or DD-MM-YYYY or ISO date strings cleanly at local midnight boundary
 * to prevent timezone-related off-by-one errors.
 * 
 * @param {string|Date} dateInput 
 * @returns {Date|null}
 */
export function parseLocalMidnightDate(dateInput) {
  if (!dateInput) return null

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const d = new Date(dateInput.getTime())
    d.setHours(0, 0, 0, 0)
    return d
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim()
    if (!trimmed) return null

    // Check YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10)
      const month = parseInt(ymdMatch[2], 10) - 1
      const day = parseInt(ymdMatch[3], 10)
      const d = new Date(year, month, day)
      d.setHours(0, 0, 0, 0)
      return isNaN(d.getTime()) ? null : d
    }

    // Check DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10)
      const month = parseInt(dmyMatch[2], 10) - 1
      const year = parseInt(dmyMatch[3], 10)
      const d = new Date(year, month, day)
      d.setHours(0, 0, 0, 0)
      return isNaN(d.getTime()) ? null : d
    }

    // Fallback standard parse
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0)
      return parsed
    }
  }

  return null
}

/**
 * Calculates interview date countdown and sprint pace status.
 * Handles:
 * - Past dates with clear overdue state (no negative/misleading remaining days)
 * - Today date (0 days remaining)
 * - Future dates with dynamic sprint pace calculation
 * - Safe timezone midnight difference
 * 
 * @param {string|Date} targetDateInput 
 * @param {Date} [currentDate] 
 * @returns {Object}
 */
export function calculateInterviewCountdown(targetDateInput, currentDate = new Date()) {
  if (!targetDateInput) {
    return {
      isValid: false,
      daysRemaining: null,
      isOverdue: false,
      overdueDays: 0,
      badgeText: 'Target Schedule',
      badgeLabel: 'Target Schedule',
      paceLabel: 'Standard Pace',
      paceVariant: 'default',
      formattedDate: 'Not Set',
      dailyPaceMinutes: 45
    }
  }

  const targetDate = parseLocalMidnightDate(targetDateInput)
  if (!targetDate) {
    return {
      isValid: false,
      daysRemaining: null,
      isOverdue: false,
      overdueDays: 0,
      badgeText: 'Invalid Date',
      badgeLabel: 'Target Schedule',
      paceLabel: 'Standard Pace',
      paceVariant: 'default',
      formattedDate: String(targetDateInput),
      dailyPaceMinutes: 45
    }
  }

  const today = parseLocalMidnightDate(currentDate) || new Date()
  today.setHours(0, 0, 0, 0)

  const diffMs = targetDate.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  const formattedDate = targetDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  // Overdue state
  if (diffDays < 0) {
    const overdue = Math.abs(diffDays)
    const dayWord = overdue === 1 ? 'Day' : 'Days'
    return {
      isValid: true,
      daysRemaining: diffDays,
      isOverdue: true,
      overdueDays: overdue,
      badgeText: `⚠️ Overdue by ${overdue} ${dayWord}`,
      badgeLabel: `Overdue (${overdue}d)`,
      paceLabel: `⚠️ Overdue Schedule (${overdue}d Passed)`,
      paceVariant: 'overdue',
      formattedDate,
      dailyPaceMinutes: 60,
      helperText: `Target interview date passed on ${formattedDate}. Please adjust your target date to recalculate sprint schedule.`
    }
  }

  // Today
  if (diffDays === 0) {
    return {
      isValid: true,
      daysRemaining: 0,
      isOverdue: false,
      overdueDays: 0,
      badgeText: '🎯 Target Date is Today!',
      badgeLabel: 'Today!',
      paceLabel: '🔥 Sprint Pace (Target Date Today)',
      paceVariant: 'sprint',
      formattedDate,
      dailyPaceMinutes: 60,
      helperText: 'Your target interview date is today! Focus on quick review and confidence.'
    }
  }

  // 1 Day remaining
  if (diffDays === 1) {
    return {
      isValid: true,
      daysRemaining: 1,
      isOverdue: false,
      overdueDays: 0,
      badgeText: '⏰ 1 Day Remaining',
      badgeLabel: '1 Day Remaining',
      paceLabel: '🔥 Sprint Pace (Close Target Date)',
      paceVariant: 'sprint',
      formattedDate,
      dailyPaceMinutes: 120,
      helperText: '1 day remaining before your target interview. Focus on high-yield revision.'
    }
  }

  // 2-7 Days (Sprint Pace)
  if (diffDays <= 7) {
    return {
      isValid: true,
      daysRemaining: diffDays,
      isOverdue: false,
      overdueDays: 0,
      badgeText: `⏰ ${diffDays} Days Remaining`,
      badgeLabel: `${diffDays} Days Remaining`,
      paceLabel: '🔥 Sprint Pace (Close Target Date)',
      paceVariant: 'sprint',
      formattedDate,
      dailyPaceMinutes: Math.min(180, Math.max(90, Math.round(300 / diffDays))),
      helperText: `Final sprint: ${diffDays} days left. Daily intensive practice recommended.`
    }
  }

  // 8-21 Days (Crash Course)
  if (diffDays <= 21) {
    return {
      isValid: true,
      daysRemaining: diffDays,
      isOverdue: false,
      overdueDays: 0,
      badgeText: `⏰ ${diffDays} Days Remaining`,
      badgeLabel: `${diffDays} Days Remaining`,
      paceLabel: '⚡ Crash Course Pace',
      paceVariant: 'crash',
      formattedDate,
      dailyPaceMinutes: 60,
      helperText: `Target date is ${diffDays} days away. Complete 1 core topic daily.`
    }
  }

  // 22-60 Days (Standard Pace)
  if (diffDays <= 60) {
    return {
      isValid: true,
      daysRemaining: diffDays,
      isOverdue: false,
      overdueDays: 0,
      badgeText: `⏰ ${diffDays} Days Remaining`,
      badgeLabel: `${diffDays} Days Remaining`,
      paceLabel: '🎯 Standard Pace',
      paceVariant: 'standard',
      formattedDate,
      dailyPaceMinutes: 45,
      helperText: `Steady progress: ${diffDays} days left. Maintain 35-45 minutes daily study.`
    }
  }

  // > 60 Days (Relaxed Pace)
  return {
    isValid: true,
    daysRemaining: diffDays,
    isOverdue: false,
    overdueDays: 0,
    badgeText: `⏰ ${diffDays} Days Remaining`,
    badgeLabel: `${diffDays} Days Remaining`,
    paceLabel: '☕ Relaxed Pace',
    paceVariant: 'relaxed',
    formattedDate,
    dailyPaceMinutes: 30,
    helperText: `Comfortable timeline: ${diffDays} days left. Focus on deep understanding.`
  }
}
