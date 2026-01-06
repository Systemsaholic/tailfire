/**
 * Trip Notifications React Query Hooks
 *
 * Provides hooks for fetching and managing trip notifications including:
 * - Payment reminders
 * - Overdue alerts
 * - System notifications
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TripNotificationResponseDto } from '@tailfire/shared-types/api'
import { useToast } from './use-toast'

// ============================================================================
// Query Keys
// ============================================================================

export const tripNotificationKeys = {
  all: ['trip-notifications'] as const,
  byTrip: (tripId: string) => [...tripNotificationKeys.all, 'trip', tripId] as const,
  unread: (tripId: string) => [...tripNotificationKeys.all, 'trip', tripId, 'unread'] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch all notifications for a trip
 */
export function useTripNotifications(tripId: string, options?: { unreadOnly?: boolean }) {
  return useQuery({
    queryKey: options?.unreadOnly
      ? tripNotificationKeys.unread(tripId)
      : tripNotificationKeys.byTrip(tripId),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.unreadOnly) {
        params.set('unread', 'true')
      }
      const queryString = params.toString()
      const url = `/trips/${tripId}/notifications${queryString ? `?${queryString}` : ''}`
      return api.get<TripNotificationResponseDto[]>(url)
    },
    enabled: !!tripId,
  })
}

/**
 * Get count of unread notifications for a trip
 */
export function useUnreadNotificationCount(tripId: string) {
  const { data: notifications } = useTripNotifications(tripId, { unreadOnly: true })
  return notifications?.length ?? 0
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Mark a notification as read
 */
export function useMarkNotificationRead(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return api.patch<TripNotificationResponseDto>(
        `/trip-notifications/${notificationId}/read`,
        {}
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripNotificationKeys.byTrip(tripId) })
      queryClient.invalidateQueries({ queryKey: tripNotificationKeys.unread(tripId) })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to mark notification',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Mark all notifications as read for a trip
 */
export function useMarkAllNotificationsRead(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      return api.post(`/trips/${tripId}/notifications/mark-all-read`, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripNotificationKeys.byTrip(tripId) })
      queryClient.invalidateQueries({ queryKey: tripNotificationKeys.unread(tripId) })
      toast({
        title: 'Notifications cleared',
        description: 'All notifications have been marked as read.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to mark notifications',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a notification
 */
export function useDeleteNotification(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return api.delete(`/trip-notifications/${notificationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripNotificationKeys.byTrip(tripId) })
      queryClient.invalidateQueries({ queryKey: tripNotificationKeys.unread(tripId) })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete notification',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}
