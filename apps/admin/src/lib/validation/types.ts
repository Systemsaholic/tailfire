/**
 * Shared validation types for form error handling
 */

/**
 * Server-side field error structure
 * Supports flat field names (e.g., 'name') and dotted paths (e.g., 'lodgingDetails.checkInDate')
 */
export interface ServerFieldError {
  field: string
  message: string
}

/**
 * API validation error response shape
 */
export interface ApiValidationError {
  fieldErrors?: ServerFieldError[]
  message?: string
}
