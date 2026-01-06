/**
 * Package Utilities
 *
 * Shared helpers for working with packages (formerly "bookings").
 * A Package is a grouping wrapper that owns pricing, payments, travelers, and documents
 * for one or more activities. When an activity is linked to a package, its individual
 * pricing/booking UI should be hidden since the package manages those details.
 */

import type { ActivityResponseDto } from '@tailfire/shared-types/api'

/**
 * Check if an activity is linked to a package.
 * When true, the activity's pricing is managed by the package.
 */
export function isLinkedToPackage(
  activity: ActivityResponseDto | null | undefined
): boolean {
  return !!activity?.packageId
}

/**
 * Get the package ID for an activity, or null if not linked.
 */
export function getPackageId(
  activity: ActivityResponseDto | null | undefined
): string | null {
  return activity?.packageId ?? null
}

/**
 * Check if an activity has standalone pricing (not managed by a package).
 * This is the inverse of isLinkedToPackage - useful for conditionally
 * showing pricing UI.
 */
export function hasStandalonePricing(
  activity: ActivityResponseDto | null | undefined
): boolean {
  return !isLinkedToPackage(activity)
}
