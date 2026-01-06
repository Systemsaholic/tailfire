/**
 * usePackageContext Hook
 *
 * Provides package context for activity forms. When an activity is linked
 * to a package, certain UI elements (pricing, payment schedules) should be
 * hidden since the package manages those details.
 *
 * Usage:
 * ```tsx
 * const { isLinked, package: pkg, hidePricing, packageUrl } = usePackageContext(activity)
 *
 * if (hidePricing) {
 *   return <PackagePricingBanner packageName={pkg?.name} packageUrl={packageUrl} />
 * }
 * ```
 */

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import type { ActivityResponseDto } from '@tailfire/shared-types/api'
import { useBooking } from './use-bookings'
import { isLinkedToPackage, getPackageId } from '@/lib/package-utils'

interface UsePackageContextOptions {
  /**
   * Whether to fetch the full package data. Default: true.
   * Set to false if you only need to check linkage status.
   */
  fetchPackage?: boolean
}

interface PackageContextResult {
  /** Whether the activity is linked to a package */
  isLinked: boolean

  /** The package ID, or null if not linked */
  packageId: string | null

  /** The full package data (if fetchPackage is true and package exists) */
  package: ReturnType<typeof useBooking>['data'] | null

  /** Whether the package data is loading */
  isLoading: boolean

  /** Whether fetching the package failed (package may have been deleted) */
  isError: boolean

  /** Whether the package was deleted (activity has packageId but fetch failed) */
  packageDeleted: boolean

  /** Whether to hide pricing UI (true when linked to a package) */
  hidePricing: boolean

  /** Whether to hide payment schedule UI (true when linked to a package) */
  hidePaymentSchedule: boolean

  /** Whether to hide booking details UI (true when linked to a package) */
  hideBookingDetails: boolean

  /** URL to the package detail page */
  packageUrl: string | null

  /** URL to the package's pricing tab */
  packagePricingUrl: string | null
}

export function usePackageContext(
  activity: ActivityResponseDto | null | undefined,
  options: UsePackageContextOptions = {}
): PackageContextResult {
  const { fetchPackage = true } = options
  const params = useParams<{ id: string }>()
  const tripId = params?.id || ''

  const packageId = getPackageId(activity)
  const isLinked = isLinkedToPackage(activity)

  // Fetch package data if linked and fetchPackage is enabled
  const {
    data: packageData,
    isLoading,
    isError,
  } = useBooking(fetchPackage ? packageId : null)

  // Determine if package was deleted (activity has packageId but fetch failed)
  const packageDeleted = isLinked && isError

  // Build package URLs
  const packageUrl = useMemo(() => {
    if (!tripId || !packageId) return null
    return `/trips/${tripId}/activities/${packageId}/edit?type=package`
  }, [tripId, packageId])

  const packagePricingUrl = useMemo(() => {
    if (!packageUrl) return null
    return `${packageUrl}&tab=pricing`
  }, [packageUrl])

  return {
    isLinked,
    packageId,
    package: packageData ?? null,
    isLoading: fetchPackage ? isLoading : false,
    isError: fetchPackage ? isError : false,
    packageDeleted,
    // Hide UI when linked to a package (unless package was deleted)
    hidePricing: isLinked && !packageDeleted,
    hidePaymentSchedule: isLinked && !packageDeleted,
    hideBookingDetails: isLinked && !packageDeleted,
    packageUrl,
    packagePricingUrl,
  }
}
