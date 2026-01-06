/**
 * Media Types
 *
 * Shared types for component media including Unsplash attribution.
 */

/**
 * Unsplash Attribution Data
 *
 * Required by Unsplash API guidelines: https://unsplash.com/documentation#guidelines--crediting
 * - Always credit the photographer
 * - Link to their Unsplash profile
 * - Track downloads using the download_location endpoint
 */
export interface UnsplashAttribution {
  /** Source identifier */
  source: 'unsplash'
  /** Unsplash photo ID */
  photoId: string
  /** Photographer's display name */
  photographerName: string
  /** Photographer's username (without @) */
  photographerUsername: string
  /** Full URL to photographer's Unsplash profile */
  photographerUrl: string
  /** Direct URL to photo on Unsplash (for attribution link) */
  sourceUrl: string
  /** Download location URL (for triggering download tracking) */
  downloadLocation: string
}

/**
 * Generic media attribution - supports multiple sources
 */
export type MediaAttribution = UnsplashAttribution // | OtherSourceAttribution in future

/**
 * Activity Media DTO (canonical type)
 * Prefer this over ComponentMediaDto in new code.
 */
export interface ActivityMediaDto {
  id: string
  /** Activity ID. Corresponds to itinerary_activities.id */
  activityId: string
  /** @deprecated Use activityId instead. Maps to same DB column (component_id). */
  componentId?: string
  mediaType: 'image' | 'video' | 'document'
  fileUrl: string
  fileName: string
  fileSize: number | null
  caption: string | null
  orderIndex: number
  uploadedAt: string
  uploadedBy: string | null
  /** Attribution data for external sources (Unsplash, etc.) */
  attribution: MediaAttribution | null
}

/**
 * Component Media DTO
 * @deprecated Use ActivityMediaDto instead. The "component" terminology is being
 * phased out in favor of "activity" for consistency across the codebase.
 */
export interface ComponentMediaDto {
  id: string
  componentId: string
  /** Activity ID alias for componentId. Prefer this in new code. */
  activityId?: string
  mediaType: 'image' | 'video' | 'document'
  fileUrl: string
  fileName: string
  fileSize: number | null
  caption: string | null
  orderIndex: number
  uploadedAt: string
  uploadedBy: string | null
  /** Attribution data for external sources (Unsplash, etc.) */
  attribution: MediaAttribution | null
}

/**
 * Unsplash Photo (from Unsplash API)
 * Simplified type for frontend use
 */
export interface UnsplashPhoto {
  id: string
  description: string | null
  altDescription: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    username: string
    links: {
      html: string
    }
  }
  links: {
    html: string
    download_location: string
  }
  width: number
  height: number
}

/**
 * Unsplash Search Response
 */
export interface UnsplashSearchResponse {
  total: number
  totalPages: number
  results: UnsplashPhoto[]
}

/**
 * Request to add external (Unsplash) media to a component
 */
export interface AddExternalMediaRequest {
  /** Unsplash photo ID */
  unsplashPhotoId: string
  /** Download location URL (from photo.links.download_location) */
  downloadLocation: string
  /** Optional caption */
  caption?: string
}

// ============================================================================
// TRIP MEDIA TYPES
// ============================================================================

/**
 * Trip Media DTO (matches API response)
 */
export interface TripMediaResponseDto {
  id: string
  tripId: string
  mediaType: 'image' | 'video' | 'document'
  fileUrl: string
  fileName: string
  fileSize: number | null
  caption: string | null
  isCoverPhoto: boolean
  orderIndex: number
  uploadedAt: string
  uploadedBy: string | null
  /** Attribution data for external sources (Unsplash, etc.) */
  attribution: MediaAttribution | null
}

/**
 * Create Trip Media Request
 */
export interface CreateTripMediaDto {
  mediaType: 'image' | 'video' | 'document'
  fileUrl: string
  fileName: string
  fileSize?: number
  caption?: string
  isCoverPhoto?: boolean
  orderIndex?: number
}

/**
 * Update Trip Media Request
 */
export interface UpdateTripMediaDto {
  caption?: string
  orderIndex?: number
}

/**
 * Request to add external (Unsplash) media to a trip
 */
export interface AddExternalTripMediaRequest {
  /** Unsplash photo ID */
  unsplashPhotoId: string
  /** Download location URL (from photo.links.download_location) */
  downloadLocation: string
  /** Optional caption */
  caption?: string
  /** Set as cover photo */
  isCoverPhoto?: boolean
}

/**
 * Trip Media Filter Options
 */
export interface TripMediaFilterDto {
  tripId?: string
  mediaType?: 'image' | 'video' | 'document'
  isCoverPhoto?: boolean
}

// ============================================================================
// BATCH IMPORT TYPES
// ============================================================================

/**
 * Single image in a batch import request
 */
export interface BatchExternalImageDto {
  /** External URL of the image (max 2048 chars) */
  url: string
  /** Optional caption for the image */
  caption?: string
  /** Optional attribution data */
  attribution?: {
    source: string
    sourceUrl?: string
    photographerName?: string
  }
}

/**
 * Request body for batch external URL import
 * POST /activities/:activityId/media/external/batch
 *
 * Constraints:
 * - Maximum 10 images per batch
 * - Each URL max 2048 characters
 * - Images fetched with 10s timeout each
 * - Max 5MB per image
 */
export interface BatchImportExternalUrlDto {
  /** Array of images to import (max 10) */
  images: BatchExternalImageDto[]
}

/**
 * Result for a single successfully imported image
 */
export interface BatchImportSuccessResult {
  /** The media record that was created */
  media: ActivityMediaDto
  /** The original URL that was imported */
  url: string
}

/**
 * Result for a single failed image import
 */
export interface BatchImportFailedResult {
  /** The URL that failed to import */
  url: string
  /** Error message describing the failure */
  error: string
}

/**
 * Response from batch external URL import
 *
 * HTTP Status Codes:
 * - 200 OK: All images imported successfully
 * - 207 Multi-Status: Partial success (some images failed)
 * - 400 Bad Request: Invalid request (too many images, invalid URLs)
 */
export interface BatchImportExternalUrlResponseDto {
  /** Successfully imported images */
  successful: BatchImportSuccessResult[]
  /** Failed image imports with error messages */
  failed: BatchImportFailedResult[]
  /** Number of images skipped (already exist or duplicates in batch) */
  skipped: number
}
