/**
 * Smart Date Range Hook
 *
 * Auto-adjusts TO date when FROM date changes to maintain valid ranges.
 * Supports multiple strategies for different use cases.
 *
 * ## Strategies
 * | Strategy | Behavior |
 * |----------|----------|
 * | `minimum` | Sets TO = FROM + minDuration when FROM invalidates range |
 * | `maintain-duration` | Preserves original duration when FROM changes |
 * | `none` | No auto-adjustment, shows validation error if invalid |
 *
 * ## Duration Semantics
 * | minDuration | Valid Example | Use Case |
 * |-------------|---------------|----------|
 * | 0 | Jan 15 → Jan 15 | Same-day flights |
 * | 1 | Jan 15 → Jan 16 | 1-night hotel stay |
 * | 7 | Jan 15 → Jan 22 | Week-long package |
 *
 * ## Key Behaviors
 * - `setFromDate`: May auto-adjust TO based on strategy
 * - `setToDate`: Validates only, does NOT auto-adjust (preserves user intent)
 * - `setDates`: Sets both atomically (useful for form resets)
 *
 * @see docs/date-picker-components.md - Full documentation
 * @see DateRangeInput - Component using this hook
 */

import { useState, useCallback, useRef } from 'react'
import { getDaysDifference, addDaysToISODate } from '@/lib/date-utils'

export type DateRangeStrategy = 'minimum' | 'maintain-duration' | 'none'

export interface SmartDateRangeConfig {
  /**
   * Minimum duration in days between FROM and TO dates
   * - 0: Same day allowed (e.g., flights)
   * - 1: Next day minimum (e.g., hotels - 1 night stay)
   * - N: N days minimum
   * @default 0
   */
  minDuration?: number

  /**
   * Auto-adjustment strategy
   * @default 'minimum'
   */
  strategy?: DateRangeStrategy

  /**
   * Callback when dates change
   */
  onChange?: (fromDate: string | null, toDate: string | null) => void
}

export interface SmartDateRangeReturn {
  /**
   * Current FROM date (ISO string)
   */
  fromDate: string | null

  /**
   * Current TO date (ISO string)
   */
  toDate: string | null

  /**
   * Whether the current range is valid
   */
  isValid: boolean

  /**
   * Validation error message (if invalid)
   */
  errorMessage: string | null

  /**
   * Set FROM date (may auto-adjust TO date)
   */
  setFromDate: (date: string | null) => void

  /**
   * Set TO date (validates against FROM date)
   */
  setToDate: (date: string | null) => void

  /**
   * Set both dates at once
   */
  setDates: (fromDate: string | null, toDate: string | null) => void

  /**
   * Clear both dates
   */
  clear: () => void

  /**
   * Current duration in days (null if either date is missing)
   */
  duration: number | null
}

/**
 * Hook for managing smart date ranges with auto-adjustment
 *
 * @example
 * ```tsx
 * // Flight booking (same-day allowed)
 * const { fromDate, toDate, setFromDate, setToDate } = useSmartDateRange({
 *   minDuration: 0,
 *   strategy: 'minimum',
 *   onChange: (from, to) => {
 *     setValue('departureDate', from)
 *     setValue('returnDate', to)
 *   }
 * })
 *
 * // Hotel booking (minimum 1 night)
 * const { fromDate, toDate, setFromDate, setToDate } = useSmartDateRange({
 *   minDuration: 1,
 *   strategy: 'minimum'
 * })
 * ```
 */
export function useSmartDateRange({
  minDuration = 0,
  strategy = 'minimum',
  onChange,
}: SmartDateRangeConfig = {}): SmartDateRangeReturn {
  const [fromDate, setFromDateInternal] = useState<string | null>(null)
  const [toDate, setToDateInternal] = useState<string | null>(null)
  const [isValid, setIsValid] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Track original duration for 'maintain-duration' strategy
  const originalDurationRef = useRef<number | null>(null)

  // Calculate current duration
  const duration =
    fromDate && toDate ? getDaysDifference(fromDate, toDate) : null

  // Validate range
  const validateRange = useCallback(
    (from: string | null, to: string | null): boolean => {
      if (!from || !to) {
        setIsValid(true)
        setErrorMessage(null)
        return true
      }

      const diff = getDaysDifference(from, to)
      if (diff === null) {
        setIsValid(false)
        setErrorMessage('Invalid date range')
        return false
      }

      if (diff < minDuration) {
        setIsValid(false)
        const minText = minDuration === 0 ? 'same day' : `${minDuration} day${minDuration > 1 ? 's' : ''}`
        setErrorMessage(`Minimum duration: ${minText}`)
        return false
      }

      setIsValid(true)
      setErrorMessage(null)
      return true
    },
    [minDuration]
  )

  // Auto-adjust TO date based on strategy
  const adjustToDate = useCallback(
    (from: string | null): string | null => {
      if (!from || strategy === 'none') return toDate

      // If no TO date yet, set minimum duration
      if (!toDate) {
        return addDaysToISODate(from, minDuration)
      }

      const diff = getDaysDifference(from, toDate)
      if (diff === null) return toDate

      // If range is valid, no adjustment needed
      if (diff >= minDuration) {
        return toDate
      }

      // Range is invalid (FROM > TO or duration < minimum)
      if (strategy === 'minimum') {
        // Set TO to FROM + minimum duration
        return addDaysToISODate(from, minDuration)
      } else if (strategy === 'maintain-duration') {
        // Preserve original duration if available
        if (originalDurationRef.current !== null && originalDurationRef.current >= minDuration) {
          return addDaysToISODate(from, originalDurationRef.current)
        }
        // Fallback to minimum duration
        return addDaysToISODate(from, minDuration)
      }

      // strategy === 'none'
      return toDate
    },
    [toDate, minDuration, strategy]
  )

  /**
   * Set FROM date (may auto-adjust TO date)
   */
  const setFromDate = useCallback(
    (date: string | null) => {
      setFromDateInternal(date)

      if (!date) {
        // FROM cleared, keep TO as-is
        validateRange(null, toDate)
        if (onChange) onChange(null, toDate)
        return
      }

      // Auto-adjust TO date based on strategy
      const adjustedToDate = adjustToDate(date)
      if (adjustedToDate !== toDate) {
        setToDateInternal(adjustedToDate)
      }

      validateRange(date, adjustedToDate)
      if (onChange) onChange(date, adjustedToDate)
    },
    [toDate, adjustToDate, validateRange, onChange]
  )

  /**
   * Set TO date (validates against FROM date, no auto-adjustment)
   * Only validates - does NOT auto-adjust. User manual input is preserved.
   */
  const setToDate = useCallback(
    (date: string | null) => {
      setToDateInternal(date)

      // Update original duration for 'maintain-duration' strategy
      // Only store if valid (>= minDuration)
      if (fromDate && date) {
        const diff = getDaysDifference(fromDate, date)
        if (diff !== null && diff >= minDuration) {
          originalDurationRef.current = diff
        }
      }

      // Validate but don't auto-adjust - preserve user intent
      validateRange(fromDate, date)
      if (onChange) {
        onChange(fromDate, date)
      }
    },
    [fromDate, minDuration, validateRange, onChange]
  )

  /**
   * Set both dates at once
   */
  const setDates = useCallback(
    (from: string | null, to: string | null) => {
      setFromDateInternal(from)
      setToDateInternal(to)

      // Update original duration
      if (from && to) {
        const diff = getDaysDifference(from, to)
        if (diff !== null && diff >= minDuration) {
          originalDurationRef.current = diff
        }
      }

      validateRange(from, to)
      if (onChange) onChange(from, to)
    },
    [minDuration, validateRange, onChange]
  )

  /**
   * Clear both dates
   */
  const clear = useCallback(() => {
    setFromDateInternal(null)
    setToDateInternal(null)
    setIsValid(true)
    setErrorMessage(null)
    originalDurationRef.current = null
    if (onChange) onChange(null, null)
  }, [onChange])

  return {
    fromDate,
    toDate,
    isValid,
    errorMessage,
    setFromDate,
    setToDate,
    setDates,
    clear,
    duration,
  }
}
