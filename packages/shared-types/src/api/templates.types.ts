/**
 * Template API Types
 *
 * Types for itinerary and package template API contracts.
 */

import type {
  ItineraryTemplatePayload,
  PackageTemplatePayload,
  TemplateActivity,
  CreateItineraryTemplateDto,
  UpdateItineraryTemplateDto,
  CreatePackageTemplateDto,
  UpdatePackageTemplateDto,
  ApplyItineraryTemplateDto,
  ApplyPackageTemplateDto,
  SaveItineraryAsTemplateDto,
  SavePackageAsTemplateDto,
} from '../schemas/index.js'

// =============================================================================
// Itinerary Template Types
// =============================================================================

/**
 * Itinerary template response (from GET endpoints)
 */
export interface ItineraryTemplateResponse {
  id: string
  agencyId: string
  name: string
  description: string | null
  payload: ItineraryTemplatePayload
  isActive: boolean
  createdBy: string | null
  createdAt: string // ISO date
  updatedAt: string // ISO date
  // Computed fields
  dayCount?: number
  activityCount?: number
}

/**
 * Itinerary template list response
 */
export interface ItineraryTemplateListResponse {
  data: ItineraryTemplateResponse[]
  total: number
}

/**
 * Apply itinerary template response
 */
export interface ApplyItineraryTemplateResponse {
  itineraryId: string
  message: string
}

// =============================================================================
// Package Template Types
// =============================================================================

/**
 * Package template response (from GET endpoints)
 */
export interface PackageTemplateResponse {
  id: string
  agencyId: string
  name: string
  description: string | null
  payload: PackageTemplatePayload
  isActive: boolean
  createdBy: string | null
  createdAt: string // ISO date
  updatedAt: string // ISO date
  // Computed fields
  dayCount?: number
  activityCount?: number
}

/**
 * Package template list response
 */
export interface PackageTemplateListResponse {
  data: PackageTemplateResponse[]
  total: number
}

/**
 * Apply package template response
 */
export interface ApplyPackageTemplateResponse {
  packageId: string
  message: string
}

// =============================================================================
// Query Types
// =============================================================================

/**
 * Template list query parameters
 */
export interface TemplateListQuery {
  agencyId: string
  search?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
  ItineraryTemplatePayload,
  PackageTemplatePayload,
  TemplateActivity,
  CreateItineraryTemplateDto,
  UpdateItineraryTemplateDto,
  CreatePackageTemplateDto,
  UpdatePackageTemplateDto,
  ApplyItineraryTemplateDto,
  ApplyPackageTemplateDto,
  SaveItineraryAsTemplateDto,
  SavePackageAsTemplateDto,
}
