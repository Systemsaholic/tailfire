/**
 * Booking Status React Query Hooks
 *
 * Provides hooks for fetching trip booking status including:
 * - Per-activity payment status
 * - Per-activity commission status
 * - Summary metrics (overdue, upcoming)
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TripBookingStatusResponseDto } from '@tailfire/shared-types/api'

// ============================================================================
// Query Keys
// ============================================================================

export const bookingStatusKeys = {
  all: ['booking-status'] as const,
  byTrip: (tripId: string) => [...bookingStatusKeys.all, 'trip', tripId] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch booking status for all activities in a trip
 */
export function useBookingStatus(
  tripId: string,
  options?: Omit<UseQueryOptions<TripBookingStatusResponseDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: bookingStatusKeys.byTrip(tripId),
    queryFn: async () => {
      return api.get<TripBookingStatusResponseDto>(`/trips/${tripId}/booking-status`)
    },
    enabled: !!tripId,
    ...options,
  })
}
