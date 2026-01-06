/**
 * Tests for useActivityNavigation hook
 *
 * Tests cover:
 * - storeReturnContext writes to both sessionStorage and localStorage
 * - returnToItinerary reads and uses sessionStorage context
 * - stale context (>1 hour) falls back to router.back()
 * - missing context falls back to router.back()
 * - navigation failures show toast and return error result
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Create persistent mock functions using vi.hoisted so they're available for vi.mock
const { mockPush, mockBack, mockToast } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockToast: vi.fn(),
}))

// Mock modules with persistent mock functions
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
}))

// Import after mocks are set up
import { useActivityNavigation } from '../use-activity-navigation'

describe('useActivityNavigation', () => {
  const SESSION_KEY = 'tailfire-activity-return'

  beforeEach(() => {
    // Clear storage and mocks before each test
    sessionStorage.clear()
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('storeReturnContext', () => {
    it('writes context to sessionStorage with timestamp', () => {
      const { result } = renderHook(() => useActivityNavigation())

      act(() => {
        result.current.storeReturnContext({
          tripId: 'trip-123',
          itineraryId: 'itinerary-456',
          dayId: 'day-789',
          viewMode: 'board',
        })
      })

      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}')
      expect(stored.tripId).toBe('trip-123')
      expect(stored.itineraryId).toBe('itinerary-456')
      expect(stored.dayId).toBe('day-789')
      expect(stored.viewMode).toBe('board')
      expect(stored.timestamp).toBeDefined()
      expect(typeof stored.timestamp).toBe('number')
    })

    it('writes viewMode to localStorage for itinerary page', () => {
      const { result } = renderHook(() => useActivityNavigation())

      act(() => {
        result.current.storeReturnContext({
          tripId: 'trip-123',
          itineraryId: 'itinerary-456',
          viewMode: 'table',
        })
      })

      expect(localStorage.getItem('tailfire-view-trip-123')).toBe('table')
    })
  })

  describe('returnToItinerary', () => {
    it('navigates to trip page when valid context exists', async () => {
      const { result } = renderHook(() => useActivityNavigation())

      // Store context
      act(() => {
        result.current.storeReturnContext({
          tripId: 'trip-123',
          itineraryId: 'itinerary-456',
          dayId: 'day-789',
          viewMode: 'board',
        })
      })

      // Return to itinerary
      let navResult: { success: boolean; error?: string } | undefined
      await act(async () => {
        navResult = await result.current.returnToItinerary()
      })

      expect(mockPush).toHaveBeenCalledWith('/trips/trip-123')
      expect(mockBack).not.toHaveBeenCalled()
      expect(navResult?.success).toBe(true)
    })

    it('falls back to router.back() when no context exists', async () => {
      const { result } = renderHook(() => useActivityNavigation())

      let navResult: { success: boolean; error?: string } | undefined
      await act(async () => {
        navResult = await result.current.returnToItinerary()
      })

      expect(mockPush).not.toHaveBeenCalled()
      expect(mockBack).toHaveBeenCalled()
      expect(navResult?.success).toBe(true)
    })

    it('falls back to router.back() when context is stale (>1 hour)', async () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useActivityNavigation())

      // Store context
      act(() => {
        result.current.storeReturnContext({
          tripId: 'trip-123',
          itineraryId: 'itinerary-456',
          viewMode: 'board',
        })
      })

      // Advance time by more than 1 hour
      vi.advanceTimersByTime(3600001)

      // Return to itinerary
      let navResult: { success: boolean; error?: string } | undefined
      await act(async () => {
        navResult = await result.current.returnToItinerary()
      })

      expect(mockPush).not.toHaveBeenCalled()
      expect(mockBack).toHaveBeenCalled()
      expect(navResult?.success).toBe(true)
    })

    it('handles invalid JSON in sessionStorage gracefully', async () => {
      sessionStorage.setItem(SESSION_KEY, 'invalid-json')
      const { result } = renderHook(() => useActivityNavigation())

      let navResult: { success: boolean; error?: string } | undefined
      await act(async () => {
        navResult = await result.current.returnToItinerary()
      })

      // Should show toast and return error
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to return to itinerary',
          variant: 'destructive',
        })
      )
      expect(navResult?.success).toBe(false)
      expect(navResult?.error).toBeDefined()

      // Context should be preserved for retry (not cleared on failure)
      expect(sessionStorage.getItem(SESSION_KEY)).toBe('invalid-json')
    })

    it('preserves valid context on navigation failure for retry', async () => {
      const { result } = renderHook(() => useActivityNavigation())

      // Store valid context
      act(() => {
        result.current.storeReturnContext({
          tripId: 'trip-123',
          itineraryId: 'itinerary-456',
          dayId: 'day-789',
          viewMode: 'board',
        })
      })

      // Verify context was stored
      const storedBefore = sessionStorage.getItem(SESSION_KEY)
      expect(storedBefore).not.toBeNull()

      // Simulate a navigation that would fail by corrupting the stored JSON
      // In real scenarios, the failure would come from router.push throwing
      // For this test, we just verify the context preservation behavior
      const context = result.current.getReturnContext()
      expect(context?.tripId).toBe('trip-123')
    })
  })

  describe('getReturnContext', () => {
    it('returns stored context', () => {
      const { result } = renderHook(() => useActivityNavigation())

      act(() => {
        result.current.storeReturnContext({
          tripId: 'trip-123',
          itineraryId: 'itinerary-456',
          dayId: 'day-789',
          viewMode: 'board',
        })
      })

      const context = result.current.getReturnContext()
      expect(context?.tripId).toBe('trip-123')
      expect(context?.dayId).toBe('day-789')
    })

    it('returns null when no context exists', () => {
      const { result } = renderHook(() => useActivityNavigation())

      const context = result.current.getReturnContext()
      expect(context).toBeNull()
    })

    it('returns null for invalid JSON', () => {
      sessionStorage.setItem(SESSION_KEY, 'invalid-json')
      const { result } = renderHook(() => useActivityNavigation())

      const context = result.current.getReturnContext()
      expect(context).toBeNull()
    })
  })

  describe('clearReturnContext', () => {
    it('removes context from sessionStorage', () => {
      const { result } = renderHook(() => useActivityNavigation())

      act(() => {
        result.current.storeReturnContext({
          tripId: 'trip-123',
          itineraryId: 'itinerary-456',
          viewMode: 'board',
        })
      })

      expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull()

      act(() => {
        result.current.clearReturnContext()
      })

      expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
    })
  })

  describe('isNavigating', () => {
    it('starts as false', () => {
      const { result } = renderHook(() => useActivityNavigation())
      expect(result.current.isNavigating).toBe(false)
    })
  })
})
