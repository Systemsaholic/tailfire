'use client'

import { useMemo } from 'react'
import type { ItineraryDayWithActivitiesDto } from '@tailfire/shared-types/api'
import {
  processSpanningActivities,
  type SpanningActivitiesResult,
} from '@/lib/spanning-activity-utils'

/**
 * Hook for processing itinerary days to categorize spanning and non-spanning activities.
 *
 * Uses memoization to avoid recalculating on every render during drag-and-drop
 * or other frequent updates.
 *
 * @param days - Array of itinerary days with their activities, sorted by dayNumber
 * @returns Categorized activities with span metadata
 *
 * @example
 * ```tsx
 * const { spanningActivities, dayActivities, childActivitiesByParent } = useSpanningActivities(days)
 *
 * // Render spanning layer only if there are spanning activities
 * {spanningActivities.length > 0 && (
 *   <SpanningActivitiesLayer activities={spanningActivities} days={days} />
 * )}
 *
 * // Render day columns with filtered activities
 * {days.map(day => (
 *   <DayColumn
 *     key={day.id}
 *     day={day}
 *     activities={dayActivities.get(day.id) || []}
 *   />
 * ))}
 * ```
 */
export function useSpanningActivities(
  days: ItineraryDayWithActivitiesDto[]
): SpanningActivitiesResult {
  return useMemo(() => {
    if (!days || days.length === 0) {
      return {
        spanningActivities: [],
        dayActivities: new Map(),
        childActivitiesByParent: new Map(),
      }
    }

    return processSpanningActivities(days)
  }, [days])
}

/**
 * Check if there are any spanning activities in the result.
 * Useful for conditionally rendering the spanning layer.
 */
export function hasSpanningActivities(result: SpanningActivitiesResult): boolean {
  return result.spanningActivities.length > 0
}
