/**
 * Aerodatabox API Types
 *
 * Type definitions for Aerodatabox flight data API responses.
 * Based on OpenAPI spec version 1.9.0.0
 *
 * @see https://doc.aerodatabox.com/
 */

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * Search parameter types for flight lookup
 */
export type FlightSearchBy = 'number' | 'callsign' | 'reg' | 'icao24'

/**
 * Airport code types
 */
export type AirportCodeType = 'iata' | 'icao'

/**
 * Parameters for flight status search
 */
export interface FlightStatusParams {
  /** Flight number (e.g., "AA123", "DL456") */
  flightNumber: string
  /** Optional date in local time (YYYY-MM-DD format) */
  dateLocal?: string
  /** Search type - defaults to 'number' */
  searchBy?: FlightSearchBy
}

/**
 * Parameters for airport FIDS (departures/arrivals)
 */
export interface AirportFidsParams {
  /** Airport code (IATA or ICAO) */
  airportCode: string
  /** Code type - defaults to 'iata' */
  codeType?: AirportCodeType
  /** Start datetime (ISO format) */
  fromLocal?: string
  /** End datetime (ISO format) */
  toLocal?: string
  /** Filter by direction */
  direction?: 'departure' | 'arrival' | 'both'
}

// ============================================================================
// API RESPONSE TYPES - Raw Aerodatabox Responses
// ============================================================================

/**
 * Raw airport info from Aerodatabox
 */
export interface AerodataboxAirport {
  icao: string
  iata: string | null
  name: string
  shortName?: string
  municipalityName?: string
  countryCode?: string
  location?: {
    lat: number
    lon: number
  }
  timezone?: string
}

/**
 * Raw flight times from Aerodatabox
 *
 * The API returns times in UTC and local format, not as separate scheduled/revised/actual.
 * Example: { "utc": "2026-01-05 23:35Z", "local": "2026-01-05 18:35-05:00" }
 */
export interface AerodataboxFlightTimes {
  /** UTC time (format: "2026-01-05 23:35Z") */
  utc?: string
  /** Local time with offset (format: "2026-01-05 18:35-05:00") */
  local?: string
}

/**
 * Raw departure info from Aerodatabox
 */
export interface AerodataboxDeparture {
  airport: AerodataboxAirport
  scheduledTime?: AerodataboxFlightTimes
  revisedTime?: AerodataboxFlightTimes
  terminal?: string
  gate?: string
  checkInDesk?: string
  runwayTime?: AerodataboxFlightTimes
  quality?: string[]
}

/**
 * Raw arrival info from Aerodatabox
 */
export interface AerodataboxArrival {
  airport: AerodataboxAirport
  scheduledTime?: AerodataboxFlightTimes
  revisedTime?: AerodataboxFlightTimes
  terminal?: string
  gate?: string
  baggageBelt?: string
  runwayTime?: AerodataboxFlightTimes
  quality?: string[]
}

/**
 * Raw airline info from Aerodatabox
 */
export interface AerodataboxAirline {
  name: string
  iata?: string
  icao?: string
}

/**
 * Raw aircraft info from Aerodatabox
 */
export interface AerodataboxAircraft {
  reg?: string
  modeS?: string
  model?: string
  image?: {
    url: string
    webUrl: string
    author: string
    title: string
    description: string
    license: string
    htmlAttributions: string[]
  }
}

/**
 * Flight status values from Aerodatabox
 */
export type AerodataboxFlightStatus =
  | 'Unknown'
  | 'Expected'
  | 'EnRoute'
  | 'CheckIn'
  | 'Boarding'
  | 'GateClosed'
  | 'Departed'
  | 'Delayed'
  | 'Approaching'
  | 'Arrived'
  | 'Canceled'
  | 'Diverted'
  | 'CanceledUncertain'

/**
 * Raw flight response from Aerodatabox API
 */
export interface AerodataboxFlightResponse {
  /** Aerodatabox internal ID */
  greatCircleDistance?: {
    meter: number
    km: number
    mile: number
    nm: number
    feet: number
  }
  departure: AerodataboxDeparture
  arrival: AerodataboxArrival
  lastUpdatedUtc?: string
  number: string
  callSign?: string
  status: AerodataboxFlightStatus
  codeshareStatus?: 'IsOperator' | 'IsCodeshared'
  isCargo?: boolean
  aircraft?: AerodataboxAircraft
  airline?: AerodataboxAirline
}

/**
 * Response from flight status endpoint (can be array)
 */
export type AerodataboxFlightStatusResponse = AerodataboxFlightResponse[]

// ============================================================================
// TRANSFORMED/NORMALIZED TYPES - Used within Tailfire
// ============================================================================

/**
 * Normalized time with both local and UTC representations
 *
 * Aerodatabox returns times in local airport timezone.
 * We surface both for UI flexibility and scheduling accuracy.
 */
export interface NormalizedTime {
  /** Time in airport local timezone (ISO 8601 with offset, e.g., "2025-01-15T14:30:00-05:00") */
  local?: string
  /** Time in UTC (ISO 8601, e.g., "2025-01-15T19:30:00Z") */
  utc?: string
}

/**
 * Normalized airport endpoint (departure/arrival) with timezone info
 */
export interface NormalizedFlightEndpoint {
  airportIata: string
  airportIcao: string
  airportName: string
  /** IANA timezone (e.g., "America/New_York") - critical for time conversion */
  timezone?: string
  terminal?: string
  gate?: string
  /** Baggage belt (arrival only) */
  baggageBelt?: string
  /** Scheduled time */
  scheduledTime?: NormalizedTime
  /** Estimated/revised time */
  estimatedTime?: NormalizedTime
  /** Actual time (departed/arrived) */
  actualTime?: NormalizedTime
}

/**
 * Normalized flight status for Tailfire
 */
export interface NormalizedFlightStatus {
  /** Flight number (e.g., "AA123") */
  flightNumber: string
  /** ATC callsign if available */
  callSign?: string
  /** Operating airline */
  airline: {
    name: string
    iataCode?: string
    icaoCode?: string
  }
  /** Departure information */
  departure: NormalizedFlightEndpoint
  /** Arrival information */
  arrival: NormalizedFlightEndpoint
  /** Current flight status */
  status: AerodataboxFlightStatus
  /** Normalized status for UI */
  statusCategory: 'scheduled' | 'active' | 'completed' | 'disrupted'
  /** Aircraft information */
  aircraft?: {
    registration?: string
    model?: string
    modeS?: string
    imageUrl?: string
    imageAuthor?: string
  }
  /** Last update timestamp (ISO 8601 UTC) */
  lastUpdated?: string
  /** Distance in kilometers */
  distanceKm?: number
}

// ============================================================================
// CREDENTIAL TYPES
// ============================================================================

/**
 * Aerodatabox API credentials (via RapidAPI)
 */
export interface AerodataboxCredentials {
  /** RapidAPI key */
  rapidApiKey: string
  /** RapidAPI host (defaults to aerodatabox.p.rapidapi.com) */
  rapidApiHost?: string
}

// ============================================================================
// AIRPORT TYPES
// ============================================================================

/**
 * Raw airport response from Aerodatabox /airports/{codeType}/{code} endpoint
 */
export interface AerodataboxAirportResponse {
  /** ICAO code */
  icao: string
  /** IATA code (may be null for some airports) */
  iata: string | null
  /** Full airport name */
  name: string
  /** Short name */
  shortName?: string
  /** City/municipality name */
  municipalityName?: string
  /** ISO country code */
  countryCode?: string
  /** Geographic location */
  location?: {
    lat: number
    lon: number
  }
  /** IANA timezone (e.g., "America/Toronto") */
  timezone?: string
  /** Elevation in feet */
  elevation?: {
    feet: number
    meter: number
  }
  /** URLs for more info */
  urls?: {
    webSite?: string
    wikipedia?: string
    flightRadar?: string
  }
}

/**
 * Normalized airport info for TailFire
 */
export interface NormalizedAirportInfo {
  /** IATA code (e.g., "YYZ") */
  iata: string
  /** ICAO code (e.g., "CYYZ") */
  icao: string
  /** Full airport name */
  name: string
  /** City name */
  city: string
  /** ISO country code */
  countryCode: string
  /** Latitude */
  lat?: number
  /** Longitude */
  lon?: number
  /** IANA timezone */
  timezone?: string
}
