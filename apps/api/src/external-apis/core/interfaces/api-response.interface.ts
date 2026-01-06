/**
 * API Response Interfaces
 *
 * Standardized response structure for all external API calls.
 */

/**
 * Response metadata from an external API call
 */
export interface ExternalApiMetadata {
  /** Provider that handled the request */
  provider: string
  /** ISO timestamp of the request */
  timestamp: string
  /** Remaining requests in rate limit window */
  rateLimitRemaining?: number
  /** Seconds until rate limit resets (present on 429 responses) */
  retryAfter?: number
  /** Whether the response was served from cache */
  cached?: boolean
  /** Unique request identifier for tracing */
  requestId?: string
}

/**
 * Standardized response from any external API call
 */
export interface ExternalApiResponse<T> {
  /** Whether the request was successful */
  success: boolean
  /** Response data (on success) */
  data?: T
  /** Error message (on failure) */
  error?: string
  /** Request metadata */
  metadata?: ExternalApiMetadata
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Whether the connection test passed */
  success: boolean
  /** Human-readable status message */
  message: string
  /** Response time in milliseconds (optional) */
  latencyMs?: number
}
