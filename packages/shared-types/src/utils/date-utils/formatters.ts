/**
 * Date Formatting Utilities
 *
 * Timezone-agnostic date formatting utilities.
 * These utilities format Date objects to strings but do NOT handle timezone conversion.
 * They work with whatever timezone the Date object is already in.
 *
 * For timezone-aware formatting, use client-side utilities that leverage the browser's Intl API.
 */

import { format, isValid } from 'date-fns'
import { DATE_FORMAT, DISPLAY_DATE_FORMAT, DISPLAY_DATETIME_FORMAT } from './constants'

/**
 * Format a Date object to YYYY-MM-DD string
 * Returns null if the input is invalid
 *
 * @param date - Date object to format
 * @returns Formatted string or null
 *
 * @example
 * formatDateString(new Date('2025-01-15')) // '2025-01-15'
 * formatDateString(null) // null
 */
export function formatDateString(date: Date | null | undefined): string | null {
  if (!date || !isValid(date)) return null
  return format(date, DATE_FORMAT)
}

/**
 * Format a Date object to ISO 8601 string (always in UTC with 'Z' suffix)
 * Returns null if the input is invalid
 *
 * @param date - Date object to format
 * @returns ISO string or null
 *
 * @example
 * formatISOString(new Date('2025-01-15T10:30:00Z')) // '2025-01-15T10:30:00.000Z'
 * formatISOString(null) // null
 */
export function formatISOString(date: Date | null | undefined): string | null {
  if (!date || !isValid(date)) return null
  return date.toISOString()
}

/**
 * Format a Date object to a human-readable date string
 * Returns null if the input is invalid
 *
 * @param date - Date object to format
 * @returns Formatted string or null
 *
 * @example
 * formatDisplayDate(new Date('2025-01-15')) // 'Jan 15, 2025'
 * formatDisplayDate(null) // null
 */
export function formatDisplayDate(date: Date | null | undefined): string | null {
  if (!date || !isValid(date)) return null
  return format(date, DISPLAY_DATE_FORMAT)
}

/**
 * Format a Date object to a human-readable date/time string
 * Returns null if the input is invalid
 *
 * @param date - Date object to format
 * @returns Formatted string or null
 *
 * @example
 * formatDisplayDateTime(new Date('2025-01-15T10:30:00')) // 'Jan 15, 2025 10:30 AM'
 * formatDisplayDateTime(null) // null
 */
export function formatDisplayDateTime(date: Date | null | undefined): string | null {
  if (!date || !isValid(date)) return null
  return format(date, DISPLAY_DATETIME_FORMAT)
}

/**
 * Format a date/time with a custom format string
 * Returns null if the input is invalid
 *
 * See date-fns format tokens: https://date-fns.org/docs/format
 *
 * @param date - Date object to format
 * @param formatString - date-fns format string
 * @returns Formatted string or null
 *
 * @example
 * formatCustom(new Date('2025-01-15'), 'MMMM do, yyyy') // 'January 15th, 2025'
 * formatCustom(null, 'yyyy-MM-dd') // null
 */
export function formatCustom(
  date: Date | null | undefined,
  formatString: string
): string | null {
  if (!date || !isValid(date)) return null
  return format(date, formatString)
}
