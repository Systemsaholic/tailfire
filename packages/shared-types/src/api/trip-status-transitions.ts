/**
 * Trip Status Workflow
 *
 * Defines valid status transitions for trips across the entire system.
 * This is the single source of truth for status workflow validation.
 *
 * IMPORTANT BUSINESS RULE (per TERN system):
 * A TRIP is NOT considered a "BOOKING" until an activity on that trip is PAID or CONFIRMED.
 * The 'booked' status should only be set when there's an actual confirmed/paid activity.
 *
 * Used by:
 * - Database trigger (migration 0009): Enforces transitions at DB level
 * - TripsService: Validates transitions before update
 * - Frontend: Shows/hides status change buttons based on valid transitions
 *
 * Status Lifecycle:
 * ┌─────────┐
 * │  Draft  │ ──────┐
 * └─────────┘       │
 *      │            │
 *      ▼            ▼
 * ┌─────────┐  ┌──────────┐
 * │ Quoted  │  │ Cancelled│ (terminal)
 * └─────────┘  └──────────┘
 *      │            ▲
 *      ▼            │
 * ┌─────────┐      │
 * │ Booked  │ ─────┤
 * └─────────┘      │
 *      │            │
 *      ▼            │
 * ┌─────────────┐  │
 * │ In Progress │ ─┤
 * └─────────────┘  │
 *      │            │
 *      ▼            │
 * ┌───────────┐    │
 * │ Completed │────┘
 * └───────────┘
 */

export type TripStatus = 'inbound' | 'draft' | 'quoted' | 'booked' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Valid status transitions map
 *
 * Key: Current status
 * Value: Array of statuses that can be transitioned to
 *
 * Rules:
 * - Draft → Quoted, Booked, Cancelled (can skip quoted if client accepts immediately)
 * - Quoted → Draft (revise), Booked (when activity confirmed/paid), Cancelled (rejected)
 * - Booked → In Progress (trip started), Completed (if trip finishes same day), Cancelled
 *   NOTE: Trip only becomes 'booked' when an activity is PAID or CONFIRMED (TERN business rule)
 * - In Progress → Completed (normal flow), Cancelled (trip cancelled mid-journey)
 * - Completed → [terminal state - no transitions allowed]
 * - Cancelled → [terminal state - no transitions allowed]
 */
export const TRIP_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  inbound: ['draft', 'quoted', 'booked', 'cancelled'], // Inbound can transition to any active status
  draft: ['inbound', 'quoted', 'booked', 'cancelled'],
  quoted: ['draft', 'booked', 'cancelled'],
  booked: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // terminal state
  cancelled: []  // terminal state
}

/**
 * Check if a status transition is valid
 *
 * @param from - Current trip status
 * @param to - Desired trip status
 * @returns true if transition is allowed, false otherwise
 *
 * @example
 * canTransitionTripStatus('draft', 'quoted') // true
 * canTransitionTripStatus('completed', 'booked') // false
 * canTransitionTripStatus('booked', 'in_progress') // true
 */
export function canTransitionTripStatus(from: TripStatus, to: TripStatus): boolean {
  // If status hasn't changed, allow it (no-op update)
  if (from === to) return true

  // Check if transition is in the valid transitions map
  return TRIP_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get all valid transitions from a given status
 *
 * @param from - Current trip status
 * @returns Array of statuses that can be transitioned to
 *
 * @example
 * getValidTransitions('draft') // ['quoted', 'booked', 'cancelled']
 * getValidTransitions('completed') // []
 */
export function getValidTransitions(from: TripStatus): TripStatus[] {
  return TRIP_STATUS_TRANSITIONS[from] || []
}

/**
 * Get a human-readable error message for an invalid transition
 *
 * @param from - Current trip status
 * @param to - Attempted trip status
 * @returns Error message explaining why the transition is invalid
 *
 * @example
 * getTransitionErrorMessage('completed', 'draft')
 * // "Cannot transition from Completed to Draft. Completed is a terminal state."
 */
export function getTransitionErrorMessage(from: TripStatus, to: TripStatus): string {
  const fromLabel = formatStatusLabel(from)
  const toLabel = formatStatusLabel(to)

  // Terminal states
  if (from === 'completed') {
    return `Cannot transition from ${fromLabel} to ${toLabel}. ${fromLabel} is a terminal state.`
  }

  if (from === 'cancelled') {
    return `Cannot transition from ${fromLabel} to ${toLabel}. ${fromLabel} is a terminal state.`
  }

  // Get valid transitions for helpful error message
  const validTransitions = getValidTransitions(from)
  if (validTransitions.length === 0) {
    return `Cannot transition from ${fromLabel}. ${fromLabel} is a terminal state.`
  }

  const validLabels = validTransitions.map(formatStatusLabel).join(', ')
  return `Cannot transition from ${fromLabel} to ${toLabel}. Valid transitions: ${validLabels}`
}

/**
 * Format status value to human-readable label
 *
 * @param status - Trip status value
 * @returns Formatted label
 *
 * @example
 * formatStatusLabel('in_progress') // "In Progress"
 * formatStatusLabel('draft') // "Draft"
 */
export function formatStatusLabel(status: TripStatus): string {
  const labels: Record<TripStatus, string> = {
    inbound: 'Inbound',
    draft: 'Draft',
    quoted: 'Quoted',
    booked: 'Booked',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }

  return labels[status] || status
}

/**
 * Check if a status is a terminal state (no further transitions allowed)
 *
 * @param status - Trip status to check
 * @returns true if status is terminal (completed or cancelled)
 *
 * @example
 * isTerminalStatus('completed') // true
 * isTerminalStatus('cancelled') // true
 * isTerminalStatus('booked') // false
 */
export function isTerminalStatus(status: TripStatus): boolean {
  return status === 'completed' || status === 'cancelled'
}

// ============================================================================
// TRIP DELETION
// ============================================================================

/**
 * Statuses that allow trip deletion
 *
 * Only trips in early stages (draft/quoted) can be deleted.
 * Booked, in_progress, completed, and cancelled trips cannot be deleted
 * because they may have:
 * - Payment records
 * - Booking confirmations
 * - Audit trail requirements
 * - Legal/compliance implications
 *
 * Used by:
 * - API: TripsService.remove() validates status before deletion
 * - Frontend: Shows delete vs cancel button based on status
 */
export const DELETABLE_STATUSES: readonly TripStatus[] = ['inbound', 'draft', 'quoted'] as const

/**
 * Check if a trip can be deleted based on its status
 *
 * @param status - The trip status (handles null/undefined safely)
 * @returns true if the trip can be deleted
 *
 * @example
 * canDeleteTrip('draft') // true
 * canDeleteTrip('quoted') // true
 * canDeleteTrip('booked') // false
 * canDeleteTrip(null) // false
 */
export function canDeleteTrip(status: TripStatus | string | null | undefined): boolean {
  if (!status) return false
  return DELETABLE_STATUSES.includes(status as TripStatus)
}

/**
 * Get a human-readable error message for why a trip cannot be deleted
 *
 * @param status - The trip status
 * @returns Error message explaining why deletion is not allowed
 *
 * @example
 * getDeleteErrorMessage('booked')
 * // "Cannot delete a trip that is booked, in progress, completed, or cancelled"
 */
export function getDeleteErrorMessage(status: TripStatus): string {
  if (canDeleteTrip(status)) {
    return '' // No error, deletion is allowed
  }
  return 'Cannot delete a trip that is booked, in progress, completed, or cancelled'
}
