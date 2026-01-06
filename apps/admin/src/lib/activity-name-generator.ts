import { ActivityType } from '@tailfire/shared-types'

interface FlightSegment {
  airline?: string
  flightNumber?: string
  departureAirport?: string
  arrivalAirport?: string
}

export interface NameGeneratorInput {
  activityType: ActivityType
  // Type-specific details
  restaurantName?: string
  propertyName?: string
  tourName?: string
  portName?: string
  cruiseLineName?: string
  shipName?: string
  origin?: string
  destination?: string
  flightSegments?: FlightSegment[]
  // Fallback
  name?: string
}

/**
 * Generate activity name from type-specific details
 * Centralized for consistency across all activity forms
 */
export function generateActivityName(input: NameGeneratorInput): string {
  switch (input.activityType) {
    case 'dining':
      return input.restaurantName || ''
    case 'lodging':
      return input.propertyName || ''
    case 'tour':
      return input.tourName || ''
    case 'port_info':
      return input.portName || ''
    case 'cruise':
    case 'custom_cruise':
      if (input.cruiseLineName && input.shipName) {
        return `${input.cruiseLineName} - ${input.shipName}`
      }
      return input.shipName || input.cruiseLineName || input.name || ''
    case 'transportation':
      if (input.origin && input.destination) {
        return `${input.origin} → ${input.destination}`
      }
      return input.name || ''
    case 'flight':
      return generateFlightName(input.flightSegments) || input.name || ''
    case 'options':
    case 'package':
    default:
      return input.name || ''
  }
}

/**
 * Generate flight name from segments
 * Format: "AC8006" (single) or "AC8006 / UA5678" (multi-leg)
 * Fallback: "YOW → PUJ" route format
 */
function generateFlightName(segments?: FlightSegment[]): string {
  if (!segments || segments.length === 0) return ''

  // Try flight number format first (e.g., "AC8006")
  const flightIdentifiers = segments
    .filter((seg) => seg.airline && seg.flightNumber)
    .map((seg) => `${seg.airline}${seg.flightNumber}`)

  if (flightIdentifiers.length > 0) {
    return flightIdentifiers.join(' / ')
  }

  // Fall back to route format (e.g., "YOW → PUJ")
  const airports = segments
    .flatMap((seg) => [seg.departureAirport, seg.arrivalAirport])
    .filter(Boolean)

  if (airports.length >= 2) {
    // Dedupe consecutive duplicates for connections
    const uniqueAirports = airports.filter(
      (airport, i) => i === 0 || airport !== airports[i - 1]
    )
    return uniqueAirports.join(' → ')
  }

  return ''
}

export function getActivityNamePlaceholder(activityType: ActivityType): string {
  switch (activityType) {
    case 'dining':
      return 'Enter restaurant name...'
    case 'lodging':
      return 'Enter property name...'
    case 'tour':
      return 'Enter tour name...'
    case 'port_info':
      return 'Enter port name...'
    case 'cruise':
    case 'custom_cruise':
      return 'Enter cruise details...'
    case 'transportation':
      return 'Enter transportation details...'
    case 'flight':
      return 'Enter flight details...'
    default:
      return 'Enter name...'
  }
}
