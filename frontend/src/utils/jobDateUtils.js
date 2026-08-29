// frontend/src/utils/jobDateUtils.js

/**
 * Calculates a unified, accurate deadline and hiring status for any job.
 * Handles:
 * 1. Explicit closed status
 * 2. Hard deadlines with sub-day precision (closes today, 1 day left, X days left)
 * 3. Rolling admissions / ongoing recruitment (when no expiration exists)
 */
export function getJobDeadlineStatus(job) {
  if (!job) {
    return { type: 'UNKNOWN', label: '', detailText: '', subText: '', badgeColor: 'slate', isClosed: false }
  }

  // 1. Explicitly marked closed
  if (job.is_closed || job.status === 'closed') {
    return {
      type: 'CLOSED',
      label: 'Application Closed',
      detailText: 'Application Closed',
      subText: 'The application deadline for this position has passed.',
      badgeColor: 'slate',
      isClosed: true
    }
  }

  // 2. Official Deadline Present (Unstop, Campus Drives, JSearch)
  if (job.expires_at) {
    try {
      const exp = new Date(job.expires_at)
      const now = new Date()
      const diffMs = exp - now

      // Past deadline
      if (diffMs <= 0) {
        return {
          type: 'CLOSED',
          label: 'Application Closed',
          detailText: 'Application Closed',
          subText: 'The application deadline for this position has passed.',
          badgeColor: 'slate',
          isClosed: true
        }
      }

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      // Final 24 hours (Closes Today)
      if (diffDays === 0) {
        const hoursText = `${diffHours || 1} hour${diffHours !== 1 ? 's' : ''}`
        return {
          type: 'CLOSING_TODAY',
          label: `🚨 ${diffHours || 1}h left to apply`,
          detailText: `🚨 Closes Today: ${hoursText} left!`,
          subText: `Application portal closes on ${exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          badgeColor: 'rose',
          isClosed: false
        }
      }

      // Exactly 1 day left (24h - 48h) -> Matches Unstop
      if (diffDays === 1) {
        return {
          type: 'URGENT_1_DAY',
          label: '🚨 1 day left to apply',
          detailText: '🚨 Urgent: 1 day left to apply!',
          subText: `Application deadline: ${exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          badgeColor: 'rose',
          isClosed: false
        }
      }

      // 2 days left (48h - 72h)
      if (diffDays === 2) {
        return {
          type: 'CLOSING_SOON',
          label: '⚡ 2 days left to apply',
          detailText: '⚡ Closing Soon: 2 days left to apply!',
          subText: `Application deadline: ${exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          badgeColor: 'amber',
          isClosed: false
        }
      }

      // 3 to 7 days left
      if (diffDays <= 7) {
        return {
          type: 'CLOSING_SOON',
          label: `⏰ ${diffDays} days left to apply`,
          detailText: `⏰ ${diffDays} days left to apply`,
          subText: `Deadline: ${exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          badgeColor: 'amber',
          isClosed: false
        }
      }

      // More than 7 days left
      return {
        type: 'ACTIVE_DEADLINE',
        label: `Apply by: ${exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (${diffDays}d left)`,
        detailText: 'Application Deadline',
        subText: `Apply before ${exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${diffDays} days remaining)`,
        badgeColor: 'rose-soft',
        isClosed: false
      }
    } catch (e) {}
  }

  // 3. Rolling Admissions / Ongoing Recruitment (Remotive, Arbeitnow, RemoteOK, etc.)
  let timeAgoText = ''
  let postedDateText = ''
  if (job.posted_date) {
    try {
      const posted = new Date(job.posted_date)
      const daysAgo = Math.floor((new Date() - posted) / (1000 * 60 * 60 * 24))
      if (daysAgo === 0) timeAgoText = ' • Today'
      else if (daysAgo <= 7) timeAgoText = ` • ${daysAgo}d ago`
      else timeAgoText = ` • Posted ${posted.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      postedDateText = `Posted on ${posted.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    } catch (e) {}
  }

  return {
    type: 'ROLLING',
    label: `Actively Hiring • Rolling Basis${timeAgoText}`,
    detailText: 'Actively Hiring • Rolling Admissions',
    subText: postedDateText 
      ? `${postedDateText} — applications are reviewed continuously on a rolling basis until the position is filled.`
      : 'Applications are reviewed continuously on a rolling basis until the position is filled.',
    badgeColor: 'emerald',
    isClosed: false
  }
}
