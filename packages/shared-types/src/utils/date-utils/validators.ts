/**
 * Date Validation Utilities
 *
 * Utilities for validating dates, date ranges, and timezone identifiers.
 * These are shared across frontend and backend for consistency.
 */

import { isBefore, isAfter, isEqual, isSameDay } from 'date-fns'
import { IANA_TIMEZONES } from './constants'
import { parseFlexibleDate } from './parsers'

/**
 * Validate if a string is a valid IANA timezone identifier
 *
 * @param timezone - Timezone string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidTimezone('America/Toronto') // true
 * isValidTimezone('EST') // false (not IANA format)
 * isValidTimezone('Invalid/Timezone') // false
 */
export function isValidTimezone(timezone: string | null | undefined): boolean {
  if (!timezone) return false
  return IANA_TIMEZONES.includes(timezone as any)
}

/**
 * Validate if a date range is valid (start before or equal to end)
 *
 * @param startDate - Start date (Date, string, or null/undefined)
 * @param endDate - End date (Date, string, or null/undefined)
 * @returns true if valid range, false otherwise
 *
 * @example
 * isValidDateRange('2025-01-15', '2025-01-20') // true
 * isValidDateRange('2025-01-20', '2025-01-15') // false (start after end)
 * isValidDateRange('2025-01-15', '2025-01-15') // true (same day is valid)
 */
export function isValidDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean {
  const start = parseFlexibleDate(startDate)
  const end = parseFlexibleDate(endDate)

  if (!start || !end) return false
  return isBefore(start, end) || isEqual(start, end)
}

/**
 * Check if a date is in the past
 *
 * @param date - Date to check (Date, string, or null/undefined)
 * @returns true if date is before today, false otherwise
 *
 * @example
 * isInPast('2020-01-01') // true
 * isInPast('2099-12-31') // false
 */
export function isInPast(date: Date | string | null | undefined): boolean {
  const parsed = parseFlexibleDate(date)
  if (!parsed) return false
  return isBefore(parsed, new Date())
}

/**
 * Check if a date is in the future
 *
 * @param date - Date to check (Date, string, or null/undefined)
 * @returns true if date is after today, false otherwise
 *
 * @example
 * isInFuture('2099-12-31') // true
 * isInFuture('2020-01-01') // false
 */
export function isInFuture(date: Date | string | null | undefined): boolean {
  const parsed = parseFlexibleDate(date)
  if (!parsed) return false
  return isAfter(parsed, new Date())
}

/**
 * Check if a date is today
 *
 * @param date - Date to check (Date, string, or null/undefined)
 * @returns true if date is today, false otherwise
 *
 * @example
 * isToday(new Date()) // true
 * isToday('2020-01-01') // false
 */
export function isToday(date: Date | string | null | undefined): boolean {
  const parsed = parseFlexibleDate(date)
  if (!parsed) return false
  return isSameDay(parsed, new Date())
}

/**
 * Validate if a date falls within a given range (inclusive)
 *
 * @param date - Date to check
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @returns true if date is within range, false otherwise
 *
 * @example
 * isDateInRange('2025-01-15', '2025-01-01', '2025-01-31') // true
 * isDateInRange('2025-02-01', '2025-01-01', '2025-01-31') // false
 */
export function isDateInRange(
  date: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean {
  const target = parseFlexibleDate(date)
  const start = parseFlexibleDate(startDate)
  const end = parseFlexibleDate(endDate)

  if (!target || !start || !end) return false

  return (
    (isAfter(target, start) || isEqual(target, start)) &&
    (isBefore(target, end) || isEqual(target, end))
  )
}

/**
 * Validate passport expiry date (must be valid and in the future)
 *
 * @param expiryDate - Passport expiry date
 * @param minMonthsValid - Minimum months the passport must be valid (default: 6)
 * @returns true if passport is valid for the required period, false otherwise
 *
 * @example
 * isValidPassportExpiry('2026-12-31') // true (if more than 6 months from now)
 * isValidPassportExpiry('2025-02-01') // false (less than 6 months)
 */
export function isValidPassportExpiry(
  expiryDate: Date | string | null | undefined,
  minMonthsValid: number = 6
): boolean {
  const expiry = parseFlexibleDate(expiryDate)
  if (!expiry) return false

  const today = new Date()
  const minValidDate = new Date(today)
  minValidDate.setMonth(minValidDate.getMonth() + minMonthsValid)

  return isAfter(expiry, minValidDate)
}

/**
 * Validate date of birth (must be in the past and not too far back)
 *
 * @param dateOfBirth - Date of birth to validate
 * @param maxAge - Maximum allowed age in years (default: 150)
 * @returns true if valid date of birth, false otherwise
 *
 * @example
 * isValidDateOfBirth('1990-01-15') // true
 * isValidDateOfBirth('2099-01-01') // false (future date)
 * isValidDateOfBirth('1800-01-01') // false (too far in past)
 */
export function isValidDateOfBirth(
  dateOfBirth: Date | string | null | undefined,
  maxAge: number = 150
): boolean {
  const dob = parseFlexibleDate(dateOfBirth)
  if (!dob) return false

  const today = new Date()
  const minDate = new Date(today)
  minDate.setFullYear(minDate.getFullYear() - maxAge)

  return isInPast(dob) && isAfter(dob, minDate)
}
