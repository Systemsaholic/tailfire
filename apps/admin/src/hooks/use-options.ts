import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  OptionsActivityDto,
  CreateOptionsActivityDto,
  UpdateOptionsActivityDto,
} from '@tailfire/shared-types/api'
import { itineraryDayKeys } from './use-itinerary-days'
import { useToast } from './use-toast'

// Query Keys
export const optionsKeys = {
  all: ['options'] as const,
  details: () => [...optionsKeys.all, 'detail'] as const,
  detail: (id: string) => [...optionsKeys.details(), id] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch a single options component by ID
 */
export function useOptions(id: string) {
  return useQuery({
    queryKey: optionsKeys.detail(id),
    queryFn: async () => api.get<OptionsActivityDto>(`/activities/options/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new options component
 * Optimistically updates the day's activity list
 */
export function useCreateOptions(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateOptionsActivityDto) => {
      return api.post<OptionsActivityDto>('/activities/options', data)
    },
    onSuccess: () => {
      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create options. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing options component
 */
export function useUpdateOptions(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOptionsActivityDto }) => {
      return api.patch<OptionsActivityDto>(`/activities/options/${id}`, data)
    },
    onSuccess: (updatedOptions) => {
      // Update the options detail query
      queryClient.setQueryData(optionsKeys.detail(updatedOptions.id), updatedOptions)

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to update options. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete an options component
 */
export function useDeleteOptions(itineraryId: string, _dayId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/options/${id}`)
    },
    onSuccess: (_, id) => {
      // Remove from options detail cache
      void queryClient.removeQueries({ queryKey: optionsKeys.detail(id) })

      // Invalidate itinerary-specific day lists to refetch activities
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itineraryId) })
      void queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itineraryId) })
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete options. Please try again.',
        variant: 'destructive',
      })
    },
  })
}
