/**
 * Flight Search API Types
 *
 * Shared types for flight search functionality.
 * Used by both the API (NestJS) and client (React/Next.js).
 */

/**
 * Normalized flight time with local and UTC representations
 */
export interface NormalizedTime {
  local?: string  // ISO 8601 with timezone or naive local
  utc?: string    // ISO 8601 in UTC
}

/**
 * Flight endpoint (departure or arrival)
 */
export interface FlightEndpoint {
  airportIata: string
  airportIcao?: string
  airportName?: string
  timezone?: string
  terminal?: string
  gate?: string
  scheduledTime?: NormalizedTime
  estimatedTime?: NormalizedTime
  actualTime?: NormalizedTime
  baggageBelt?: string  // arrivals only
}

/**
 * Normalized flight status from external API
 */
export interface NormalizedFlightStatus {
  flightNumber: string
  callSign?: string
  airline: {
    name: string
    iataCode?: string
    icaoCode?: string
  }
  departure: FlightEndpoint
  arrival: FlightEndpoint
  status: string
  statusCategory: 'scheduled' | 'active' | 'completed' | 'disrupted'
  aircraft?: {
    registration?: string
    model?: string
    modeS?: string
    imageUrl?: string
    imageAuthor?: string
  }
  lastUpdated?: string
  distanceKm?: number
}

/**
 * Flight search API response
 */
export interface FlightSearchResponse {
  success: boolean
  data?: NormalizedFlightStatus[]
  error?: string
  metadata?: {
    provider: string
    timestamp: string
    rateLimitRemaining?: number
    retryAfter?: number  // seconds until rate limit resets
  }
}

/**
 * Flight search parameters
 */
export interface FlightSearchParams {
  flightNumber: string
  dateLocal?: string  // YYYY-MM-DD
  searchBy?: 'number' | 'callsign' | 'reg' | 'icao24'
}
