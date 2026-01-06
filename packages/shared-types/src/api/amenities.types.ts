/**
 * Amenities API Types
 *
 * Shared type definitions for the dynamic amenities system.
 */

/**
 * Amenity category for UI grouping
 */
export type AmenityCategory =
  | 'connectivity'
  | 'facilities'
  | 'dining'
  | 'services'
  | 'parking'
  | 'accessibility'
  | 'room_features'
  | 'family'
  | 'pets'
  | 'other'

/**
 * Source of amenity creation
 */
export type AmenitySource =
  | 'google_places'
  | 'booking_com'
  | 'amadeus'
  | 'manual'
  | 'system'

/**
 * Amenity response DTO
 */
export interface AmenityResponseDto {
  id: string
  name: string
  slug: string
  category: AmenityCategory
  icon?: string | null
  description?: string | null
  source: AmenitySource
  createdAt: string
  updatedAt: string
}

/**
 * Create amenity request
 */
export interface CreateAmenityDto {
  name: string
  category?: AmenityCategory
  icon?: string
  description?: string
}

/**
 * Update amenity request
 */
export interface UpdateAmenityDto {
  name?: string
  category?: AmenityCategory
  icon?: string | null
  description?: string | null
}

/**
 * Amenity filter options
 */
export interface AmenityFilterDto {
  search?: string
  category?: AmenityCategory
  source?: AmenitySource
}

/**
 * Activity amenities update request
 */
export interface UpdateActivityAmenitiesDto {
  amenityIds: string[]
}

/**
 * Bulk upsert amenities request (for API providers)
 */
export interface BulkUpsertAmenitiesDto {
  /** Amenity names to upsert (will auto-generate slugs) */
  names: string[]
  /** Source of these amenities */
  source: AmenitySource
}

/**
 * Bulk upsert response
 */
export interface BulkUpsertAmenitiesResponseDto {
  /** All amenities (existing + newly created) matching the input names */
  amenities: AmenityResponseDto[]
  /** How many new amenities were created */
  created: number
}

/**
 * Amenities grouped by category for UI display
 */
export interface AmenitiesByCategory {
  category: AmenityCategory
  label: string
  amenities: AmenityResponseDto[]
}

/**
 * Category labels for display
 */
export const AMENITY_CATEGORY_LABELS: Record<AmenityCategory, string> = {
  connectivity: 'Connectivity',
  facilities: 'Facilities',
  dining: 'Dining',
  services: 'Services',
  parking: 'Parking',
  accessibility: 'Accessibility',
  room_features: 'Room Features',
  family: 'Family',
  pets: 'Pets',
  other: 'Other',
}
