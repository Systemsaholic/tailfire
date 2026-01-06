/**
 * Flight Time Utilities
 *
 * Helpers for normalizing flight times between local and UTC representations.
 * Used for form field population and layover calculations.
 */

import type { NormalizedTime } from '@tailfire/shared-types'

/**
 * Form-friendly time representation
 */
export interface FormTimeFields {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  utc: string | null // ISO 8601 UTC for calculations
}

/**
 * Extract form-friendly date/time from NormalizedTime
 *
 * Strategy:
 * - Use `local` for display fields (what user sees)
 * - Store `utc` alongside for layover calculations
 * - Handle (+1 day) by comparing departure and arrival dates
 */
export function normalizedTimeToFormFields(
  normalizedTime: NormalizedTime | undefined
): FormTimeFields {
  if (!normalizedTime?.local) {
    return { date: '', time: '', utc: null }
  }

  const local = normalizedTime.local

  // Parse ISO string: "2025-01-15T14:30:00" or with offset
  const dateMatch = local.match(/^(\d{4}-\d{2}-\d{2})/)
  const timeMatch = local.match(/T(\d{2}:\d{2})/)

  return {
    date: dateMatch?.[1] ?? '',
    time: timeMatch?.[1] ?? '',
    utc: normalizedTime.utc ?? null,
  }
}

/**
 * Calculate layover using UTC times to avoid DST/timezone bugs
 *
 * @param arrivalUtc - UTC arrival time of previous leg
 * @param departureUtc - UTC departure time of next leg
 * @returns Minutes between flights, or null if times unavailable
 */
export function calculateLayoverMinutes(
  arrivalUtc: string | null | undefined,
  departureUtc: string | null | undefined
): number | null {
  if (!arrivalUtc || !departureUtc) return null

  try {
    const arrival = new Date(arrivalUtc)
    const departure = new Date(departureUtc)
    const diffMs = departure.getTime() - arrival.getTime()
    return Math.round(diffMs / (1000 * 60))
  } catch {
    return null
  }
}

/**
 * Check if arrival is next day relative to departure
 * Uses LOCAL dates (not UTC) since user sees local times
 *
 * Edge cases:
 * - Cross-midnight local: dep 23:00, arr 01:00 next day -> true
 * - Same calendar day different TZ: compare date portions only
 */
export function isNextDayArrival(
  departureDate: string, // YYYY-MM-DD (local)
  arrivalDate: string // YYYY-MM-DD (local)
): boolean {
  if (!departureDate || !arrivalDate) return false
  // Simple string comparison works for ISO dates
  return arrivalDate > departureDate
}

/**
 * Format layover duration for display
 */
export function formatLayoverDuration(minutes: number | null): string {
  if (minutes === null || minutes < 0) return '--'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Layover severity classification
 */
export type LayoverSeverity = 'too-short' | 'very-tight' | 'tight' | 'good' | 'long'

/**
 * Get layover severity based on minutes
 *
 * Thresholds:
 * - < 45 min: "Too Short" - likely to miss connection
 * - 45-60 min: "Very Tight" - risky
 * - 60-90 min: "Tight" - possible but stressful
 * - 90-240 min: "Good" - comfortable
 * - > 240 min: "Long Layover" - may be tiring
 */
export function getLayoverSeverity(minutes: number | null): LayoverSeverity {
  if (minutes === null || minutes < 0) return 'too-short'
  if (minutes < 45) return 'too-short'
  if (minutes < 60) return 'very-tight'
  if (minutes < 90) return 'tight'
  if (minutes <= 240) return 'good'
  return 'long'
}

/**
 * Get CSS class for layover severity badge
 */
export function getLayoverSeverityClass(severity: LayoverSeverity): string {
  const classes: Record<LayoverSeverity, string> = {
    'too-short': 'bg-red-100 text-red-800',
    'very-tight': 'bg-orange-100 text-orange-800',
    'tight': 'bg-amber-100 text-amber-800',
    'good': 'bg-green-100 text-green-800',
    'long': 'bg-gray-100 text-gray-600',
  }
  return classes[severity]
}

/**
 * Get human-readable layover severity label
 */
export function getLayoverSeverityLabel(severity: LayoverSeverity): string {
  const labels: Record<LayoverSeverity, string> = {
    'too-short': 'Too Short',
    'very-tight': 'Very Tight',
    'tight': 'Tight',
    'good': 'Good',
    'long': 'Long Layover',
  }
  return labels[severity]
}

/**
 * Format airport display name
 * @param iata - Airport IATA code (e.g., "YYZ")
 * @param name - Full airport name (e.g., "Toronto Pearson International Airport")
 */
export function formatAirportDisplay(iata: string, name?: string | null): string {
  if (!name) return iata
  // Shorten common suffixes
  const shortName = name
    .replace(/\s*International\s*Airport\s*/i, '')
    .replace(/\s*Airport\s*/i, '')
    .trim()
  return shortName || iata
}

/**
 * Parse flight number into airline code and number
 * @param flightNumber - Full flight number (e.g., "AC860", "UA 123")
 */
export function parseFlightNumber(flightNumber: string): {
  airlineCode: string
  number: string
} {
  // Remove spaces and uppercase
  const normalized = flightNumber.replace(/\s+/g, '').toUpperCase()

  // Match 2-3 letter/number airline code followed by numeric flight number
  const match = normalized.match(/^([A-Z0-9]{2,3})(\d+)$/)

  if (match && match[1] && match[2]) {
    return {
      airlineCode: match[1],
      number: match[2],
    }
  }

  // Return as-is if doesn't match expected pattern
  return {
    airlineCode: '',
    number: flightNumber,
  }
}
