/**
 * API Configuration Interfaces
 *
 * Defines configuration structures for external API providers.
 */

/**
 * Rate limit configuration for an API provider
 */
export interface ApiRateLimit {
  /** Maximum requests allowed per minute */
  requestsPerMinute: number
  /** Maximum requests allowed per hour */
  requestsPerHour: number
  /** Maximum requests allowed per day (optional) */
  requestsPerDay?: number
}

/**
 * Authentication configuration for an API provider
 */
export interface ApiAuthentication {
  /** Authentication type */
  type: 'apiKey' | 'bearer' | 'basic' | 'oauth2'
  /** Custom header name for API key auth (e.g., 'x-rapidapi-key') */
  headerName?: string
}

/**
 * API category for grouping providers
 */
export enum ApiCategory {
  FLIGHTS = 'flights',
  PLACES = 'places',
  HOTELS = 'hotels',
  CARS = 'cars',
  VISA = 'visa',
  IMAGES = 'images',
}

/**
 * Configuration for an external API provider
 */
export interface ExternalApiConfig {
  /** Unique provider identifier (e.g., 'aerodatabox') */
  provider: string
  /** Category for grouping and fallback chains */
  category: ApiCategory
  /** Base URL for API requests */
  baseUrl: string
  /** Rate limiting configuration */
  rateLimit: ApiRateLimit
  /** Authentication configuration */
  authentication: ApiAuthentication
}

/**
 * HTTP request options for API calls
 */
export interface RequestOptions {
  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  /** Additional headers */
  headers?: Record<string, string>
  /** Request body (for POST/PUT/PATCH) */
  body?: any
  /** Query parameters */
  params?: Record<string, string | number | boolean>
}
