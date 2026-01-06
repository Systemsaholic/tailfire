/**
 * External API Provider Interface
 *
 * Contract that all external API providers must implement.
 */

import { ExternalApiConfig } from './api-config.interface'
import { ExternalApiResponse, ConnectionTestResult } from './api-response.interface'

/**
 * Interface for external API providers
 *
 * @typeParam TSearchParams - Type for search parameters
 * @typeParam TSearchResult - Type for search results
 */
export interface IExternalApiProvider<TSearchParams = any, TSearchResult = any> {
  /**
   * Provider configuration
   */
  readonly config: ExternalApiConfig

  /**
   * Search for items using provider-specific parameters
   *
   * @param params - Search parameters
   * @returns Promise resolving to array of search results
   */
  search(params: TSearchParams): Promise<ExternalApiResponse<TSearchResult[]>>

  /**
   * Get details for a specific item
   *
   * @param referenceId - Provider-specific reference ID
   * @param additionalParams - Optional additional parameters
   * @returns Promise resolving to item details
   */
  getDetails(
    referenceId: string,
    additionalParams?: Record<string, any>
  ): Promise<ExternalApiResponse<TSearchResult>>

  /**
   * Validate search parameters before making request
   *
   * @param params - Parameters to validate
   * @returns Validation result with valid flag and error messages
   */
  validateParams(params: TSearchParams): { valid: boolean; errors: string[] }

  /**
   * Transform raw API response to standardized format
   *
   * @param apiData - Raw data from external API
   * @returns Transformed result in standardized format
   */
  transformResponse(apiData: any): TSearchResult

  /**
   * Test connection to the external API
   *
   * @returns Promise resolving to connection test result
   */
  testConnection(): Promise<ConnectionTestResult>

  /**
   * Set credentials for API authentication
   *
   * @param credentials - Provider-specific credentials
   */
  setCredentials(credentials: Record<string, any>): Promise<void>
}
