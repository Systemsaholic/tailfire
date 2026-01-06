'use client'

/**
 * Date Range Input Component
 *
 * Two coordinated date pickers (FROM/TO) with smart auto-adjustment.
 * Combines DatePickerEnhanced with useSmartDateRange hook.
 *
 * ## Key Features
 * - Auto-adjusts TO date when FROM changes (configurable strategy)
 * - Validation with visual error feedback
 * - Duration display (days or nights)
 * - Configurable for different use cases
 *
 * ## Use Cases & Configuration
 * | Use Case | minDuration | Strategy | Duration Label |
 * |----------|-------------|----------|----------------|
 * | Flights  | 0           | minimum  | "X days"       |
 * | Hotels   | 1           | minimum  | "X nights"     |
 * | Trips    | 1           | minimum  | "X nights"     |
 *
 * ## Strategies
 * - `minimum`: Sets TO = FROM + minDuration when FROM invalidates range
 * - `maintain-duration`: Preserves original duration when FROM changes
 * - `none`: No auto-adjustment, shows validation error
 *
 * @see docs/date-picker-components.md - Full documentation
 * @see useSmartDateRange - Underlying state management hook
 */

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { DatePickerEnhanced } from '@/components/ui/date-picker-enhanced'
import { useSmartDateRange, type DateRangeStrategy } from '@/hooks/use-smart-date-range'
import { cn } from '@/lib/utils'

export interface DateRangeInputProps {
  /**
   * Current FROM date value (ISO string)
   */
  fromValue?: string | null

  /**
   * Current TO date value (ISO string)
   */
  toValue?: string | null

  /**
   * Callback when dates change
   */
  onChange?: (fromDate: string | null, toDate: string | null) => void

  /**
   * Minimum duration in days
   * - 0: Same day allowed (e.g., flights)
   * - 1: Next day minimum (e.g., hotels - 1 night)
   * @default 0
   */
  minDuration?: number

  /**
   * Auto-adjustment strategy
   * @default 'minimum'
   */
  strategy?: DateRangeStrategy

  /**
   * FROM date label
   * @default 'From'
   */
  fromLabel?: string

  /**
   * TO date label
   * @default 'To'
   */
  toLabel?: string

  /**
   * FROM date placeholder
   * @default 'YYYY-MM-DD'
   */
  fromPlaceholder?: string

  /**
   * TO date placeholder
   * @default 'YYYY-MM-DD'
   */
  toPlaceholder?: string

  /**
   * Disabled state
   */
  disabled?: boolean

  /**
   * Show duration between dates
   * @default false
   */
  showDuration?: boolean

  /**
   * Duration label format
   * @default (days) => `${days} day${days !== 1 ? 's' : ''}`
   */
  formatDuration?: (days: number) => string

  /**
   * Minimum selectable FROM date (ISO string)
   */
  minFromDate?: string

  /**
   * Maximum selectable FROM date (ISO string)
   */
  maxFromDate?: string

  /**
   * Minimum selectable TO date (ISO string)
   */
  minToDate?: string

  /**
   * Maximum selectable TO date (ISO string)
   */
  maxToDate?: string

  /**
   * Additional CSS classes for the container
   */
  className?: string

  /**
   * Show labels
   * @default true
   */
  showLabels?: boolean
}

/**
 * Date Range Input Component with Smart Auto-Adjustment
 *
 * @example
 * ```tsx
 * // Flight booking (same-day return allowed)
 * <DateRangeInput
 *   fromValue={departureDate}
 *   toValue={returnDate}
 *   onChange={(from, to) => {
 *     setValue('departureDate', from)
 *     setValue('returnDate', to)
 *   }}
 *   minDuration={0}
 *   strategy="minimum"
 *   fromLabel="Departure"
 *   toLabel="Return"
 *   showDuration
 * />
 *
 * // Hotel booking (minimum 1 night)
 * <DateRangeInput
 *   fromValue={checkIn}
 *   toValue={checkOut}
 *   onChange={(from, to) => {
 *     setValue('checkIn', from)
 *     setValue('checkOut', to)
 *   }}
 *   minDuration={1}
 *   fromLabel="Check-in"
 *   toLabel="Check-out"
 *   showDuration
 *   formatDuration={(days) => `${days} night${days !== 1 ? 's' : ''}`}
 * />
 * ```
 */
export function DateRangeInput({
  fromValue,
  toValue,
  onChange,
  minDuration = 0,
  strategy = 'minimum',
  fromLabel = 'From',
  toLabel = 'To',
  fromPlaceholder = 'YYYY-MM-DD',
  toPlaceholder = 'YYYY-MM-DD',
  disabled = false,
  showDuration = false,
  formatDuration = (days) => `${days} day${days !== 1 ? 's' : ''}`,
  minFromDate,
  maxFromDate,
  minToDate,
  maxToDate,
  className,
  showLabels = true,
}: DateRangeInputProps) {
  // Track the last values we synced from props to avoid unnecessary updates
  const lastSyncedFromRef = React.useRef<string | null | undefined>(undefined)
  const lastSyncedToRef = React.useRef<string | null | undefined>(undefined)

  const {
    fromDate,
    toDate,
    isValid,
    errorMessage,
    setFromDate,
    setToDate,
    setDates,
    duration,
  } = useSmartDateRange({
    minDuration,
    strategy,
    // Don't pass onChange here - we'll call it manually to prevent loops
  })

  // Sync FROM external values TO internal state when props change
  // This handles form.reset() and programmatic setValue() calls
  React.useEffect(() => {
    // Normalize: treat empty string as null for comparison
    const normalizedFromValue = fromValue || null
    const normalizedToValue = toValue || null

    // Check if external props changed since last sync
    const fromChanged = normalizedFromValue !== lastSyncedFromRef.current
    const toChanged = normalizedToValue !== lastSyncedToRef.current

    if (fromChanged || toChanged) {
      // Update our tracking refs
      lastSyncedFromRef.current = normalizedFromValue
      lastSyncedToRef.current = normalizedToValue

      // Sync to internal state
      setDates(normalizedFromValue, normalizedToValue)
    }
  }, [fromValue, toValue, setDates])

  // Handler that syncs internal changes back to form
  const handleFromChange = React.useCallback((date: string | null) => {
    // Update tracking ref so we don't re-sync from props
    lastSyncedFromRef.current = date
    setFromDate(date)
    // Notify parent of change
    if (onChange) {
      onChange(date, toDate)
    }
  }, [setFromDate, onChange, toDate])

  const handleToChange = React.useCallback((date: string | null) => {
    // Update tracking ref so we don't re-sync from props
    lastSyncedToRef.current = date
    setToDate(date)
    if (onChange) {
      onChange(fromDate, date)
    }
  }, [setToDate, onChange, fromDate])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FROM Date */}
        <div className="space-y-2">
          {showLabels && (
            <Label htmlFor="from-date" className="text-sm font-medium">
              {fromLabel}
            </Label>
          )}
          <DatePickerEnhanced
            value={fromDate}
            onChange={handleFromChange}
            placeholder={fromPlaceholder}
            disabled={disabled}
            minDate={minFromDate}
            maxDate={maxFromDate}
            aria-label={`${fromLabel} date`}
          />
        </div>

        {/* TO Date */}
        <div className="space-y-2">
          {showLabels && (
            <Label htmlFor="to-date" className="text-sm font-medium">
              {toLabel}
            </Label>
          )}
          <DatePickerEnhanced
            value={toDate}
            onChange={handleToChange}
            placeholder={toPlaceholder}
            disabled={disabled}
            minDate={minToDate || fromDate || undefined}
            maxDate={maxToDate}
            aria-label={`${toLabel} date`}
          />
        </div>
      </div>

      {/* Duration Display */}
      {showDuration && duration !== null && duration >= 0 && (
        <div className="text-sm text-muted-foreground">
          Duration: <span className="font-medium">{formatDuration(duration)}</span>
        </div>
      )}

      {/* Validation Error */}
      {!isValid && errorMessage && (
        <div
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      )}
    </div>
  )
}
