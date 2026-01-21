/**
 * Financial Summary React Query Hooks
 *
 * Provides hooks for fetching trip financial summaries including:
 * - Grand totals
 * - Per-traveller breakdown
 * - Activity costs
 * - Service fees
 * - Trip-Order PDF generation
 */

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  TripFinancialSummaryResponseDto,
  GenerateTripOrderDto,
  TripOrderResponseDto,
} from '@tailfire/shared-types/api'
import { useToast } from './use-toast'

// ============================================================================
// Query Keys
// ============================================================================

export const financialSummaryKeys = {
  all: ['financial-summary'] as const,
  byTrip: (tripId: string) => [...financialSummaryKeys.all, 'trip', tripId] as const,
  tripOrder: (tripId: string) => [...financialSummaryKeys.all, 'trip-order', tripId] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch financial summary for a trip
 */
export function useTripFinancialSummary(
  tripId: string,
  options?: Omit<UseQueryOptions<TripFinancialSummaryResponseDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: financialSummaryKeys.byTrip(tripId),
    queryFn: async () => {
      return api.get<TripFinancialSummaryResponseDto>(`/trips/${tripId}/financial-summary`)
    },
    enabled: !!tripId,
    ...options,
  })
}

// ============================================================================
// Mutations (DEPRECATED - use hooks from use-trip-orders.ts instead)
// ============================================================================

/**
 * Generate Trip-Order PDF
 *
 * @deprecated Use `useGenerateTripOrderSnapshot` from `use-trip-orders.ts` instead.
 * The new snapshot-based flow stores versioned invoices and supports preview before sending.
 * This legacy endpoint generates live PDFs without persistence.
 */
export function useGenerateTripOrder(tripId: string) {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      agencyId,
      options,
    }: {
      agencyId: string
      options?: GenerateTripOrderDto
    }) => {
      return api.post<TripOrderResponseDto>(`/trips/${tripId}/trip-order`, {
        agencyId,
        ...options,
      })
    },
    onSuccess: () => {
      toast({
        title: 'Trip-Order generated',
        description: 'Your Trip-Order PDF has been generated successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate Trip-Order',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Download Trip-Order PDF directly (returns binary data)
 *
 * @deprecated Use `useDownloadStoredTripOrder` from `use-trip-orders.ts` instead.
 * The new snapshot-based flow downloads from stored snapshots with version tracking.
 * This legacy endpoint generates live PDFs without persistence.
 */
export function useDownloadTripOrder(tripId: string) {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      agencyId,
      options,
    }: {
      agencyId: string
      options?: GenerateTripOrderDto
    }) => {
      const response = await fetch(`/api/trips/${tripId}/trip-order/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agencyId, ...options }),
      })

      if (!response.ok) {
        throw new Error('Failed to download Trip-Order')
      }

      return response.blob()
    },
    onSuccess: (blob) => {
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `trip-order-${tripId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Trip-Order downloaded',
        description: 'Your Trip-Order PDF has been downloaded.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to download Trip-Order',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}
