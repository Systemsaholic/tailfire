/**
 * Transfer Search API Types
 *
 * Shared types for transfer search functionality (airport/hotel transfers).
 * Used by both the API (NestJS) and client (React/Next.js).
 */

/**
 * Transfer location type
 */
export type TransferLocationType = 'airport' | 'hotel' | 'address' | 'railway_station' | 'port'

/**
 * Transfer search parameters
 */
export interface TransferSearchParams {
  pickupType: TransferLocationType
  pickupCode?: string           // IATA code for airport, hotel ID, etc.
  pickupLat?: number
  pickupLng?: number
  pickupAddress?: string
  pickupCountryCode?: string
  dropoffType: TransferLocationType
  dropoffCode?: string
  dropoffLat?: number
  dropoffLng?: number
  dropoffAddress?: string
  dropoffCountryCode?: string
  date: string                  // YYYY-MM-DD
  time: string                  // HH:mm
  timezone?: string
  passengers: number
}

/**
 * Normalized transfer result from external API
 */
export interface NormalizedTransferResult {
  id: string
  transferType: string          // PRIVATE, SHARED, TAXI, etc.
  provider: string
  vehicle: {
    type: string
    description: string
    maxPassengers: number
    maxBags?: number
  }
  price: {
    currency: string
    total: string
    base?: string
  }
  duration?: string             // ISO 8601 duration
  pickupLocation: {
    address: string
    lat?: number
    lng?: number
  }
  dropoffLocation: {
    address: string
    lat?: number
    lng?: number
  }
  cancellationPolicy?: {
    deadline?: string
    refundable: boolean
    description?: string
  }
}

/**
 * Transfer search API response
 */
export interface TransferSearchResponse {
  results: NormalizedTransferResult[]
  provider: string
  warning?: string
}
