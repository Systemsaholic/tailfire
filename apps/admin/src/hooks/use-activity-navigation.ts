'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

const SESSION_KEY = 'tailfire-activity-return'

interface ReturnContext {
  tripId: string
  itineraryId: string
  dayId?: string
  viewMode: 'board' | 'table'
  timestamp: number
}

interface NavigationResult {
  success: boolean
  error?: string
}

/**
 * Hook for managing navigation context when entering/exiting activity forms.
 *
 * Stores return context in sessionStorage before navigating to activity forms,
 * and uses it to return to the correct view mode and scroll position.
 *
 * Also updates localStorage view preference so trip-itinerary.tsx shows
 * the correct view on return (it already reads from localStorage on mount).
 */
export function useActivityNavigation() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  /**
   * Store return context before navigating to activity form.
   * Also updates localStorage so itinerary page shows correct view on return.
   */
  const storeReturnContext = useCallback((context: Omit<ReturnContext, 'timestamp'>) => {
    // Store full context in sessionStorage for return navigation
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...context,
      timestamp: Date.now(),
    }))

    // Also update localStorage view preference so itinerary page shows correct view
    // This key is already read by trip-itinerary.tsx on mount
    localStorage.setItem(`tailfire-view-${context.tripId}`, context.viewMode)
  }, [])

  /**
   * Navigate back to itinerary with proper view state.
   * View mode is restored via localStorage (read by trip-itinerary.tsx).
   * Day scroll position is restored via getReturnContext in trip-itinerary.tsx.
   *
   * On navigation failure, the return context is preserved so the user can retry.
   * Context is only cleared on successful navigation or when it becomes stale.
   *
   * @returns Promise that resolves with navigation result
   */
  const returnToItinerary = useCallback(async (): Promise<NavigationResult> => {
    const stored = sessionStorage.getItem(SESSION_KEY)

    try {
      setIsNavigating(true)

      if (stored) {
        const context: ReturnContext = JSON.parse(stored)
        // Check if context is stale (> 1 hour)
        if (Date.now() - context.timestamp < 3600000) {
          // Don't clear context yet - trip-itinerary needs it for scroll-to-day
          // It will be cleared after scroll is processed
          router.push(`/trips/${context.tripId}?tab=itinerary`)
          return { success: true }
        }
      }

      // Stale or no context - clear and fallback
      sessionStorage.removeItem(SESSION_KEY)
      router.back()
      return { success: true }
    } catch (e) {
      // Parse or navigation error
      // Note: We intentionally preserve the return context on failure so user can retry
      // The context will be cleared when:
      // 1. Navigation succeeds (trip-itinerary.tsx clears it after scroll-to-day)
      // 2. Context becomes stale (> 1 hour)
      // 3. User manually navigates away
      console.error('Navigation failed:', e)

      const errorMessage = e instanceof Error ? e.message : 'Navigation failed'
      toast({
        title: 'Failed to return to itinerary',
        description: 'Please navigate manually or try again.',
        variant: 'destructive',
      })

      setIsNavigating(false)
      return { success: false, error: errorMessage }
    }
  }, [router])

  /**
   * Get current return context (if any).
   * Used by trip-itinerary.tsx to scroll to the correct day on return.
   */
  const getReturnContext = useCallback((): ReturnContext | null => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  /**
   * Clear the return context.
   * Called by trip-itinerary.tsx after processing scroll-to-day.
   */
  const clearReturnContext = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  return {
    storeReturnContext,
    returnToItinerary,
    getReturnContext,
    clearReturnContext,
    isNavigating,
  }
}
