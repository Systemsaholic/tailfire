/**
 * Tour Activity Hooks
 *
 * Wraps the generic activity API for tour-specific operations.
 * Tours use the /days/:dayId/activities endpoint with activityType: 'tour'.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ActivityResponseDto } from '@tailfire/shared-types/api'
import { activityKeys } from './use-activities'
import { itineraryDayKeys } from './use-itinerary-days'
import { useToast } from './use-toast'
import type { TourFormData } from '@/lib/validation/tour-validation'
import { toTourApiPayload } from '@/lib/validation/tour-validation'

// Query Keys
export const tourKeys = {
  all: ['tours'] as const,
  details: () => [...tourKeys.all, 'detail'] as const,
  detail: (dayId: string, id: string) => [...tourKeys.details(), dayId, id] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch a single tour by ID
 * Uses the generic activity endpoint
 */
export function useTour(dayId: string | null, id: string | null) {
  return useQuery({
    queryKey: tourKeys.detail(dayId || '', id || ''),
    queryFn: async () => api.get<ActivityResponseDto>(`/days/${dayId}/activities/${id}`),
    enabled: !!dayId && !!id,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new tour
 * Uses the generic activity API with activityType: 'tour'
 */
export function useCreateTour(itineraryId: string, dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: TourFormData) => {
      const payload = toTourApiPayload(data)
      return api.post<ActivityResponseDto>(`/days/${dayId}/activities`, payload)
    },
    onSuccess: () => {
      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: activityKeys.byDay(dayId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create tour. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing tour
 */
export function useUpdateTour(itineraryId: string, dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TourFormData }) => {
      const payload = toTourApiPayload(data)
      return api.patch<ActivityResponseDto>(`/days/${dayId}/activities/${id}`, payload)
    },
    onSuccess: (updatedTour) => {
      // Update the tour detail query
      queryClient.setQueryData(tourKeys.detail(dayId, updatedTour.id), updatedTour)

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: activityKeys.byDay(dayId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to update tour. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a tour
 */
export function useDeleteTour(itineraryId: string, dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/days/${dayId}/activities/${id}`)
    },
    onSuccess: (_, id) => {
      // Remove from tour detail cache
      void queryClient.removeQueries({ queryKey: tourKeys.detail(dayId, id) })

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: activityKeys.byDay(dayId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete tour. Please try again.',
        variant: 'destructive',
      })
    },
  })
}
