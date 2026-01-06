/**
 * Traveller Splits React Query Hooks
 *
 * Provides hooks for managing activity cost splits per traveller including:
 * - Fetching splits for an activity
 * - Updating split allocations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  ActivityTravellerSplitDto,
  SetActivitySplitsDto,
} from '@tailfire/shared-types/api'
import { useToast } from './use-toast'

// ============================================================================
// Query Keys
// ============================================================================

export const travellerSplitKeys = {
  all: ['traveller-splits'] as const,
  byActivity: (activityId: string) => [...travellerSplitKeys.all, 'activity', activityId] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch traveller splits for an activity
 */
export function useActivityTravellerSplits(activityId: string) {
  return useQuery({
    queryKey: travellerSplitKeys.byActivity(activityId),
    queryFn: async () => {
      return api.get<ActivityTravellerSplitDto[]>(`/activities/${activityId}/traveller-splits`)
    },
    enabled: !!activityId,
  })
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Set traveller splits for an activity (replaces all existing splits)
 */
export function useSetActivityTravellerSplits(activityId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: SetActivitySplitsDto) => {
      return api.put<ActivityTravellerSplitDto[]>(
        `/activities/${activityId}/traveller-splits`,
        data
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travellerSplitKeys.byActivity(activityId) })
      toast({
        title: 'Splits updated',
        description: 'Traveller cost splits have been updated successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update splits',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Distribute cost equally among all travellers on an activity
 */
export function useDistributeEqually(activityId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      return api.post<ActivityTravellerSplitDto[]>(
        `/activities/${activityId}/traveller-splits/distribute-equally`,
        {}
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travellerSplitKeys.byActivity(activityId) })
      toast({
        title: 'Costs distributed',
        description: 'Cost has been distributed equally among all travellers.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to distribute costs',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}
