/**
 * Date Display Component
 *
 * A component for displaying dates with timezone awareness.
 * Automatically formats UTC dates from the server to the specified timezone.
 */

import React from 'react'
import { formatDate, formatDateTime, formatTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

export interface DateDisplayProps {
  /** UTC date string from the server (ISO format) */
  date: string | null | undefined
  /** IANA timezone identifier (optional, defaults to browser timezone) */
  timezone?: string
  /** Format type */
  format?: 'date' | 'datetime' | 'time'
  /** Additional CSS classes */
  className?: string
  /** Fallback text when date is null/undefined */
  fallback?: string
}

/**
 * Display a formatted date with timezone awareness
 *
 * @example
 * ```tsx
 * <DateDisplay date={trip.startDate} timezone={trip.timezone} />
 * <DateDisplay date={trip.createdAt} format="datetime" />
 * <DateDisplay date={contact.dateOfBirth} format="date" fallback="Not provided" />
 * ```
 */
export function DateDisplay({
  date,
  timezone,
  format = 'date',
  className,
  fallback = '-',
}: DateDisplayProps) {
  if (!date) {
    return <span className={cn('text-muted-foreground', className)}>{fallback}</span>
  }

  let formattedDate: string

  switch (format) {
    case 'datetime':
      formattedDate = formatDateTime(date, timezone)
      break
    case 'time':
      formattedDate = formatTime(date, timezone)
      break
    case 'date':
    default:
      formattedDate = formatDate(date, timezone)
      break
  }

  return <span className={className}>{formattedDate}</span>
}
