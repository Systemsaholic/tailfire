/**
 * Flight Journey Utilities
 *
 * Utility functions for calculating flight durations, layovers, and formatting
 * flight journey information for display.
 *
 * Ported from alpha with adaptations for beta's camelCase conventions.
 */

import type { FlightSegmentDto } from '@tailfire/shared-types'

// =============================================================================
// Time Formatting Utilities
// =============================================================================

/**
 * Format minutes into human-readable duration string
 * @example formatMinutes(150) => "2h 30m"
 * @example formatMinutes(45) => "45m"
 * @example formatMinutes(120) => "2h"
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format time with next-day indicator if departure is after arrival
 * @example formatTimeWithDayIndicator("23:00", "2024-01-01", "01:30", "2024-01-02") => "01:30 +1"
 */
export function formatTimeWithDayIndicator(
  _departureTime: string | null | undefined,
  departureDate: string | null | undefined,
  arrivalTime: string | null | undefined,
  arrivalDate: string | null | undefined
): string {
  if (!arrivalTime) return '--:--'

  // Format the time
  const formattedTime = arrivalTime.substring(0, 5) // HH:mm

  // Check if arrival is on a different day
  if (departureDate && arrivalDate && departureDate !== arrivalDate) {
    const depDate = new Date(departureDate)
    const arrDate = new Date(arrivalDate)
    const dayDiff = Math.floor((arrDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))

    if (dayDiff > 0) {
      return `${formattedTime} +${dayDiff}`
    }
  }

  return formattedTime
}

// =============================================================================
// Duration Calculations
// =============================================================================

/**
 * Calculate flight duration in minutes between departure and arrival
 * Returns null if required data is missing
 */
export function getFlightDurationMinutes(segment: FlightSegmentDto): number | null {
  if (!segment.departureDate || !segment.departureTime || !segment.arrivalDate || !segment.arrivalTime) {
    return null
  }

  const departure = new Date(`${segment.departureDate}T${segment.departureTime}`)
  const arrival = new Date(`${segment.arrivalDate}T${segment.arrivalTime}`)

  const diffMs = arrival.getTime() - departure.getTime()
  return Math.floor(diffMs / (1000 * 60))
}

/**
 * Format flight duration for display
 * @example getFlightDuration(segment) => "2h 30m" or "--"
 */
export function getFlightDuration(segment: FlightSegmentDto): string {
  const minutes = getFlightDurationMinutes(segment)
  if (minutes === null || minutes < 0) return '--'
  return formatMinutes(minutes)
}

/**
 * Calculate layover duration in minutes between two consecutive segments
 * Returns null if data is missing or segments aren't consecutive
 */
export function getLayoverMinutes(
  previousSegment: FlightSegmentDto,
  nextSegment: FlightSegmentDto
): number | null {
  if (
    !previousSegment.arrivalDate ||
    !previousSegment.arrivalTime ||
    !nextSegment.departureDate ||
    !nextSegment.departureTime
  ) {
    return null
  }

  const arrival = new Date(`${previousSegment.arrivalDate}T${previousSegment.arrivalTime}`)
  const departure = new Date(`${nextSegment.departureDate}T${nextSegment.departureTime}`)

  const diffMs = departure.getTime() - arrival.getTime()
  return Math.floor(diffMs / (1000 * 60))
}

/**
 * Format layover duration for display
 */
export function getLayoverDuration(
  previousSegment: FlightSegmentDto,
  nextSegment: FlightSegmentDto
): string {
  const minutes = getLayoverMinutes(previousSegment, nextSegment)
  if (minutes === null || minutes < 0) return '--'
  return formatMinutes(minutes)
}

// =============================================================================
// Layover Status Classification
// =============================================================================

export type LayoverStatus = 'tight' | 'short' | 'comfortable' | 'long' | 'overnight' | 'unknown'

/**
 * Classify layover duration into status categories
 * - tight: < 60 minutes (risky connection)
 * - short: 60-90 minutes (minimum recommended)
 * - comfortable: 90-180 minutes (ideal)
 * - long: 180-480 minutes (extended wait)
 * - overnight: > 480 minutes (likely different day)
 */
export function getLayoverStatus(minutes: number | null): LayoverStatus {
  if (minutes === null || minutes < 0) return 'unknown'

  if (minutes < 60) return 'tight'
  if (minutes < 90) return 'short'
  if (minutes < 180) return 'comfortable'
  if (minutes < 480) return 'long'
  return 'overnight'
}

/**
 * Get CSS color class for layover status badge
 */
export function getLayoverStatusColor(status: LayoverStatus): string {
  switch (status) {
    case 'tight':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'short':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'comfortable':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'long':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'overnight':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

/**
 * Get human-readable label for layover status
 */
export function getLayoverStatusLabel(status: LayoverStatus): string {
  switch (status) {
    case 'tight':
      return 'Tight connection'
    case 'short':
      return 'Short layover'
    case 'comfortable':
      return 'Comfortable'
    case 'long':
      return 'Extended layover'
    case 'overnight':
      return 'Overnight'
    default:
      return 'Layover'
  }
}

// =============================================================================
// Journey Summary Utilities
// =============================================================================

/**
 * Get total journey duration across all segments including layovers
 */
export function getTotalJourneyMinutes(segments: FlightSegmentDto[]): number | null {
  if (segments.length === 0) return null

  const firstSegment = segments[0]!
  const lastSegment = segments[segments.length - 1]!

  if (
    !firstSegment.departureDate ||
    !firstSegment.departureTime ||
    !lastSegment.arrivalDate ||
    !lastSegment.arrivalTime
  ) {
    return null
  }

  const departure = new Date(`${firstSegment.departureDate}T${firstSegment.departureTime}`)
  const arrival = new Date(`${lastSegment.arrivalDate}T${lastSegment.arrivalTime}`)

  return Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60))
}

/**
 * Format total journey duration
 */
export function getTotalJourneyDuration(segments: FlightSegmentDto[]): string {
  const minutes = getTotalJourneyMinutes(segments)
  if (minutes === null || minutes < 0) return '--'
  return formatMinutes(minutes)
}

/**
 * Get journey route string (e.g., "YYZ → ORD → LHR")
 */
export function getJourneyRoute(segments: FlightSegmentDto[]): string {
  if (segments.length === 0) return ''

  const airports: string[] = []

  segments.forEach((segment, index) => {
    if (index === 0 && segment.departureAirportCode) {
      airports.push(segment.departureAirportCode)
    }
    if (segment.arrivalAirportCode) {
      airports.push(segment.arrivalAirportCode)
    }
  })

  return airports.join(' → ')
}

/**
 * Check if journey has any tight connections (< 60 minutes)
 */
export function hasRiskyConnections(segments: FlightSegmentDto[]): boolean {
  for (let i = 0; i < segments.length - 1; i++) {
    const layover = getLayoverMinutes(segments[i]!, segments[i + 1]!)
    if (layover !== null && layover < 60) {
      return true
    }
  }
  return false
}

/**
 * Get number of stops (connections) in a journey
 */
export function getStopCount(segments: FlightSegmentDto[]): number {
  return Math.max(0, segments.length - 1)
}

/**
 * Format stop count for display
 */
export function formatStopCount(segments: FlightSegmentDto[]): string {
  const stops = getStopCount(segments)
  if (stops === 0) return 'Direct'
  if (stops === 1) return '1 stop'
  return `${stops} stops`
}
