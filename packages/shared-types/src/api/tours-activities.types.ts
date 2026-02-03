/**
 * Tours & Activities Search API Types
 *
 * Shared types for tours and activities search functionality.
 * Used by both the API (NestJS) and client (React/Next.js).
 */

/**
 * Normalized tour/activity result from external API
 */
export interface NormalizedTourActivity {
  id: string
  name: string
  description?: string
  price?: {
    currency: string
    amount: string
  }
  duration?: string             // ISO 8601 or "2 hours"
  location: {
    lat: number
    lng: number
    address?: string
  }
  rating?: number
  reviewCount?: number
  pictures?: string[]
  provider: string
  bookingLink?: string
}

/**
 * Tour/activity search parameters
 */
export interface TourActivitySearchParams {
  latitude: number
  longitude: number
  radius?: number               // km, default 20
  keyword?: string
}

/**
 * Tour/activity search API response
 */
export interface TourActivitySearchResponse {
  results: NormalizedTourActivity[]
  provider: string
  warning?: string
}
