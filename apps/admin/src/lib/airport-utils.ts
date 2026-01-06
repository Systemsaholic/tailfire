/**
 * Airport Lookup Utility
 *
 * Provides airport information for hover popovers in the flight journey display.
 * Prioritizes persisted data from Aerodatabox API, falls back to static lookup.
 */

import { AIRPORTS, type StaticAirportData } from './data/airports'

/**
 * Airport information for display in popovers
 */
export interface AirportInfo {
  /** IATA airport code (e.g., "YYZ") */
  code: string
  /** Full airport name */
  name: string
  /** City or municipality */
  city: string
  /** Country code (e.g., "CA", "US") */
  country?: string
  /** IANA timezone (e.g., "America/Toronto") */
  timezone?: string
  /** Latitude coordinate */
  lat?: number
  /** Longitude coordinate */
  lon?: number
}

/**
 * Persisted airport data from database (from Aerodatabox API)
 */
export interface PersistedAirportData {
  name?: string | null
  city?: string | null
  lat?: number | null
  lon?: number | null
}

/**
 * Get airport information with fallback chain:
 * 1. Persisted data (from Aerodatabox API via database)
 * 2. Static lookup (from local airports.ts)
 * 3. Unknown airport (code only)
 *
 * @param code - IATA airport code
 * @param persisted - Optional persisted data from database
 * @param timezone - Optional timezone from flight data
 * @returns Airport information or null if no code provided
 *
 * @example
 * ```ts
 * // With persisted data (from API)
 * const info = getAirportInfo('YYZ', {
 *   name: 'Toronto Pearson International Airport',
 *   city: 'Toronto',
 *   lat: 43.6777,
 *   lon: -79.6248
 * }, 'America/Toronto')
 *
 * // Without persisted data (static lookup)
 * const info = getAirportInfo('LHR')
 *
 * // Unknown airport
 * const info = getAirportInfo('XXX') // Returns { code: 'XXX', name: 'XXX', city: 'Unknown' }
 * ```
 */
export function getAirportInfo(
  code: string | null | undefined,
  persisted?: PersistedAirportData | null,
  timezone?: string | null
): AirportInfo | null {
  if (!code) return null

  const upperCode = code.toUpperCase().trim()

  // Priority 1: Use persisted data from database (from Aerodatabox API)
  if (persisted?.name) {
    return {
      code: upperCode,
      name: persisted.name,
      city: persisted.city || 'Unknown',
      timezone: timezone || undefined,
      lat: persisted.lat ?? undefined,
      lon: persisted.lon ?? undefined,
    }
  }

  // Priority 2: Fall back to static lookup
  const staticData: StaticAirportData | undefined = AIRPORTS[upperCode]
  if (staticData) {
    return {
      code: upperCode,
      name: staticData.name,
      city: staticData.city,
      country: staticData.country,
      timezone: timezone || undefined,
      lat: staticData.lat,
      lon: staticData.lon,
    }
  }

  // Priority 3: Unknown airport - return code only
  return {
    code: upperCode,
    name: upperCode, // Use code as name when unknown
    city: 'Unknown',
    timezone: timezone || undefined,
  }
}

/**
 * Check if an airport code exists in the static database
 *
 * @param code - IATA airport code
 * @returns true if airport is in static database
 */
export function isKnownAirport(code: string | null | undefined): boolean {
  if (!code) return false
  return code.toUpperCase().trim() in AIRPORTS
}

/**
 * Get airport name from static data only (no persisted data check)
 * Useful for quick lookups when you don't have persisted data
 *
 * @param code - IATA airport code
 * @returns Airport name or the code itself if not found
 */
export function getAirportName(code: string | null | undefined): string {
  if (!code) return '???'
  const upperCode = code.toUpperCase().trim()
  return AIRPORTS[upperCode]?.name || upperCode
}

/**
 * Get airport city from static data only
 *
 * @param code - IATA airport code
 * @returns City name or 'Unknown' if not found
 */
export function getAirportCity(code: string | null | undefined): string {
  if (!code) return 'Unknown'
  const upperCode = code.toUpperCase().trim()
  return AIRPORTS[upperCode]?.city || 'Unknown'
}

/**
 * Format airport for display: "YYZ - Toronto"
 *
 * @param code - IATA airport code
 * @returns Formatted string like "YYZ - Toronto" or just "YYZ" if city unknown
 */
export function formatAirportDisplay(code: string | null | undefined): string {
  if (!code) return '???'
  const upperCode = code.toUpperCase().trim()
  const staticData = AIRPORTS[upperCode]
  if (staticData) {
    return `${upperCode} - ${staticData.city}`
  }
  return upperCode
}

/**
 * Airport data for search results
 */
export interface AirportSearchResult {
  code: string
  name: string
  city: string
  country: string
  lat: number
  lon: number
}

// Pre-compute array for faster searches
const AIRPORTS_ARRAY: AirportSearchResult[] = Object.entries(AIRPORTS).map(([code, data]) => ({
  code,
  name: data.name,
  city: data.city,
  country: data.country,
  lat: data.lat,
  lon: data.lon,
}))

/**
 * Search airports by code, name, or city
 *
 * @param query - Search query (code, name, or city)
 * @param limit - Maximum number of results to return
 * @returns Array of matching airports sorted by relevance
 *
 * @example
 * ```ts
 * searchAirports('YYZ')      // Exact code match
 * searchAirports('Toronto')  // City search
 * searchAirports('Pearson')  // Name search
 * ```
 */
export function searchAirports(query: string, limit = 15): AirportSearchResult[] {
  if (!query.trim()) return AIRPORTS_ARRAY.slice(0, limit)

  const searchTerm = query.toLowerCase().trim()

  // Exact code match gets highest priority
  const exactCodeMatch = AIRPORTS_ARRAY.filter(
    (a) => a.code.toLowerCase() === searchTerm
  )

  // Code starts with search term
  const codeStartsWithMatches = AIRPORTS_ARRAY.filter(
    (a) =>
      a.code.toLowerCase().startsWith(searchTerm) &&
      !exactCodeMatch.includes(a)
  )

  // City starts with search term (common use case: "New York", "Toronto")
  const cityStartsWithMatches = AIRPORTS_ARRAY.filter(
    (a) =>
      a.city.toLowerCase().startsWith(searchTerm) &&
      !exactCodeMatch.includes(a) &&
      !codeStartsWithMatches.includes(a)
  )

  // Name starts with search term
  const nameStartsWithMatches = AIRPORTS_ARRAY.filter(
    (a) =>
      a.name.toLowerCase().startsWith(searchTerm) &&
      !exactCodeMatch.includes(a) &&
      !codeStartsWithMatches.includes(a) &&
      !cityStartsWithMatches.includes(a)
  )

  // Contains matches (city or name)
  const containsMatches = AIRPORTS_ARRAY.filter(
    (a) =>
      (a.city.toLowerCase().includes(searchTerm) ||
        a.name.toLowerCase().includes(searchTerm) ||
        a.code.toLowerCase().includes(searchTerm)) &&
      !exactCodeMatch.includes(a) &&
      !codeStartsWithMatches.includes(a) &&
      !cityStartsWithMatches.includes(a) &&
      !nameStartsWithMatches.includes(a)
  )

  return [
    ...exactCodeMatch,
    ...codeStartsWithMatches,
    ...cityStartsWithMatches,
    ...nameStartsWithMatches,
    ...containsMatches,
  ].slice(0, limit)
}

/**
 * Get airport data by IATA code
 *
 * @param code - IATA airport code
 * @returns Airport data or undefined if not found
 */
export function getAirportByCode(code: string): AirportSearchResult | undefined {
  if (!code) return undefined
  const upperCode = code.toUpperCase().trim()
  const data = AIRPORTS[upperCode]
  if (!data) return undefined
  return {
    code: upperCode,
    name: data.name,
    city: data.city,
    country: data.country,
    lat: data.lat,
    lon: data.lon,
  }
}
