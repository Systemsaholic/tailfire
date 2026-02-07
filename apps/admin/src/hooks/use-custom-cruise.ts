import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CustomCruiseActivityDto,
  CreateCustomCruiseActivityDto,
  UpdateCustomCruiseActivityDto,
  PortInfoActivityDto,
} from '@tailfire/shared-types/api'
import { itineraryDayKeys } from './use-itinerary-days'
import { bookingKeys } from './use-bookings'
import { useToast } from './use-toast'

// Query Keys
export const customCruiseKeys = {
  all: ['custom-cruise'] as const,
  details: () => [...customCruiseKeys.all, 'detail'] as const,
  detail: (id: string) => [...customCruiseKeys.details(), id] as const,
  portSchedule: (cruiseId: string) => [...customCruiseKeys.all, 'port-schedule', cruiseId] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch a single custom cruise component by ID
 */
export function useCustomCruise(id: string) {
  return useQuery({
    queryKey: customCruiseKeys.detail(id),
    queryFn: async () => api.get<CustomCruiseActivityDto>(`/activities/custom-cruise/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new custom cruise component
 * Optimistically updates the day's activity list
 */
export function useCreateCustomCruise(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateCustomCruiseActivityDto) => {
      return api.post<CustomCruiseActivityDto>('/activities/custom-cruise', data)
    },
    onSuccess: () => {
      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
      // Invalidate bookings cache (new cruise affects unlinked activities list)
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create cruise. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing custom cruise component
 */
export function useUpdateCustomCruise(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomCruiseActivityDto }) => {
      return api.patch<CustomCruiseActivityDto>(`/activities/custom-cruise/${id}`, data)
    },
    onSuccess: (updatedCruise) => {
      // Update the cruise detail query
      queryClient.setQueryData(customCruiseKeys.detail(updatedCruise.id), updatedCruise)

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
      // Invalidate bookings cache (cruise pricing updates affect bookings tab)
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to update cruise. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a custom cruise component
 */
export function useDeleteCustomCruise(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/custom-cruise/${id}`)
    },
    onSuccess: (_, id) => {
      // Remove from cruise detail cache
      void queryClient.removeQueries({ queryKey: customCruiseKeys.detail(id) })

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
      // Invalidate bookings cache (deleted cruise affects unlinked activities list)
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete cruise. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Create Port Info components from a cruise's port calls JSON
 */
export function useCreatePortEntriesFromCruise(itineraryId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (cruiseId: string) => {
      return api.post<{ created: string[]; skipped: number }>(
        `/activities/custom-cruise/${cruiseId}/create-port-entries`
      )
    },
    onSuccess: (result) => {
      // Invalidate day lists to show new port info components
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })

      toast({
        title: 'Port entries created',
        description: `Created ${result.created.length} port info entries${result.skipped > 0 ? ` (${result.skipped} sea days skipped)` : ''}.`,
      })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create port entries. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Generate port schedule from cruise dates
 * Auto-creates port_info activities for each day of the cruise,
 * with departure/arrival/sea_day types
 */
export function useGenerateCruisePortSchedule(itineraryId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (cruiseId: string) => {
      return api.post<{ created: PortInfoActivityDto[]; deleted: number }>(
        `/activities/custom-cruise/${cruiseId}/generate-port-schedule`
      )
    },
    onSuccess: (result, cruiseId) => {
      // Invalidate day lists to show new port info components
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
      // Invalidate the port schedule query for this cruise
      void queryClient.invalidateQueries({ queryKey: customCruiseKeys.portSchedule(cruiseId) })

      const message = result.deleted > 0
        ? `Regenerated schedule: ${result.created.length} port entries created (${result.deleted} previous entries removed).`
        : `Created ${result.created.length} port entries for the cruise itinerary.`

      toast({
        title: 'Port schedule generated',
        description: message,
      })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to generate port schedule. Please ensure the cruise has start and end dates.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Get port schedule for a cruise
 * Returns all port_info activities linked to this cruise
 */
export function useCruisePortSchedule(cruiseId: string | undefined) {
  return useQuery({
    queryKey: customCruiseKeys.portSchedule(cruiseId ?? ''),
    queryFn: async () => api.get<PortInfoActivityDto[]>(
      `/activities/custom-cruise/${cruiseId}/port-schedule`
    ),
    enabled: !!cruiseId,
  })
}
