/**
 * Date/Time Constants
 *
 * Standard formats, timezone identifiers, and other date-related constants.
 * These are shared across frontend and backend for consistency.
 */

/**
 * Standard date format (YYYY-MM-DD)
 * Used for calendar dates without time-of-day (e.g., trip start/end dates, birthdates)
 */
export const DATE_FORMAT = 'yyyy-MM-dd'

/**
 * ISO 8601 format with timezone (used for API responses)
 * Example: "2025-01-15T10:30:00.000Z"
 */
export const ISO_8601_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSX"

/**
 * Display format for timestamps (human-readable)
 * Example: "Jan 15, 2025 10:30 AM"
 */
export const DISPLAY_DATETIME_FORMAT = 'MMM d, yyyy h:mm a'

/**
 * Display format for dates only (human-readable)
 * Example: "Jan 15, 2025"
 */
export const DISPLAY_DATE_FORMAT = 'MMM d, yyyy'

/**
 * IANA Timezone Identifiers
 * Common North American timezones for the travel industry
 *
 * For full list, see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 */
export const COMMON_TIMEZONES = [
  // Eastern Time
  'America/New_York',
  'America/Toronto',
  // Central Time
  'America/Chicago',
  'America/Winnipeg',
  // Mountain Time
  'America/Denver',
  'America/Edmonton',
  // Pacific Time
  'America/Los_Angeles',
  'America/Vancouver',
  // Atlantic Time
  'America/Halifax',
  // Alaska Time
  'America/Anchorage',
  // Hawaii Time
  'Pacific/Honolulu',
  // UTC (for reference)
  'UTC',
] as const

/**
 * Comprehensive IANA Timezone list
 * This includes all major timezones worldwide.
 * Reference: https://www.iana.org/time-zones
 */
export const IANA_TIMEZONES = [
  // Africa
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Algiers',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',

  // Americas
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Chicago',
  'America/Denver',
  'America/Edmonton',
  'America/Halifax',
  'America/Lima',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Toronto',
  'America/Vancouver',
  'America/Winnipeg',

  // Asia
  'Asia/Bangkok',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tehran',
  'Asia/Tokyo',

  // Australia
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Darwin',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',

  // Europe
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',

  // Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',

  // UTC
  'UTC',
] as const

/**
 * Type for IANA timezone strings
 */
export type IanaTimezone = typeof IANA_TIMEZONES[number]

/**
 * Type for common North American timezones
 */
export type CommonTimezone = typeof COMMON_TIMEZONES[number]
