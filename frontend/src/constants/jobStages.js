// frontend/src/constants/jobStages.js

/**
 * Standardized 6-stage application pipeline stages
 * Shared across Student Dashboard and Faculty Command Center
 */
export const JOB_STAGES = {
  interested: {
    key: 'interested',
    label: 'Target Role',
    emoji: '⭐',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Saved as target role in candidate roadmap'
  },
  applied: {
    key: 'applied',
    label: 'Applied',
    emoji: '📝',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Application submitted to company'
  },
  interviewing: {
    key: 'interviewing',
    label: 'Interviewing',
    emoji: '💬',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Active in company interview rounds'
  },
  shortlisted: {
    key: 'shortlisted',
    label: 'Shortlisted',
    emoji: '🎉',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Candidate shortlisted by recruitment team'
  },
  offer: {
    key: 'offer',
    label: 'Offer Received',
    emoji: '🏆',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
    description: 'Formal job offer received'
  },
  rejected: {
    key: 'rejected',
    label: 'Archived',
    emoji: '📦',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Application archived / not moving forward'
  }
}

export const JOB_STAGE_OPTIONS = Object.values(JOB_STAGES)

export const getStageDetails = (statusKey) => {
  if (!statusKey) return JOB_STAGES.interested
  const normalizedKey = String(statusKey).toLowerCase().trim()
  return JOB_STAGES[normalizedKey] || {
    key: normalizedKey,
    label: normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1),
    emoji: '📌',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Custom status'
  }
}

/**
 * Standardized Official Institutional Placement Statuses
 * Matches student dashboard stages for full cohort consistency
 */
export const OFFICIAL_PLACEMENT_STAGES = [
  {
    value: 'seeking',
    label: 'Target Role (Seeking Placement)',
    emoji: '⭐',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    value: 'applied',
    label: 'Applied',
    emoji: '📝',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    value: 'interviewing',
    label: 'Interviewing',
    emoji: '💬',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    value: 'shortlisted',
    label: 'Shortlisted',
    emoji: '🎉',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  {
    value: 'placed',
    label: 'Placed (Offer Received & Verified)',
    emoji: '🏆',
    badgeClass: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    value: 'higher_studies',
    label: 'Higher Studies',
    emoji: '🎓',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  {
    value: 'opted_out',
    label: 'Archived / Opted Out',
    emoji: '📦',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200'
  }
]

export const getOfficialPlacementDetails = (statusValue) => {
  if (!statusValue) return OFFICIAL_PLACEMENT_STAGES[0]
  const normalized = String(statusValue).toLowerCase().trim()
  const found = OFFICIAL_PLACEMENT_STAGES.find((s) => s.value === normalized)
  if (found) return found

  // Map legacy/job aliases
  if (normalized === 'interested') return OFFICIAL_PLACEMENT_STAGES[0]
  if (normalized === 'offer') return OFFICIAL_PLACEMENT_STAGES[4]
  if (normalized === 'rejected') return OFFICIAL_PLACEMENT_STAGES[6]

  return {
    value: normalized,
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    emoji: '📌',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

