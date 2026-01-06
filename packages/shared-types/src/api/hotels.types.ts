/**
 * Hotel API Types
 *
 * Shared type definitions for hotel search and lookup functionality.
 * Used by Google Places and Amadeus providers.
 */

/**
 * Hotel photo with optional attribution for API compliance
 */
export interface HotelPhoto {
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  /** Required for Google Places photos */
  attribution?: string
  /** Google Places photo reference for server-side download (e.g., "places/xxx/photos/yyy") */
  photoReference?: string
}

/**
 * Hotel review from Google Places or other review sources
 */
export interface HotelReview {
  author: string
  rating: number
  text?: string
  time?: string
}

/**
 * Hotel location details
 */
export interface HotelLocation {
  address: string
  city?: string
  country?: string
  postalCode?: string
  latitude?: number
  longitude?: number
}

/**
 * Board type for hotel offers
 */
export type HotelBoardType =
  | 'ROOM_ONLY'
  | 'BREAKFAST'
  | 'HALF_BOARD'
  | 'FULL_BOARD'
  | 'ALL_INCLUSIVE'

/**
 * Price breakdown for hotel offers
 */
export interface HotelPrice {
  currency: string
  total: string
  base?: string
  taxes?: string
}

/**
 * Cancellation policy for hotel offers
 */
export interface HotelCancellationPolicy {
  deadline?: string
  refundable?: boolean
  description?: string
}

/**
 * Hotel price offer from Amadeus
 */
export interface HotelPriceOffer {
  checkIn: string
  checkOut: string
  roomType?: string
  price: HotelPrice
  cancellationPolicy?: HotelCancellationPolicy
  boardType?: HotelBoardType
}

/**
 * Provider identifier for hotel results
 */
export type HotelProvider = 'google_places' | 'amadeus' | 'booking_com' | 'merged'

/**
 * Normalized hotel result from either provider
 * Supports merging Google Places metadata with Amadeus pricing
 */
export interface NormalizedHotelResult {
  /** Unique identifier (placeId for Google, hotelId for Amadeus) */
  id: string
  /** Google Places place_id */
  placeId?: string
  /** Amadeus hotel ID */
  hotelId?: string
  /** IATA city code (for Amadeus matching) */
  cityCode?: string
  /** Hotel name */
  name: string
  /** Hotel description */
  description?: string
  /** Location details */
  location: HotelLocation
  /** Contact phone number */
  phone?: string
  /** Hotel website URL */
  website?: string
  /** Google rating (1-5) */
  rating?: number
  /** Number of reviews */
  reviewCount?: number
  /** Star rating (1-5) */
  starRating?: number
  /** Hotel photos */
  photos?: HotelPhoto[]
  /** Guest reviews */
  reviews?: HotelReview[]
  /** Available amenities */
  amenities?: string[]
  /** Price offers from Amadeus */
  offers?: HotelPriceOffer[]
  /** Which provider(s) supplied this data */
  provider: HotelProvider
  /** Providers that contributed to this result */
  providers?: HotelProvider[]
}

/**
 * Search parameters for hotel search/lookup
 */
export interface HotelSearchParams {
  /** Destination city or location name */
  destination?: string
  /** Latitude for geo-based search */
  latitude?: number
  /** Longitude for geo-based search */
  longitude?: number
  /** Search radius in meters */
  radius?: number
  /** Check-in date (YYYY-MM-DD) - triggers pricing lookup */
  checkIn?: string
  /** Check-out date (YYYY-MM-DD) - triggers pricing lookup */
  checkOut?: string
  /** Number of adult guests */
  adults?: number
  /** Hotel name for lookup/autocomplete */
  hotelName?: string
  /** Force specific provider */
  provider?: 'google_places' | 'amadeus'
  /** IATA city code (for Amadeus) */
  cityCode?: string
}

/**
 * Hotel search response
 */
export interface HotelSearchResponse {
  results: NormalizedHotelResult[]
  /** Provider that returned results */
  provider: HotelProvider
  /** Whether fallback was used */
  usedFallback?: boolean
  /** Error message if partial failure */
  warning?: string
}

