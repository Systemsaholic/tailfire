'use client'

/**
 * Date Picker Component
 *
 * Basic single-date selection with calendar popup.
 * Calendar-only selection (no manual text input).
 *
 * Design:
 * - Uses shadcn Calendar + Popover components
 * - ISO format (YYYY-MM-DD) only
 * - Touch-optimized (≥44px targets)
 * - Keyboard accessible (Tab, Space, Enter, Escape, Arrow keys)
 * - Screen reader support
 */

import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatDisplayDate, parseISODate, formatISODate } from '@/lib/date-utils'

export interface DatePickerProps {
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
   * @default 'Pick a date'
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
   * Additional CSS classes for the button
   */
  className?: string

  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string
}

/**
 * Basic Date Picker Component
 *
 * @example
 * ```tsx
 * <DatePicker
 *   value={startDate}
 *   onChange={(isoDate) => setStartDate(isoDate)}
 *   placeholder="Select start date"
 *   minDate="2024-01-01"
 * />
 * ```
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  minDate,
  maxDate,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse value to Date object
  const selectedDate = value ? parseISODate(value) : null

  // Parse min/max dates
  const minDateObj = minDate ? parseISODate(minDate) : undefined
  const maxDateObj = maxDate ? parseISODate(maxDate) : undefined

  // Handle calendar selection
  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(null)
      setOpen(false)
      return
    }

    const isoDate = formatISODate(date)
    onChange?.(isoDate)
    setOpen(false)
  }

  // Format display text
  const displayText = selectedDate ? formatDisplayDate(selectedDate) : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            // Ensure touch target ≥44px
            'min-h-[44px] h-10',
            className
          )}
          disabled={disabled}
          aria-label={ariaLabel || 'Select date'}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDateObj && date < minDateObj) return true
            if (maxDateObj && date > maxDateObj) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
