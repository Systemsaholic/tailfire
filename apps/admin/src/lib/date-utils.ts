/**
 * Frontend Date/Time Utilities
 *
 * Provides timezone-aware date formatting and manipulation using date-fns and date-fns-tz.
 * All dates are stored in UTC on the server and converted to user/entity timezone on the client.
 *
 * Design Principles:
 * - Server stores dates in UTC
 * - Each entity (Contact, Trip) has an optional timezone field
 * - Frontend displays dates in entity's timezone or user's browser timezone
 * - Use IANA timezone identifiers (e.g., 'America/Toronto', 'Europe/London')
 */

import { format, parseISO, isValid, addDays, differenceInDays } from 'date-fns'
import { toZonedTime, formatInTimeZone, fromZonedTime } from 'date-fns-tz'

/**
 * Get the user's browser timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Validate if a string is a valid IANA timezone identifier
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Format a UTC date string to a specific timezone
 *
 * @param utcDateString - ISO date string in UTC (from server)
 * @param timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @param formatString - date-fns format string (default: 'PPP p')
 * @returns Formatted date string in the specified timezone
 *
 * @example
 * ```ts
 * formatInTimezone('2024-01-15T18:00:00Z', 'America/Toronto', 'PPP')
 * // Returns: "January 15th, 2024"
 * ```
 */
export function formatInTimezone(
  utcDateString: string | null | undefined,
  timezone?: string,
  formatString: string = 'PPP p'
): string {
  if (!utcDateString) {
    return ''
  }

  const date = parseISO(utcDateString)
  if (!isValid(date)) {
    return ''
  }

  const tz = timezone || getBrowserTimezone()

  try {
    return formatInTimeZone(date, tz, formatString)
  } catch {
    // Fallback to browser timezone if specified timezone is invalid
    return formatInTimeZone(date, getBrowserTimezone(), formatString)
  }
}

/**
 * Convert a local date/time to UTC for server submission
 *
 * @param localDate - Date object in local timezone
 * @param timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns ISO string in UTC for server storage
 *
 * @example
 * ```ts
 * const localDate = new Date(2024, 0, 15, 14, 30) // Jan 15, 2024, 2:30 PM local
 * toUTC(localDate, 'America/Toronto')
 * // Returns: "2024-01-15T19:30:00.000Z" (UTC)
 * ```
 */
export function toUTC(localDate: Date, timezone?: string): string {
  const tz = timezone || getBrowserTimezone()

  try {
    return fromZonedTime(localDate, tz).toISOString()
  } catch {
    // Fallback to browser timezone if specified timezone is invalid
    return fromZonedTime(localDate, getBrowserTimezone()).toISOString()
  }
}

/**
 * Convert a UTC date string to a Date object in a specific timezone
 *
 * @param utcDateString - ISO date string in UTC (from server)
 * @param timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns Date object adjusted to the specified timezone
 */
export function fromUTC(
  utcDateString: string | null | undefined,
  timezone?: string
): Date | null {
  if (!utcDateString) {
    return null
  }

  const date = parseISO(utcDateString)
  if (!isValid(date)) {
    return null
  }

  const tz = timezone || getBrowserTimezone()

  try {
    return toZonedTime(date, tz)
  } catch {
    // Fallback to browser timezone if specified timezone is invalid
    return toZonedTime(date, getBrowserTimezone())
  }
}

/**
 * Format a date for display (common use case)
 *
 * @param utcDateString - ISO date string in UTC (from server)
 * @param timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns Human-readable date string (e.g., "Jan 15, 2024")
 */
export function formatDate(
  utcDateString: string | null | undefined,
  timezone?: string
): string {
  return formatInTimezone(utcDateString, timezone, 'PP')
}

/**
 * Format a date and time for display (common use case)
 *
 * @param utcDateString - ISO date string in UTC (from server)
 * @param timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns Human-readable date and time string (e.g., "Jan 15, 2024 at 2:30 PM")
 */
export function formatDateTime(
  utcDateString: string | null | undefined,
  timezone?: string
): string {
  return formatInTimezone(utcDateString, timezone, 'PPP p')
}

/**
 * Format just the time portion
 *
 * @param utcDateString - ISO date string in UTC (from server)
 * @param timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns Time string (e.g., "2:30 PM")
 */
export function formatTime(
  utcDateString: string | null | undefined,
  timezone?: string
): string {
  return formatInTimezone(utcDateString, timezone, 'p')
}

/**
 * Get a list of common timezones grouped by region
 * Useful for timezone selector dropdowns
 */
export function getCommonTimezones(): Array<{ region: string; timezones: string[] }> {
  return [
    {
      region: 'North America',
      timezones: [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Anchorage',
        'America/Toronto',
        'America/Vancouver',
        'America/Halifax',
        'America/Mexico_City',
      ],
    },
    {
      region: 'Europe',
      timezones: [
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Rome',
        'Europe/Madrid',
        'Europe/Amsterdam',
        'Europe/Brussels',
        'Europe/Vienna',
        'Europe/Zurich',
      ],
    },
    {
      region: 'Asia',
      timezones: [
        'Asia/Dubai',
        'Asia/Kolkata',
        'Asia/Bangkok',
        'Asia/Singapore',
        'Asia/Hong_Kong',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Seoul',
      ],
    },
    {
      region: 'Australia & Pacific',
      timezones: [
        'Australia/Sydney',
        'Australia/Melbourne',
        'Australia/Brisbane',
        'Australia/Perth',
        'Pacific/Auckland',
        'Pacific/Fiji',
        'Pacific/Honolulu',
      ],
    },
    {
      region: 'Other',
      timezones: [
        'UTC',
      ],
    },
  ]
}

/**
 * Format timezone for display (convert underscores to spaces)
 *
 * @param timezone - IANA timezone identifier
 * @returns Human-readable timezone name
 *
 * @example
 * ```ts
 * formatTimezoneLabel('America/New_York')
 * // Returns: "America/New York"
 * ```
 */
export function formatTimezoneLabel(timezone: string): string {
  return timezone.replace(/_/g, ' ')
}

// ============================================================================
// Date Picker Utilities
// ============================================================================

/**
 * Parse ISO date string (YYYY-MM-DD) to Date object
 * Returns null for invalid or empty strings
 *
 * IMPORTANT: Date-only strings (YYYY-MM-DD) are parsed as LOCAL midnight
 * to avoid off-by-one bugs in western timezones. Datetime strings with
 * time/timezone info (e.g., '2024-02-06T12:00:00Z') use parseISO and
 * preserve their UTC semantics.
 *
 * @param isoString - ISO 8601 date string (YYYY-MM-DD or datetime)
 * @returns Date object or null
 *
 * @example
 * ```ts
 * parseISODate('2024-01-15') // Returns: Date object for Jan 15, 2024 at local midnight
 * parseISODate('2024-01-15T12:00:00Z') // Returns: Date object with UTC semantics
 * parseISODate('') // Returns: null
 * parseISODate('invalid') // Returns: null
 * ```
 */
export function parseISODate(isoString: string | null | undefined): Date | null {
  if (!isoString || isoString.trim() === '') {
    return null
  }

  try {
    // Handle bare YYYY-MM-DD strings as LOCAL dates (not UTC)
    // This prevents the off-by-one bug in western timezones
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
      const [yearStr, monthStr, dayStr] = isoString.split('-')
      const year = Number(yearStr)
      const month = Number(monthStr)
      const day = Number(dayStr)

      // Guard against NaN from malformed strings
      if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return null
      }

      const date = new Date(year, month - 1, day) // Creates in local timezone

      // Guard against silent overflow (e.g., Feb 31 → Mar 2)
      // new Date() rolls over invalid dates; reject if result doesn't match input
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null
      }

      return isValid(date) ? date : null
    }

    // For datetime strings (with time/timezone), use parseISO (UTC semantics)
    const date = parseISO(isoString)
    return isValid(date) ? date : null
  } catch {
    return null
  }
}

/**
 * Format Date object to ISO date string (YYYY-MM-DD)
 * Returns empty string for null/invalid dates
 *
 * @param date - Date object to format
 * @returns ISO 8601 date string or empty string
 *
 * @example
 * ```ts
 * formatISODate(new Date(2024, 0, 15)) // Returns: '2024-01-15'
 * formatISODate(null) // Returns: ''
 * ```
 */
export function formatISODate(date: Date | null | undefined): string {
  if (!date || !isValid(date)) {
    return ''
  }

  try {
    return format(date, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

/**
 * Format Date object for display (e.g., "January 15, 2024")
 * Returns empty string for null/invalid dates
 *
 * @param date - Date object to format
 * @returns Human-readable date string or empty string
 *
 * @example
 * ```ts
 * formatDisplayDate(new Date(2024, 0, 15)) // Returns: 'January 15, 2024'
 * ```
 */
export function formatDisplayDate(date: Date | null | undefined): string {
  if (!date || !isValid(date)) {
    return ''
  }

  try {
    return format(date, 'PPP')
  } catch {
    return ''
  }
}

/**
 * Get a default month hint from an ISO date string (typically trip start date).
 * Returns undefined if the string is missing or invalid.
 * Used by DatePickerEnhanced to open the calendar to the trip's month.
 *
 * @param isoDateString - ISO date string (YYYY-MM-DD or datetime)
 * @returns Date object for the default month, or undefined
 *
 * @example
 * ```ts
 * getDefaultMonthHint('2025-06-15') // Returns: Date for June 15, 2025
 * getDefaultMonthHint(null) // Returns: undefined
 * getDefaultMonthHint('') // Returns: undefined
 * getDefaultMonthHint('invalid') // Returns: undefined
 * ```
 */
export function getDefaultMonthHint(isoDateString: string | null | undefined): Date | undefined {
  if (!isoDateString) return undefined
  return parseISODate(isoDateString) ?? undefined
}

/**
 * Check if a date string is a valid ISO date (YYYY-MM-DD)
 *
 * @param dateString - String to validate
 * @returns True if valid ISO date format
 *
 * @example
 * ```ts
 * isValidISODate('2024-01-15') // Returns: true
 * isValidISODate('01/15/2024') // Returns: false
 * isValidISODate('2024-02-30') // Returns: false (invalid date)
 * ```
 */
export function isValidISODate(dateString: string | null | undefined): boolean {
  if (!dateString || dateString.trim() === '') {
    return false
  }

  // Check format matches YYYY-MM-DD
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/
  if (!isoPattern.test(dateString)) {
    return false
  }

  // Check date is actually valid
  const date = parseISODate(dateString)
  return date !== null
}

/**
 * Add days to a date and return ISO string
 *
 * @param dateString - ISO date string or Date object
 * @param days - Number of days to add (can be negative)
 * @returns New ISO date string or empty string if invalid
 *
 * @example
 * ```ts
 * addDaysToISODate('2024-01-15', 7) // Returns: '2024-01-22'
 * addDaysToISODate('2024-01-15', -3) // Returns: '2024-01-12'
 * ```
 */
export function addDaysToISODate(
  dateString: string | Date | null | undefined,
  days: number
): string {
  const date = typeof dateString === 'string' ? parseISODate(dateString) : dateString

  if (!date || !isValid(date)) {
    return ''
  }

  try {
    const newDate = addDays(date, days)
    return formatISODate(newDate)
  } catch {
    return ''
  }
}

/**
 * Calculate difference in days between two dates
 *
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 * @returns Number of days difference, or null if invalid dates
 *
 * @example
 * ```ts
 * getDaysDifference('2024-01-15', '2024-01-22') // Returns: 7
 * getDaysDifference('2024-01-22', '2024-01-15') // Returns: -7
 * ```
 */
export function getDaysDifference(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): number | null {
  const start = typeof startDate === 'string' ? parseISODate(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISODate(endDate) : endDate

  if (!start || !end || !isValid(start) || !isValid(end)) {
    return null
  }

  try {
    return differenceInDays(end, start)
  } catch {
    return null
  }
}

// ============================================================================
// Pending Day / Table View Date Utilities
// ============================================================================

/**
 * Day data structure for findDayForDate
 */
export interface DayInfo {
  id: string
  date: string | null
  dayNumber: number
}

/**
 * Result from findDayForDate
 */
export interface DayMatch {
  dayId: string
  dayNumber: number
}

/**
 * Normalize a date input to YYYY-MM-DD format in a specific timezone
 * Handles various input formats: ISO strings, Date objects, datetime strings
 *
 * @param dateInput - Date string or Date object to normalize
 * @param tz - IANA timezone identifier (default: 'UTC')
 * @returns Normalized YYYY-MM-DD string, or empty string if invalid
 *
 * @example
 * ```ts
 * normalizeToDateString('2024-01-15T14:30:00Z', 'America/Toronto')
 * // Returns: '2024-01-15'
 *
 * normalizeToDateString('2024-01-15', 'UTC')
 * // Returns: '2024-01-15'
 *
 * normalizeToDateString(new Date('2024-01-15'), 'Europe/London')
 * // Returns: '2024-01-15'
 * ```
 */
export function normalizeToDateString(
  dateInput: string | Date | null | undefined,
  tz: string = 'UTC'
): string {
  if (!dateInput) {
    return ''
  }

  try {
    // If already a simple YYYY-MM-DD string, validate and return
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const parsed = parseISODate(dateInput)
      return parsed ? dateInput : ''
    }

    // Parse the input to a Date object
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput

    if (!isValid(date)) {
      return ''
    }

    // Convert to the target timezone and format as YYYY-MM-DD
    const timezone = isValidTimezone(tz) ? tz : 'UTC'
    return formatInTimeZone(date, timezone, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

/**
 * Check if a string is a valid date string (YYYY-MM-DD format)
 * More lenient than isValidISODate - allows null/undefined to return false gracefully
 *
 * @param dateInput - String to validate
 * @returns True if valid YYYY-MM-DD format and represents a real date
 *
 * @example
 * ```ts
 * isValidDateString('2024-01-15') // true
 * isValidDateString('2024-02-30') // false (invalid date)
 * isValidDateString('01/15/2024') // false (wrong format)
 * isValidDateString(null) // false
 * ```
 */
export function isValidDateString(dateInput: string | null | undefined): boolean {
  return isValidISODate(dateInput)
}

/**
 * Find which itinerary day matches a given activity date
 * Compares YYYY-MM-DD date strings directly (no TZ conversion needed since both are dates)
 *
 * @param activityDate - Activity date in YYYY-MM-DD format
 * @param days - Array of itinerary days with id, date, and dayNumber
 * @returns Matching day info (dayId and dayNumber) or null if no match
 *
 * @example
 * ```ts
 * const days = [
 *   { id: 'day-1', date: '2024-02-05', dayNumber: 1 },
 *   { id: 'day-2', date: '2024-02-06', dayNumber: 2 },
 *   { id: 'day-3', date: '2024-02-07', dayNumber: 3 },
 * ]
 *
 * findDayForDate('2024-02-06', days)
 * // Returns: { dayId: 'day-2', dayNumber: 2 }
 *
 * findDayForDate('2024-02-10', days)
 * // Returns: null (no matching day)
 * ```
 */
export function findDayForDate(
  activityDate: string | null | undefined,
  days: DayInfo[] | null | undefined
): DayMatch | null {
  if (!activityDate || !days || days.length === 0) {
    return null
  }

  // Normalize the activity date to ensure consistent format
  const normalizedActivityDate = normalizeToDateString(activityDate, 'UTC')
  if (!normalizedActivityDate) {
    return null
  }

  // Find the day with matching date
  for (const day of days) {
    if (!day.date) {
      continue
    }

    // Normalize the day date for comparison
    const normalizedDayDate = normalizeToDateString(day.date, 'UTC')
    if (normalizedDayDate === normalizedActivityDate) {
      return {
        dayId: day.id,
        dayNumber: day.dayNumber,
      }
    }
  }

  return null
}

/**
 * Check if an activity date falls within the trip's date range (inclusive)
 *
 * @param activityDate - Activity date in YYYY-MM-DD format
 * @param tripStartDate - Trip start date in YYYY-MM-DD format
 * @param tripEndDate - Trip end date in YYYY-MM-DD format
 * @returns True if the activity date is within the trip range
 *
 * @example
 * ```ts
 * isDateInTripRange('2024-02-06', '2024-02-05', '2024-02-13')
 * // Returns: true
 *
 * isDateInTripRange('2024-02-05', '2024-02-05', '2024-02-13')
 * // Returns: true (inclusive of start date)
 *
 * isDateInTripRange('2024-02-14', '2024-02-05', '2024-02-13')
 * // Returns: false (after end date)
 * ```
 */
export function isDateInTripRange(
  activityDate: string | null | undefined,
  tripStartDate: string | null | undefined,
  tripEndDate: string | null | undefined
): boolean {
  if (!activityDate || !tripStartDate || !tripEndDate) {
    return false
  }

  const activity = parseISODate(activityDate)
  const start = parseISODate(tripStartDate)
  const end = parseISODate(tripEndDate)

  if (!activity || !start || !end) {
    return false
  }

  // Compare timestamps for range check (inclusive on both ends)
  return activity.getTime() >= start.getTime() && activity.getTime() <= end.getTime()
}

/**
 * Calculate the day number for a given date within a trip
 * Day 1 is the trip start date, Day 2 is start + 1, etc.
 *
 * @param activityDate - Activity date in YYYY-MM-DD format
 * @param tripStartDate - Trip start date in YYYY-MM-DD format
 * @returns Day number (1-based) or null if invalid/out of range
 *
 * @example
 * ```ts
 * calculateDayNumber('2024-02-05', '2024-02-05')
 * // Returns: 1 (first day of trip)
 *
 * calculateDayNumber('2024-02-07', '2024-02-05')
 * // Returns: 3 (third day of trip)
 * ```
 */
export function calculateDayNumber(
  activityDate: string | null | undefined,
  tripStartDate: string | null | undefined
): number | null {
  const diff = getDaysDifference(tripStartDate, activityDate)

  if (diff === null || diff < 0) {
    return null
  }

  // Day numbers are 1-based
  return diff + 1
}

/**
 * Check if a date is OUTSIDE the trip date range.
 * Returns false (not out of range) if any input is missing, empty, or invalid.
 * This is designed for warning UI - returns false when we shouldn't show a warning.
 *
 * Unlike isDateInTripRange, this function normalizes all dates first,
 * so it handles ISO datetimes (e.g., '2024-02-05T14:30:00Z') correctly.
 *
 * @param date - Date string (ISO datetime or YYYY-MM-DD)
 * @param tripStartDate - Trip start date (YYYY-MM-DD or ISO datetime)
 * @param tripEndDate - Trip end date (YYYY-MM-DD or ISO datetime)
 * @returns True if the date is outside the trip range, false otherwise (including invalid inputs)
 *
 * @example
 * ```ts
 * isDateOutOfTripRange('2024-02-06', '2024-02-05', '2024-02-13')
 * // Returns: false (within range, no warning)
 *
 * isDateOutOfTripRange('2024-02-14', '2024-02-05', '2024-02-13')
 * // Returns: true (after end date, show warning)
 *
 * isDateOutOfTripRange('2024-02-04', '2024-02-05', '2024-02-13')
 * // Returns: true (before start date, show warning)
 *
 * isDateOutOfTripRange('2024-02-06T14:30:00Z', '2024-02-05', '2024-02-13')
 * // Returns: false (handles ISO datetime)
 *
 * isDateOutOfTripRange(null, '2024-02-05', '2024-02-13')
 * // Returns: false (missing date, no warning)
 * ```
 */
export function isDateOutOfTripRange(
  date: string | null | undefined,
  tripStartDate: string | null | undefined,
  tripEndDate: string | null | undefined
): boolean {
  // Guard: Skip if any required input is missing or empty
  if (!date || !tripStartDate || !tripEndDate) return false
  if (typeof date === 'string' && date.trim() === '') return false

  // Normalize ALL dates to YYYY-MM-DD for consistent comparison
  const normalizedDate = normalizeToDateString(date)
  const normalizedStart = normalizeToDateString(tripStartDate)
  const normalizedEnd = normalizeToDateString(tripEndDate)

  // Guard: Skip if any normalization failed
  if (!normalizedDate || !normalizedStart || !normalizedEnd) return false

  // Guard: Skip if trip dates are inverted (invalid range)
  if (normalizedStart > normalizedEnd) return false

  // Return true if date is outside the range (before start OR after end)
  return normalizedDate < normalizedStart || normalizedDate > normalizedEnd
}
