import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  DiningActivityDto,
  CreateDiningActivityDto,
  UpdateDiningActivityDto,
} from '@tailfire/shared-types/api'
import { itineraryDayKeys } from './use-itinerary-days'
import { bookingKeys } from './use-bookings'
import { useToast } from './use-toast'

// Query Keys
export const diningKeys = {
  all: ['dining'] as const,
  details: () => [...diningKeys.all, 'detail'] as const,
  detail: (id: string) => [...diningKeys.details(), id] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch a single dining by ID
 */
export function useDining(id: string) {
  return useQuery({
    queryKey: diningKeys.detail(id),
    queryFn: async () => api.get<DiningActivityDto>(`/activities/dining/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new dining
 * Optimistically updates the day's activity list
 */
export function useCreateDining(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateDiningActivityDto) => {
      return api.post<DiningActivityDto>('/activities/dining', data)
    },
    onSuccess: (_newDining) => {
      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
      // Invalidate bookings cache (new dining affects unlinked activities list)
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create dining reservation. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing dining
 */
export function useUpdateDining(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDiningActivityDto }) => {
      return api.patch<DiningActivityDto>(`/activities/dining/${id}`, data)
    },
    onSuccess: (updatedDining) => {
      // Update the dining detail query
      queryClient.setQueryData(diningKeys.detail(updatedDining.id), updatedDining)

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
      // Invalidate bookings cache (dining pricing updates affect bookings tab)
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to update dining reservation. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a dining
 */
export function useDeleteDining(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/dining/${id}`)
    },
    onSuccess: (_, id) => {
      // Remove from dining detail cache
      void queryClient.removeQueries({ queryKey: diningKeys.detail(id) })

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
      // Invalidate bookings cache (deleted dining affects unlinked activities list)
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete dining reservation. Please try again.',
        variant: 'destructive',
      })
    },
  })
}
