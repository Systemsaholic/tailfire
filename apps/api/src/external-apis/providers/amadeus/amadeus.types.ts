/**
 * Amadeus On Demand Flight Status API Types
 *
 * Type definitions for Amadeus flight schedule API responses.
 * Used as a fallback when Aerodatabox returns no results.
 *
 * @see https://developers.amadeus.com/self-service/category/flights/api-doc/on-demand-flight-status
 */

// Re-export normalized types from aerodatabox (shared between providers)
export {
  NormalizedFlightStatus,
  NormalizedFlightEndpoint,
  NormalizedTime,
  FlightStatusParams,
} from '../aerodatabox/aerodatabox.types'

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * Parameters for Amadeus flight schedule search
 */
export interface AmadeusFlightSearchParams {
  /** Airline IATA code (e.g., "AC", "WS") */
  carrierCode: string
  /** Flight number without airline prefix (e.g., "8006") */
  flightNumber: string
  /** Scheduled departure date in YYYY-MM-DD format */
  scheduledDepartureDate: string
}

/**
 * OAuth2 token response from Amadeus
 */
export interface AmadeusTokenResponse {
  /** JWT access token */
  access_token: string
  /** Token type (always "Bearer") */
  token_type: 'Bearer'
  /** Token lifetime in seconds (typically 1799 = ~30 min) */
  expires_in: number
  /** Application name */
  application_name?: string
  /** Client ID echo */
  client_id?: string
  /** Token type echo */
  type?: string
  /** Scope (typically empty for client credentials) */
  scope?: string
  /** State (for OAuth2 state parameter) */
  state?: string
}

// ============================================================================
// API RESPONSE TYPES - Raw Amadeus Responses
// ============================================================================

/**
 * Timing qualifier codes from Amadeus
 */
export type AmadeusTiming =
  | 'STD'  // Scheduled Time of Departure
  | 'STA'  // Scheduled Time of Arrival
  | 'ETD'  // Estimated Time of Departure
  | 'ETA'  // Estimated Time of Arrival
  | 'ATD'  // Actual Time of Departure
  | 'ATA'  // Actual Time of Arrival

/**
 * Timing entry from Amadeus
 */
export interface AmadeusTimingEntry {
  /** Timing qualifier code */
  qualifier: AmadeusTiming
  /** ISO 8601 datetime value (e.g., "2026-02-07T10:50") */
  value: string
}

/**
 * Delay entry from Amadeus
 */
export interface AmadeusDelayEntry {
  /** Duration in ISO 8601 format (e.g., "PT30M") */
  duration: string
}

/**
 * Terminal information from Amadeus
 */
export interface AmadeusTerminal {
  /** Terminal code */
  code?: string
}

/**
 * Gate information from Amadeus
 */
export interface AmadeusGate {
  /** Gate number/code */
  mainGate?: string
}

/**
 * Departure information at a flight point
 */
export interface AmadeusDeparture {
  /** Timing entries (scheduled, estimated, actual) */
  timings?: AmadeusTimingEntry[]
  /** Delay information */
  delays?: AmadeusDelayEntry[]
  /** Terminal info */
  terminal?: AmadeusTerminal
  /** Gate info */
  gate?: AmadeusGate
}

/**
 * Arrival information at a flight point
 */
export interface AmadeusArrival {
  /** Timing entries (scheduled, estimated, actual) */
  timings?: AmadeusTimingEntry[]
  /** Delay information */
  delays?: AmadeusDelayEntry[]
  /** Terminal info */
  terminal?: AmadeusTerminal
  /** Gate info */
  gate?: AmadeusGate
}

/**
 * Flight point (departure or arrival airport)
 */
export interface AmadeusFlightPoint {
  /** Airport IATA code */
  iataCode: string
  /** Departure information (only on departure point) */
  departure?: AmadeusDeparture
  /** Arrival information (only on arrival point) */
  arrival?: AmadeusArrival
}

/**
 * Aircraft equipment information
 */
export interface AmadeusAircraftEquipment {
  /** IATA aircraft type code (e.g., "321" for A321) */
  aircraftType?: string
}

/**
 * Flight leg information
 */
export interface AmadeusLeg {
  /** Departure point index in flightPoints array */
  boardPointIataCode?: string
  /** Arrival point index in flightPoints array */
  offPointIataCode?: string
  /** Scheduled leg duration in ISO 8601 format (e.g., "PT7H50M") */
  scheduledLegDuration?: string
  /** Aircraft equipment info */
  aircraftEquipment?: AmadeusAircraftEquipment
}

/**
 * Flight segment information
 */
export interface AmadeusSegment {
  /** Departure point info */
  boardPointIataCode?: string
  /** Arrival point info */
  offPointIataCode?: string
  /** Scheduled segment duration */
  scheduledSegmentDuration?: string
  /** Marketing carrier info */
  partnership?: {
    operatingFlight?: {
      carrierCode?: string
      flightNumber?: string
    }
  }
}

/**
 * Flight designator (carrier code + flight number)
 */
export interface AmadeusFlightDesignator {
  /** Airline IATA code */
  carrierCode: string
  /** Flight number (numeric) */
  flightNumber: number
  /** Operational suffix */
  operationalSuffix?: string
}

/**
 * Dated flight response from Amadeus
 */
export interface AmadeusDatedFlight {
  /** Resource type (always "DatedFlight") */
  type: 'DatedFlight'
  /** Scheduled departure date (YYYY-MM-DD) */
  scheduledDepartureDate: string
  /** Flight designator (carrier + number) */
  flightDesignator: AmadeusFlightDesignator
  /** Flight points (departure and arrival airports with times) */
  flightPoints: AmadeusFlightPoint[]
  /** Flight legs (aircraft and duration info) */
  legs?: AmadeusLeg[]
  /** Flight segments (for connections) */
  segments?: AmadeusSegment[]
}

/**
 * Complete Amadeus API response wrapper
 */
export interface AmadeusFlightResponse {
  /** Response metadata */
  meta?: {
    count?: number
    links?: {
      self?: string
    }
  }
  /** Array of dated flights */
  data: AmadeusDatedFlight[]
  /** Dictionaries for code lookups (airlines, aircraft, etc.) */
  dictionaries?: {
    carriers?: Record<string, string>
    aircraft?: Record<string, string>
  }
}

/**
 * Amadeus error response
 */
export interface AmadeusErrorResponse {
  errors: Array<{
    status: number
    code: number
    title: string
    detail?: string
    source?: {
      parameter?: string
      pointer?: string
    }
  }>
}

// ============================================================================
// CREDENTIAL TYPES
// ============================================================================

/**
 * Amadeus API credentials (OAuth2 client credentials)
 */
export interface AmadeusCredentials {
  /** Amadeus API Client ID */
  clientId: string
  /** Amadeus API Client Secret */
  clientSecret: string
}

// ============================================================================
// TOKEN CACHE TYPES
// ============================================================================

/**
 * Cached OAuth2 token with expiry
 */
export interface AmadeusTokenCache {
  /** Access token string */
  token: string
  /** Absolute expiry timestamp (ms since epoch) */
  expiresAt: number
}
