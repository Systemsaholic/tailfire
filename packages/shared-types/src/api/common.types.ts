/**
 * Common API Types
 *
 * Shared types used across multiple API modules.
 * Includes common filters, responses, and utility types.
 */

// ============================================================================
// COMMON RESPONSE TYPES
// ============================================================================

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface PaginationQueryDto {
  page?: number
  limit?: number
}

// ============================================================================
// SORTING TYPES
// ============================================================================

export type SortOrder = 'asc' | 'desc'

export interface SortQueryDto {
  sortBy?: string
  sortOrder?: SortOrder
}

// ============================================================================
// FILTERING TYPES
// ============================================================================

export interface DateRangeFilterDto {
  from?: string // ISO date string
  to?: string // ISO date string
}

export interface SearchQueryDto {
  search?: string
}

export interface BaseFilterDto extends PaginationQueryDto, SortQueryDto, SearchQueryDto {
  // Common filters that might be used across entities
}

// ============================================================================
// COMMON FIELD TYPES
// ============================================================================

export interface AddressDto {
  addressLine1?: string
  addressLine2?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string // ISO 3166-1 alpha-3
}

export interface PassportDto {
  passportNumber?: string
  passportExpiry?: string // ISO date string
  nationality?: string // ISO 3166-1 alpha-3
}

export interface ContactInfoDto {
  email?: string
  phone?: string
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  constraint?: string
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  error: {
    code: 'VALIDATION_ERROR'
    message: string
    details: ValidationError[]
  }
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditFields {
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

// ============================================================================
// BULK OPERATION TYPES
// ============================================================================

export interface BulkOperationResult {
  success: number
  failed: number
  errors?: Array<{
    index: number
    error: string
  }>
}

export interface BulkDeleteDto {
  ids: string[]
}

// ============================================================================
// COMMON ENUMS (Re-exported for convenience)
// ============================================================================

// Contact-related enums
export type ContactRelationshipCategory =
  | 'family'
  | 'business'
  | 'travel_companions'
  | 'group'
  | 'other'
  | 'custom'

export type ContactGroupType =
  | 'family'
  | 'corporate'
  | 'wedding'
  | 'friends'
  | 'custom'

// Trip-related enums
export type TripType =
  | 'leisure'
  | 'business'
  | 'group'
  | 'honeymoon'
  | 'corporate'
  | 'custom'

// NOTE: TripStatus is now exported from trip-status-transitions.ts
// to keep all status workflow logic in one place

export type TravelerType =
  | 'adult'
  | 'child'
  | 'infant'

export type TravelerGroupType =
  | 'room'
  | 'dining'
  | 'activity'
  | 'transfer'
  | 'custom'

export type ItineraryStatus =
  | 'draft'
  | 'proposing'
  | 'approved'
  | 'archived'

// ============================================================================
// ID TYPES
// ============================================================================

export type UUID = string

export interface EntityId {
  id: UUID
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  uptime: number
  services: {
    database?: 'ok' | 'down'
    cache?: 'ok' | 'down'
  }
}
