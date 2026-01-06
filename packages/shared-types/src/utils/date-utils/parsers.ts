/**
 * Date Parsing Utilities
 *
 * Safe date parsing with fallbacks and validation.
 * These utilities do NOT handle timezone conversion - they just parse strings into Date objects.
 * Timezone conversion happens client-side only.
 */

import { parse, parseISO, isValid } from 'date-fns'
import { DATE_FORMAT } from './constants'

/**
 * Safely parse a date string in YYYY-MM-DD format
 * Returns null if the input is invalid
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object or null
 *
 * @example
 * parseDateString('2025-01-15') // Date object for Jan 15, 2025
 * parseDateString('invalid') // null
 */
export function parseDateString(dateString: string | null | undefined): Date | null {
  if (!dateString) return null

  try {
    const parsed = parse(dateString, DATE_FORMAT, new Date())
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Safely parse an ISO 8601 string (with or without timezone)
 * Returns null if the input is invalid
 *
 * @param isoString - ISO 8601 date string
 * @returns Date object or null
 *
 * @example
 * parseISOString('2025-01-15T10:30:00.000Z') // Date object in UTC
 * parseISOString('2025-01-15T10:30:00-05:00') // Date object with timezone
 * parseISOString('invalid') // null
 */
export function parseISOString(isoString: string | null | undefined): Date | null {
  if (!isoString) return null

  try {
    const parsed = parseISO(isoString)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Parse a date value that could be a Date object, string, or null/undefined
 * Returns a Date object or null
 *
 * @param value - Date, string, or null/undefined
 * @returns Date object or null
 *
 * @example
 * parseFlexibleDate(new Date()) // Date object (passed through)
 * parseFlexibleDate('2025-01-15') // Date object
 * parseFlexibleDate('2025-01-15T10:30:00Z') // Date object
 * parseFlexibleDate(null) // null
 */
export function parseFlexibleDate(
  value: Date | string | null | undefined
): Date | null {
  if (!value) return null
  if (value instanceof Date) return isValid(value) ? value : null

  // Try ISO format first (most common for timestamps)
  const isoDate = parseISOString(value)
  if (isoDate) return isoDate

  // Fall back to YYYY-MM-DD format
  return parseDateString(value)
}

/**
 * Validate if a string is a valid date in YYYY-MM-DD format
 *
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidDateString('2025-01-15') // true
 * isValidDateString('2025-13-01') // false (invalid month)
 * isValidDateString('invalid') // false
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
  return parseDateString(dateString) !== null
}

/**
 * Validate if a string is a valid ISO 8601 date/time string
 *
 * @param isoString - ISO string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidISOString('2025-01-15T10:30:00.000Z') // true
 * isValidISOString('2025-01-15') // true (date-only ISO)
 * isValidISOString('invalid') // false
 */
export function isValidISOString(isoString: string | null | undefined): boolean {
  return parseISOString(isoString) !== null
}
