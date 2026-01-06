/**
 * Date Picker State Hook
 *
 * Manages state for date picker inputs with ISO format validation.
 * Prevents cursor jumping by using controlled state with debounced onChange.
 *
 * ## Design Principles
 * - ISO 8601 format only (YYYY-MM-DD) - no multi-format parsing
 * - Debounced onChange (300ms default) to prevent excessive re-renders
 * - Validation on blur, not on keystroke
 * - Clean separation: display value vs. validated Date object
 *
 * ## Key Methods
 * - `setDate(date)` - Set from calendar selection (immediate onChange)
 * - `handleInputChange(e)` - Handle typing (debounced onChange)
 * - `handleInputBlur()` - Validate and format on blur
 * - `syncFromProp(isoDate)` - Sync external changes WITHOUT triggering onChange
 *
 * @see docs/date-picker-components.md - Full documentation
 * @see DatePickerEnhanced - Component using this hook
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { parseISODate, formatISODate, isValidISODate } from '@/lib/date-utils'

export interface UseDatePickerStateOptions {
  /**
   * Initial date value (ISO string or Date object)
   */
  initialValue?: string | Date | null

  /**
   * Callback when date changes (after validation)
   * @param isoDate - ISO date string (YYYY-MM-DD) or null if invalid/empty
   */
  onChange?: (isoDate: string | null) => void

  /**
   * Debounce delay in milliseconds for onChange callback
   * @default 300
   */
  debounceMs?: number

  /**
   * Minimum allowed date (ISO string). If current value is before this,
   * it will be auto-cleared when minDate changes.
   */
  minDate?: string | null

  /**
   * Maximum allowed date (ISO string). If current value is after this,
   * it will be auto-cleared when maxDate changes.
   */
  maxDate?: string | null
}

export interface UseDatePickerStateReturn {
  /**
   * Current selected date (Date object or null)
   */
  selectedDate: Date | null

  /**
   * ISO date string (YYYY-MM-DD) for controlled input
   */
  isoValue: string

  /**
   * Whether the current input is valid
   */
  isValid: boolean

  /**
   * Set date from calendar selection
   */
  setDate: (date: Date | null) => void

  /**
   * Handle manual input changes (debounced)
   */
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void

  /**
   * Handle input blur (validates and formats)
   */
  handleInputBlur: () => void

  /**
   * Clear the date
   */
  clear: () => void

  /**
   * Sync date from external prop without triggering onChange
   * Use this when parent updates the value prop
   */
  syncFromProp: (isoDate: string | null) => void
}

/**
 * Hook for managing date picker state with ISO format validation
 *
 * @example
 * ```tsx
 * const { selectedDate, isoValue, setDate, handleInputChange, handleInputBlur } = useDatePickerState({
 *   initialValue: '2024-01-15',
 *   onChange: (isoDate) => {
 *     // Update form state with validated ISO string
 *     setValue('startDate', isoDate)
 *   }
 * })
 * ```
 */
export function useDatePickerState({
  initialValue = null,
  onChange,
  debounceMs = 300,
  minDate,
  maxDate,
}: UseDatePickerStateOptions = {}): UseDatePickerStateReturn {
  // Parse initial value
  const getInitialDate = (): Date | null => {
    if (!initialValue) return null
    if (typeof initialValue === 'string') {
      return parseISODate(initialValue)
    }
    return initialValue
  }

  const initialDate = getInitialDate()
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate)
  const [isoValue, setIsoValue] = useState<string>(
    typeof initialValue === 'string' ? initialValue : formatISODate(initialDate)
  )
  const [isValid, setIsValid] = useState<boolean>(true)

  // Track if user is actively editing to prevent external updates mid-keystroke
  const isEditingRef = useRef(false)
  const lastExternalValueRef = useRef<string | null>(
    typeof initialValue === 'string' ? initialValue : formatISODate(initialDate)
  )

  // Debounce timer for onChange callback
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Track previous value for auto-format comparison (avoids state race conditions)
  const prevValueRef = useRef<string>(
    typeof initialValue === 'string' ? initialValue : formatISODate(initialDate)
  )

  // Sync with external changes (e.g., when form resets or loads data)
  // Guard: Only sync when the normalized ISO string actually changes
  useEffect(() => {
    if (isEditingRef.current) return

    // Normalize incoming value to ISO string for comparison
    const incomingIso: string | null = typeof initialValue === 'string'
      ? initialValue
      : formatISODate(initialValue instanceof Date ? initialValue : null)

    // Skip if value hasn't actually changed (prevents re-renders from triggering sync)
    if (incomingIso === lastExternalValueRef.current) return
    // Also skip if current internal state matches incoming (no change needed)
    if (incomingIso === isoValue) return

    // Parse the new initial value
    let newDate: Date | null = null
    if (initialValue) {
      if (typeof initialValue === 'string') {
        newDate = parseISODate(initialValue)
      } else {
        newDate = initialValue
      }
    }

    setSelectedDate(newDate)
    setIsoValue(incomingIso || '')
    setIsValid(true)
    lastExternalValueRef.current = incomingIso
  }, [initialValue, isoValue])

  // Auto-clear when minDate/maxDate changes and current value is out of range
  // This handles the case where Start Date changes and End Date becomes invalid
  // Uses ISO string comparison (YYYY-MM-DD format allows lexicographic comparison)
  useEffect(() => {
    // Only check if we have a valid ISO value
    if (!isoValue || !isValidISODate(isoValue)) return
    if (isEditingRef.current) return

    let shouldClear = false

    // Compare ISO strings directly - YYYY-MM-DD format allows string comparison
    if (minDate && isValidISODate(minDate) && isoValue < minDate) {
      shouldClear = true
    }

    if (maxDate && isValidISODate(maxDate) && isoValue > maxDate) {
      shouldClear = true
    }

    if (shouldClear) {
      setSelectedDate(null)
      setIsoValue('')
      setIsValid(true)
      if (onChange) {
        onChange(null)
      }
    }
  }, [minDate, maxDate, isoValue, onChange])

  /**
   * Set date from calendar selection
   */
  const setDate = useCallback(
    (date: Date | null) => {
      setSelectedDate(date)
      const iso = formatISODate(date)
      setIsoValue(iso)
      setIsValid(true)
      isEditingRef.current = false

      // Trigger onChange immediately for calendar selections
      if (onChange) {
        onChange(iso || null)
      }
    },
    [onChange]
  )

  /**
   * Handle manual input changes (debounced validation)
   * Includes auto-formatting: inserts dashes as user types YYYY-MM-DD
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      let value = input.value
      const prevValue = prevValueRef.current

      // Guard: selectionStart can be null on mobile/IME
      const selStart = input.selectionStart ?? value.length
      const selEnd = input.selectionEnd ?? value.length
      const cursorAtEnd = selStart === value.length && selEnd === value.length

      // Guard: Skip auto-format for datetime strings or already complete dates
      if (value.includes('T') || value.length > 10) {
        prevValueRef.current = value
        isEditingRef.current = true
        setIsoValue(value)

        // Clear existing debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        // Debounce validation
        debounceTimerRef.current = setTimeout(() => {
          if (value === '') {
            setSelectedDate(null)
            setIsValid(true)
            if (onChange) onChange(null)
            return
          }

          const valid = isValidISODate(value)
          setIsValid(valid)

          if (valid) {
            const date = parseISODate(value)
            setSelectedDate(date)
            if (onChange) onChange(value)
          } else {
            setSelectedDate(null)
          }
        }, debounceMs)
        return
      }

      // Auto-format when typing forward AND cursor at end
      const isTypingForward = value.length > prevValue.length
      if (isTypingForward && cursorAtEnd) {
        // Strip non-digits for processing
        const digitsOnly = value.replace(/\D/g, '')

        // Cap at 8 digits (YYYYMMDD)
        const cappedDigits = digitsOnly.slice(0, 8)

        // Only format if we have at least 4 digits (complete year)
        if (cappedDigits.length >= 4) {
          let formatted = cappedDigits.slice(0, 4) // YYYY
          if (cappedDigits.length > 4) {
            formatted += '-' + cappedDigits.slice(4, 6) // -MM
          }
          if (cappedDigits.length > 6) {
            formatted += '-' + cappedDigits.slice(6, 8) // -DD
          }
          value = formatted
        }
      }

      prevValueRef.current = value
      isEditingRef.current = true
      setIsoValue(value)

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Debounce validation and onChange callback
      debounceTimerRef.current = setTimeout(() => {
        if (value === '') {
          setSelectedDate(null)
          setIsValid(true)
          if (onChange) onChange(null)
          return
        }

        const valid = isValidISODate(value)
        setIsValid(valid)

        if (valid) {
          const date = parseISODate(value)
          setSelectedDate(date)
          if (onChange) onChange(value)
        } else {
          setSelectedDate(null)
        }
      }, debounceMs)
    },
    [onChange, debounceMs]
  )

  /**
   * Handle input blur (format and validate)
   */
  const handleInputBlur = useCallback(() => {
    isEditingRef.current = false

    // Clear debounce timer if still pending
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Validate and format
    if (isoValue === '') {
      setSelectedDate(null)
      setIsValid(true)
      return
    }

    const valid = isValidISODate(isoValue)
    setIsValid(valid)

    if (valid) {
      const date = parseISODate(isoValue)
      setSelectedDate(date)
      // Re-format to ensure consistent YYYY-MM-DD format
      setIsoValue(formatISODate(date))
    } else {
      // Keep invalid value visible for user to correct
      setSelectedDate(null)
    }
  }, [isoValue])

  /**
   * Clear the date
   */
  const clear = useCallback(() => {
    setSelectedDate(null)
    setIsoValue('')
    setIsValid(true)
    isEditingRef.current = false

    if (onChange) {
      onChange(null)
    }
  }, [onChange])

  /**
   * Sync date from external prop without triggering onChange.
   * Used when the parent updates the value prop (e.g., from smart date range).
   */
  const syncFromProp = useCallback((isoDate: string | null) => {
    if (isoDate) {
      const date = parseISODate(isoDate)
      setSelectedDate(date)
      setIsoValue(isoDate)
    } else {
      setSelectedDate(null)
      setIsoValue('')
    }
    setIsValid(true)
    isEditingRef.current = false
    lastExternalValueRef.current = isoDate
  }, [])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    selectedDate,
    isoValue,
    isValid,
    setDate,
    handleInputChange,
    handleInputBlur,
    clear,
    syncFromProp,
  }
}
