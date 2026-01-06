'use client'

/**
 * Enhanced Date Picker Component
 *
 * Date selection with both calendar popup AND manual text input.
 * Supports typing ISO dates (YYYY-MM-DD) directly into the input field.
 *
 * ## Key Features
 * - Manual text input with ISO format validation (YYYY-MM-DD)
 * - Calendar popup that opens to the selected date's month
 * - Debounced onChange (300ms default) to prevent cursor jumping
 * - Clear button for easy date removal
 * - Full keyboard accessibility
 *
 * ## Design Decisions
 * - Uses `defaultMonth` (not `month`) so calendar can be navigated freely
 * - Validation on blur, not keystroke, for better typing UX
 * - `syncFromProp` prevents infinite loops with form state
 *
 * @see docs/date-picker-components.md - Full documentation
 * @see useDatePickerState - Underlying state management hook
 */

import * as React from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useDatePickerState } from '@/hooks/use-date-picker-state'
import { parseISODate } from '@/lib/date-utils'

export interface DatePickerEnhancedProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onKeyDown'> {
  /**
   * Current date value (ISO string YYYY-MM-DD)
   */
  value?: string | null

  /**
   * Callback when date changes
   * @param isoDate - ISO date string (YYYY-MM-DD) or null
   */
  onChange?: (isoDate: string | null) => void

  /**
   * Placeholder text when no date selected
   * @default 'YYYY-MM-DD'
   */
  placeholder?: string

  /**
   * Disabled state
   */
  disabled?: boolean

  /**
   * Minimum selectable date (ISO string)
   */
  minDate?: string

  /**
   * Maximum selectable date (ISO string)
   */
  maxDate?: string

  /**
   * Additional CSS classes for the container
   */
  className?: string

  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string

  /**
   * Show clear button when date is selected
   * @default true
   */
  showClear?: boolean

  /**
   * Debounce delay for onChange callback (milliseconds)
   * @default 300
   */
  debounceMs?: number

  /**
   * Hint for which month to display when opening the calendar.
   * Only used when no date is selected. Useful for defaulting to trip start month.
   */
  defaultMonthHint?: Date | undefined

  /**
   * Keyboard event handler for custom navigation (e.g., Tab to next field)
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Enhanced Date Picker with Manual Input
 *
 * @example
 * ```tsx
 * <DatePickerEnhanced
 *   value={startDate}
 *   onChange={(isoDate) => setStartDate(isoDate)}
 *   placeholder="Enter start date"
 *   minDate="2024-01-01"
 *   showClear
 * />
 * ```
 */
export function DatePickerEnhanced({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  disabled = false,
  minDate,
  maxDate,
  className,
  'aria-label': ariaLabel,
  showClear = true,
  debounceMs = 300,
  defaultMonthHint,
  onKeyDown,
  ...inputProps
}: DatePickerEnhancedProps) {
  const [open, setOpen] = React.useState(false)

  // Use date picker state hook for validation and debouncing
  const {
    selectedDate,
    isoValue,
    isValid,
    setDate,
    handleInputChange,
    handleInputBlur,
    clear,
    syncFromProp,
  } = useDatePickerState({
    initialValue: value || null,
    onChange,
    debounceMs,
    minDate: minDate || null,
    maxDate: maxDate || null,
  })

  // Track previous external value to detect actual prop changes
  const prevValueRef = React.useRef(value)

  // Sync external value changes (e.g., from smart date range auto-preset)
  // Uses syncFromProp which updates selectedDate WITHOUT triggering onChange
  // IMPORTANT: Only sync when the external `value` prop ACTUALLY changes, not on re-renders
  React.useEffect(() => {
    // Normalize both to string or null for comparison
    const normalizedValue = value ?? null
    const normalizedPrev = prevValueRef.current ?? null

    // Only sync if the external value actually changed
    if (normalizedValue !== normalizedPrev) {
      // Also skip if internal state already matches (prevents race conditions)
      if (normalizedValue === isoValue || (!normalizedValue && !isoValue)) {
        prevValueRef.current = value
        return
      }
      prevValueRef.current = value
      syncFromProp(normalizedValue)
    }
  }, [value, syncFromProp, isoValue])

  // Handle calendar selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setDate(date)
    } else {
      clear()
    }
    setOpen(false)
  }

  // Handle clear button
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    clear()
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Manual Text Input */}
      <div className="relative flex-1">
        <Input
          type="text"
          value={isoValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel || 'Enter date in YYYY-MM-DD format'}
          aria-invalid={!isValid}
          className={cn(
            'min-h-11 pr-24', // 44px min height, space for calendar + clear buttons
            !isValid && 'border-destructive focus-visible:ring-destructive'
          )}
          {...inputProps}
        />

        {/* Inline buttons */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Clear Button - removed from tab order */}
          {showClear && isoValue && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleClear}
              className="h-11 w-11 p-0 hover:bg-muted"
              aria-label="Clear date"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Calendar Popup Button - removed from tab order */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                tabIndex={-1}
                disabled={disabled}
                className="h-11 w-11 p-0 hover:bg-muted"
                aria-label="Open calendar"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                defaultMonth={selectedDate || defaultMonthHint || (minDate ? parseISODate(minDate) ?? undefined : undefined)}
                onSelect={handleCalendarSelect}
                disabled={(date) => {
                  // Apply min/max date constraints
                  if (minDate) {
                    const minDateObj = new Date(minDate)
                    if (date < minDateObj) return true
                  }
                  if (maxDate) {
                    const maxDateObj = new Date(maxDate)
                    if (date > maxDateObj) return true
                  }
                  return false
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Validation Feedback (optional - could be shown below input) */}
      {!isValid && isoValue && (
        <span className="sr-only" role="alert">
          Invalid date format. Please use YYYY-MM-DD format.
        </span>
      )}
    </div>
  )
}
