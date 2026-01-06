import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  LodgingActivityDto,
  CreateLodgingActivityDto,
  UpdateLodgingActivityDto,
} from '@tailfire/shared-types/api'
import { itineraryDayKeys } from './use-itinerary-days'
import { useToast } from './use-toast'

// Query Keys
export const lodgingKeys = {
  all: ['lodging'] as const,
  details: () => [...lodgingKeys.all, 'detail'] as const,
  detail: (id: string) => [...lodgingKeys.details(), id] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch a single lodging by ID
 */
export function useLodging(id: string) {
  return useQuery({
    queryKey: lodgingKeys.detail(id),
    queryFn: async () => api.get<LodgingActivityDto>(`/activities/lodging/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new lodging
 * Optimistically updates the day's activity list
 */
export function useCreateLodging(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateLodgingActivityDto) => {
      return api.post<LodgingActivityDto>('/activities/lodging', data)
    },
    onSuccess: (_newLodging) => {
      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create lodging. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing lodging
 */
export function useUpdateLodging(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLodgingActivityDto }) => {
      return api.patch<LodgingActivityDto>(`/activities/lodging/${id}`, data)
    },
    onSuccess: (updatedLodging) => {
      // Update the lodging detail query
      queryClient.setQueryData(lodgingKeys.detail(updatedLodging.id), updatedLodging)

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to update lodging. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a lodging
 */
export function useDeleteLodging(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/lodging/${id}`)
    },
    onSuccess: (_, id) => {
      // Remove from lodging detail cache
      void queryClient.removeQueries({ queryKey: lodgingKeys.detail(id) })

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete lodging. Please try again.',
        variant: 'destructive',
      })
    },
  })
}
