import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  PortInfoActivityDto,
  CreatePortInfoActivityDto,
  UpdatePortInfoActivityDto,
} from '@tailfire/shared-types/api'
import { itineraryDayKeys } from './use-itinerary-days'
import { useToast } from './use-toast'

// Query Keys
export const portInfoKeys = {
  all: ['port-info'] as const,
  details: () => [...portInfoKeys.all, 'detail'] as const,
  detail: (id: string) => [...portInfoKeys.details(), id] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch a single port info by ID
 */
export function usePortInfo(id: string) {
  return useQuery({
    queryKey: portInfoKeys.detail(id),
    queryFn: async () => api.get<PortInfoActivityDto>(`/activities/port-info/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new port info
 * Optimistically updates the day's activity list
 */
export function useCreatePortInfo(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreatePortInfoActivityDto) => {
      return api.post<PortInfoActivityDto>('/activities/port-info', data)
    },
    onSuccess: () => {
      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create port info. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing port info
 */
export function useUpdatePortInfo(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePortInfoActivityDto }) => {
      return api.patch<PortInfoActivityDto>(`/activities/port-info/${id}`, data)
    },
    onSuccess: (updatedPortInfo) => {
      // Update the port info detail query
      queryClient.setQueryData(portInfoKeys.detail(updatedPortInfo.id), updatedPortInfo)

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to update port info. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a port info
 */
export function useDeletePortInfo(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/port-info/${id}`)
    },
    onSuccess: (_, id) => {
      // Remove from port info detail cache
      void queryClient.removeQueries({ queryKey: portInfoKeys.detail(id) })

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete port info. Please try again.',
        variant: 'destructive',
      })
    },
  })
}
