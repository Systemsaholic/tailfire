import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  TransportationActivityDto,
  CreateTransportationActivityDto,
  UpdateTransportationActivityDto,
} from '@tailfire/shared-types/api'
import { itineraryDayKeys } from './use-itinerary-days'
import { useToast } from './use-toast'

// Query Keys
export const transportationKeys = {
  all: ['transportation'] as const,
  details: () => [...transportationKeys.all, 'detail'] as const,
  detail: (id: string) => [...transportationKeys.details(), id] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch a single transportation by ID
 */
export function useTransportation(id: string) {
  return useQuery({
    queryKey: transportationKeys.detail(id),
    queryFn: async () => api.get<TransportationActivityDto>(`/activities/transportation/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new transportation
 * Optimistically updates the day's activity list
 */
export function useCreateTransportation(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateTransportationActivityDto) => {
      return api.post<TransportationActivityDto>('/activities/transportation', data)
    },
    onSuccess: (_newTransportation) => {
      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create transportation. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing transportation
 */
export function useUpdateTransportation(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransportationActivityDto }) => {
      return api.patch<TransportationActivityDto>(`/activities/transportation/${id}`, data)
    },
    onSuccess: (updatedTransportation) => {
      // Update the transportation detail query
      queryClient.setQueryData(transportationKeys.detail(updatedTransportation.id), updatedTransportation)

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to update transportation. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a transportation
 */
export function useDeleteTransportation(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/transportation/${id}`)
    },
    onSuccess: (_, id) => {
      // Remove from transportation detail cache
      void queryClient.removeQueries({ queryKey: transportationKeys.detail(id) })

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete transportation. Please try again.',
        variant: 'destructive',
      })
    },
  })
}
