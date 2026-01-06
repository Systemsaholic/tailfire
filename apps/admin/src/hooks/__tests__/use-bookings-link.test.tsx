/**
 * Tests for useLinkActivities and useUnlinkActivities hooks
 *
 * Tests cover:
 * - Query invalidation on successful link/unlink operations
 * - Verifies bookingKeys.unlinkedActivities() is invalidated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Create mock for api module using vi.hoisted
const { mockPost, mockDelete } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    post: mockPost,
    delete: mockDelete,
  },
}))

// Import after mocks
import { useLinkActivities, useUnlinkActivities, bookingKeys } from '../use-bookings'

describe('useLinkActivities', () => {
  let queryClient: QueryClient
  let invalidateSpy: ReturnType<typeof vi.spyOn>

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    Wrapper.displayName = 'TestQueryClientProvider'
    return Wrapper
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.clearAllMocks()
  })

  describe('query invalidation', () => {
    it('invalidates unlinkedActivities query using bookingKeys helper on success', async () => {
      const mockResult = { id: 'pkg-1', tripId: 'trip-123' }
      mockPost.mockResolvedValueOnce(mockResult)

      // Seed the cache with unlinked activities data
      queryClient.setQueryData(
        bookingKeys.unlinkedActivities('trip-123'),
        { activities: [{ id: 'act-1' }] }
      )

      const { result } = renderHook(() => useLinkActivities(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync({ bookingId: 'pkg-1', activityIds: ['act-1'] })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: bookingKeys.unlinkedActivities('trip-123'),
        })
      })
    })

    it('invalidates booking detail and lists on success', async () => {
      const mockResult = { id: 'pkg-1', tripId: 'trip-123' }
      mockPost.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useLinkActivities(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync({ bookingId: 'pkg-1', activityIds: ['act-1'] })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: bookingKeys.detail('pkg-1'),
        })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: bookingKeys.lists(),
        })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: bookingKeys.tripTotals('trip-123'),
        })
      })
    })

    it('invalidates activities and itineraryDays queries on success', async () => {
      const mockResult = { id: 'pkg-1', tripId: 'trip-123' }
      mockPost.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useLinkActivities(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync({ bookingId: 'pkg-1', activityIds: ['act-1'] })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['activities'],
        })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['itineraryDays'],
        })
      })
    })
  })
})

describe('useUnlinkActivities', () => {
  let queryClient: QueryClient
  let invalidateSpy: ReturnType<typeof vi.spyOn>

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    Wrapper.displayName = 'TestQueryClientProvider'
    return Wrapper
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.clearAllMocks()
  })

  describe('query invalidation', () => {
    it('invalidates unlinkedActivities query using bookingKeys helper on success', async () => {
      const mockResult = { id: 'pkg-1', tripId: 'trip-123' }
      mockDelete.mockResolvedValueOnce(mockResult)

      // Seed the cache with unlinked activities data
      queryClient.setQueryData(
        bookingKeys.unlinkedActivities('trip-123'),
        { activities: [] }
      )

      const { result } = renderHook(() => useUnlinkActivities(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync({ bookingId: 'pkg-1', activityIds: ['act-1'] })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: bookingKeys.unlinkedActivities('trip-123'),
        })
      })
    })

    it('invalidates booking detail and lists on success', async () => {
      const mockResult = { id: 'pkg-1', tripId: 'trip-123' }
      mockDelete.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useUnlinkActivities(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync({ bookingId: 'pkg-1', activityIds: ['act-1'] })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: bookingKeys.detail('pkg-1'),
        })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: bookingKeys.lists(),
        })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: bookingKeys.tripTotals('trip-123'),
        })
      })
    })
  })
})
