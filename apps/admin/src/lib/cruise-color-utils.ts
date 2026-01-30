/**
 * Cruise Color Coordination Utilities
 *
 * Assigns deterministic colors to cruise bookings and their port-info children
 * so they are visually grouped across all itinerary views.
 */

export interface CruiseColorSet {
  bar: string        // left bar in table/cards (e.g. 'bg-blue-500')
  bg: string         // row/card background tint
  bgGradient: string // spanning bar gradient classes
  border: string     // spanning bar border
  borderHover: string
  badge: string      // duration badge classes
  line: string       // continuation line in summary
  borderLeft: string // left border on cards
  stickyGradient: string // sticky container gradient in spanning bar
}

export const CRUISE_COLOR_PALETTE: CruiseColorSet[] = [
  {
    bar: 'bg-blue-500',
    bg: 'bg-blue-50/50',
    bgGradient: 'from-blue-50 to-blue-50/25',
    border: 'border-blue-200',
    borderHover: 'hover:border-blue-300',
    badge: 'bg-blue-100 text-blue-800',
    line: 'bg-blue-300',
    borderLeft: 'border-l-blue-500',
    stickyGradient: 'from-blue-50 via-blue-50/95 to-blue-50/0',
  },
  {
    bar: 'bg-violet-500',
    bg: 'bg-violet-50/50',
    bgGradient: 'from-violet-50 to-violet-50/25',
    border: 'border-violet-200',
    borderHover: 'hover:border-violet-300',
    badge: 'bg-violet-100 text-violet-800',
    line: 'bg-violet-300',
    borderLeft: 'border-l-violet-500',
    stickyGradient: 'from-violet-50 via-violet-50/95 to-violet-50/0',
  },
  {
    bar: 'bg-amber-500',
    bg: 'bg-amber-50/50',
    bgGradient: 'from-amber-50 to-amber-50/25',
    border: 'border-amber-200',
    borderHover: 'hover:border-amber-300',
    badge: 'bg-amber-100 text-amber-800',
    line: 'bg-amber-300',
    borderLeft: 'border-l-amber-500',
    stickyGradient: 'from-amber-50 via-amber-50/95 to-amber-50/0',
  },
  {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50/50',
    bgGradient: 'from-emerald-50 to-emerald-50/25',
    border: 'border-emerald-200',
    borderHover: 'hover:border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800',
    line: 'bg-emerald-300',
    borderLeft: 'border-l-emerald-500',
    stickyGradient: 'from-emerald-50 via-emerald-50/95 to-emerald-50/0',
  },
  {
    bar: 'bg-rose-500',
    bg: 'bg-rose-50/50',
    bgGradient: 'from-rose-50 to-rose-50/25',
    border: 'border-rose-200',
    borderHover: 'hover:border-rose-300',
    badge: 'bg-rose-100 text-rose-800',
    line: 'bg-rose-300',
    borderLeft: 'border-l-rose-500',
    stickyGradient: 'from-rose-50 via-rose-50/95 to-rose-50/0',
  },
  {
    bar: 'bg-cyan-500',
    bg: 'bg-cyan-50/50',
    bgGradient: 'from-cyan-50 to-cyan-50/25',
    border: 'border-cyan-200',
    borderHover: 'hover:border-cyan-300',
    badge: 'bg-cyan-100 text-cyan-800',
    line: 'bg-cyan-300',
    borderLeft: 'border-l-cyan-500',
    stickyGradient: 'from-cyan-50 via-cyan-50/95 to-cyan-50/0',
  },
]

interface ActivityLike {
  id: string
  activityType: string
  parentActivityId?: string | null
  startDatetime?: string | null
}

/**
 * Build a map of activity ID → CruiseColorSet for all cruise parents and their port_info children.
 *
 * Only colors activities where parent activityType is 'custom_cruise' or 'cruise'
 * and child activityType is 'port_info'. Does NOT color unrelated parent-child hierarchies.
 *
 * @param activities Full activity list (not filtered dayActivities)
 */
export function buildCruiseColorMap(activities: ActivityLike[]): Map<string, CruiseColorSet> {
  const map = new Map<string, CruiseColorSet>()

  // Find cruise parents, sorted deterministically by startDatetime then id
  const cruiseParents = activities
    .filter((a) => a.activityType === 'custom_cruise' || a.activityType === 'cruise')
    .filter((a) => !a.parentActivityId)
    .sort((a, b) => {
      const dateA = a.startDatetime || ''
      const dateB = b.startDatetime || ''
      if (dateA !== dateB) return dateA < dateB ? -1 : 1
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    })

  // Assign colors to cruise parents
  for (let i = 0; i < cruiseParents.length; i++) {
    const color = CRUISE_COLOR_PALETTE[i % CRUISE_COLOR_PALETTE.length]!
    map.set(cruiseParents[i]!.id, color)
  }

  // Assign same color to port_info children
  for (const activity of activities) {
    if (
      activity.activityType === 'port_info' &&
      activity.parentActivityId &&
      map.has(activity.parentActivityId)
    ) {
      map.set(activity.id, map.get(activity.parentActivityId)!)
    }
  }

  return map
}

/**
 * Get cruise color for an activity, guarding by activityType.
 */
export function getCruiseColor(
  activity: ActivityLike,
  map: Map<string, CruiseColorSet>
): CruiseColorSet | undefined {
  const isCruiseRelated =
    activity.activityType === 'custom_cruise' ||
    activity.activityType === 'cruise' ||
    activity.activityType === 'port_info'

  if (!isCruiseRelated) return undefined
  return map.get(activity.id)
}
