'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useCallback, useState, useMemo } from 'react'
import { api, ApiError } from '@/lib/api'
import type {
  HotelSearchResponse,
  NormalizedHotelResult,
  HotelPhoto,
} from '@tailfire/shared-types'
import { useToast } from './use-toast'
import { useDebounce } from './use-debounce'

// Query Keys for external hotel search API
export const hotelSearchKeys = {
  all: ['hotel-search'] as const,
  search: (destination?: string, hotelName?: string, provider?: string) =>
    [...hotelSearchKeys.all, 'search', destination ?? '', hotelName ?? '', provider ?? 'default'] as const,
  lookup: (name: string) => [...hotelSearchKeys.all, 'lookup', name] as const,
  details: (id: string, provider?: string) =>
    [...hotelSearchKeys.all, 'details', id, provider ?? 'auto'] as const,
}

// ============================================================================
// HOTEL SEARCH HOOKS
// ============================================================================

/**
 * Hotel lookup for autocomplete/auto-fill functionality
 *
 * Optimized for lodging form property name search with debouncing.
 * Uses Google Places primarily for better name matching.
 *
 * @param name - Hotel name to search (minimum 3 characters)
 * @param options.enabled - Whether the query is enabled
 * @param options.destination - Optional destination to narrow results
 */
export function useHotelLookup(
  name: string,
  options: { enabled?: boolean; destination?: string } = {}
) {
  const { enabled = true, destination } = options
  const debouncedName = useDebounce(name, 300)
  const { toast } = useToast()

  return useQuery({
    queryKey: hotelSearchKeys.lookup(debouncedName),
    queryFn: async (): Promise<HotelSearchResponse> => {
      const params = new URLSearchParams({ name: debouncedName })
      if (destination) {
        params.set('destination', destination)
      }
      try {
        return await api.get<HotelSearchResponse>(
          `/external-apis/hotels/lookup?${params}`
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          const retryAfter = error.metadata?.retryAfter ?? 60
          toast({
            title: 'Rate limit reached',
            description: `Please wait ${retryAfter} seconds before searching again.`,
            variant: 'default',
          })
        }
        throw error
      }
    },
    enabled: enabled && debouncedName.length >= 3,
    staleTime: 10 * 60 * 1000, // Cache for 10 min (hotel info changes slowly)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 min
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        // Don't retry client errors
        if (error.status === 401) return false
        if (error.status === 403) return false
        if (error.status === 404) return false
        if (error.status === 429) return false
      }
      return failureCount < 1
    },
  })
}

/**
 * Hotel search by destination with optional dates
 *
 * Uses provider composition: Google Places for metadata, Amadeus for pricing.
 *
 * @param params.destination - City or location to search
 * @param params.checkIn - Check-in date (YYYY-MM-DD) for pricing
 * @param params.checkOut - Check-out date (YYYY-MM-DD) for pricing
 * @param params.adults - Number of adult guests
 * @param params.provider - Force specific provider ('google_places' | 'amadeus')
 * @param options.enabled - Whether the query is enabled
 */
export function useHotelSearch(
  params: {
    destination?: string
    checkIn?: string
    checkOut?: string
    adults?: number
    cityCode?: string
    provider?: 'google_places' | 'amadeus'
  },
  options: { enabled?: boolean } = {}
) {
  const { enabled = false } = options
  const { toast } = useToast()

  // Memoize the query key to prevent unnecessary refetches
  const queryKey = useMemo(
    () => hotelSearchKeys.search(params.destination, undefined, params.provider),
    [params.destination, params.provider]
  )

  return useQuery({
    queryKey,
    queryFn: async (): Promise<HotelSearchResponse> => {
      const searchParams = new URLSearchParams()
      if (params.destination) searchParams.set('destination', params.destination)
      if (params.checkIn) searchParams.set('checkIn', params.checkIn)
      if (params.checkOut) searchParams.set('checkOut', params.checkOut)
      if (params.adults) searchParams.set('adults', params.adults.toString())
      if (params.cityCode) searchParams.set('cityCode', params.cityCode)
      if (params.provider) searchParams.set('provider', params.provider)

      try {
        return await api.get<HotelSearchResponse>(
          `/external-apis/hotels/search?${searchParams}`
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          const retryAfter = error.metadata?.retryAfter ?? 60
          toast({
            title: 'Rate limit reached',
            description: `Please wait ${retryAfter} seconds before searching again.`,
            variant: 'default',
          })
        }
        throw error
      }
    },
    enabled: enabled && !!params.destination,
    staleTime: 5 * 60 * 1000, // 5 min cache (pricing changes more frequently)
    gcTime: 15 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        if (error.status === 401) return false
        if (error.status === 403) return false
        if (error.status === 404) return false
        if (error.status === 429) return false
      }
      return failureCount < 1
    },
  })
}

/**
 * Get hotel details by ID
 *
 * Supports both Google Places IDs (ChI...) and Amadeus hotel IDs.
 * Provider is auto-detected from ID format if not specified.
 *
 * @param id - Hotel/Place ID
 * @param options.provider - Force specific provider
 * @param options.checkIn - Check-in date for pricing (Amadeus only)
 * @param options.checkOut - Check-out date for pricing (Amadeus only)
 * @param options.enabled - Whether the query is enabled
 */
export function useHotelDetails(
  id: string,
  options: {
    provider?: 'google_places' | 'amadeus'
    checkIn?: string
    checkOut?: string
    adults?: number
    enabled?: boolean
  } = {}
) {
  const { enabled = true, provider, checkIn, checkOut, adults } = options
  const { toast } = useToast()

  return useQuery({
    queryKey: hotelSearchKeys.details(id, provider),
    queryFn: async (): Promise<NormalizedHotelResult> => {
      const params = new URLSearchParams()
      if (provider) params.set('provider', provider)
      if (checkIn) params.set('checkIn', checkIn)
      if (checkOut) params.set('checkOut', checkOut)
      if (adults) params.set('adults', adults.toString())

      const queryString = params.toString()
      try {
        return await api.get<NormalizedHotelResult>(
          `/external-apis/hotels/${id}${queryString ? `?${queryString}` : ''}`
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          const retryAfter = error.metadata?.retryAfter ?? 60
          toast({
            title: 'Rate limit reached',
            description: `Please wait ${retryAfter} seconds before searching again.`,
            variant: 'default',
          })
        }
        throw error
      }
    },
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        if (error.status === 401) return false
        if (error.status === 403) return false
        if (error.status === 404) return false
        if (error.status === 429) return false
      }
      return failureCount < 1
    },
  })
}

// ============================================================================
// DEBOUNCED SEARCH HOOKS
// ============================================================================

/**
 * Debounced hotel lookup with manual trigger
 *
 * Useful for search panels where user types and sees results.
 * Note: Debounce delay is handled internally by useHotelLookup (300ms)
 */
export function useDebouncedHotelLookup(_delayMs = 300) {
  const [searchValue, setSearchValue] = useState('')
  const queryClient = useQueryClient()

  const query = useHotelLookup(searchValue, {
    enabled: searchValue.length >= 3,
  })

  const triggerSearch = useCallback((name: string) => {
    setSearchValue(name)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchValue('')
  }, [])

  const refetchSearch = useCallback(() => {
    if (searchValue.length >= 3) {
      void queryClient.invalidateQueries({
        queryKey: hotelSearchKeys.lookup(searchValue),
      })
    }
  }, [queryClient, searchValue])

  return {
    ...query,
    searchValue,
    triggerSearch,
    clearSearch,
    refetchSearch,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract the first hotel from search results
 */
export function getFirstHotel(response?: HotelSearchResponse): NormalizedHotelResult | null {
  if (!response?.results?.length) return null
  return response.results[0] ?? null
}

/**
 * Error classification for better UI feedback
 */
export type HotelSearchErrorType =
  | 'not_found' // 404 - No hotels found
  | 'rate_limited' // 429 - Need to wait
  | 'auth_error' // 401/403 - API key issue
  | 'server_error' // 5xx - Transient server issue
  | 'unknown' // Other errors

/**
 * Classify a hotel search error for UI handling
 */
export function classifyHotelSearchError(error: unknown): HotelSearchErrorType {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'not_found'
    if (error.status === 429) return 'rate_limited'
    if (error.status === 401 || error.status === 403) return 'auth_error'
    if (error.status >= 500) return 'server_error'
  }
  return 'unknown'
}

/**
 * Check if the response indicates a fallback provider was used
 */
export function usedFallbackProvider(response?: HotelSearchResponse): boolean {
  return response?.usedFallback === true
}

/**
 * Get user-friendly message for hotel search errors
 */
export function getHotelSearchErrorMessage(error: unknown): string {
  const errorType = classifyHotelSearchError(error)

  switch (errorType) {
    case 'not_found':
      return 'No hotels found for this search. Try a different location or name.'
    case 'rate_limited':
      return 'Search limit reached. Please wait a moment before trying again.'
    case 'auth_error':
      return 'Hotel search is temporarily unavailable. Please contact support.'
    case 'server_error':
      return 'Something went wrong. Please try again in a few moments.'
    default:
      return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
}

// ============================================================================
// HOTEL ENRICHMENT HOOKS
// ============================================================================

/**
 * Response from hotel enrichment endpoint (Booking.com amenities)
 */
export interface HotelEnrichmentResponse {
  amenities: string[]
}

/**
 * Enrichment query key factory
 */
export const hotelEnrichmentKeys = {
  all: ['hotel-enrichment'] as const,
  byPlaceId: (placeId: string) => [...hotelEnrichmentKeys.all, placeId] as const,
}

/**
 * Mutation hook for enriching hotel amenities from Booking.com
 *
 * This calls the backend enrichment endpoint which matches the hotel
 * against Booking.com and returns detailed amenities (WiFi, Pool, Spa, etc.)
 * that Google Places doesn't provide.
 *
 * @example
 * const enrichHotel = useHotelEnrichment()
 * const result = await enrichHotel.mutateAsync({
 *   placeId: 'ChIJ...',
 *   hotelName: 'Hilton Miami',
 *   latitude: 25.7617,
 *   longitude: -80.1918,
 *   checkIn: '2024-03-15',
 *   checkOut: '2024-03-17',
 * })
 * // result.amenities = ['WiFi', 'Pool', 'Spa', 'Fitness Center', ...]
 */
export function useHotelEnrichment() {
  return useMutation({
    mutationFn: async (params: {
      placeId: string
      hotelName: string
      latitude: number
      longitude: number
      checkIn?: string
      checkOut?: string
    }): Promise<HotelEnrichmentResponse> => {
      const searchParams = new URLSearchParams({
        name: params.hotelName,
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
      })
      if (params.checkIn) searchParams.set('checkIn', params.checkIn)
      if (params.checkOut) searchParams.set('checkOut', params.checkOut)

      return await api.get<HotelEnrichmentResponse>(
        `/external-apis/hotels/${params.placeId}/enrich?${searchParams}`
      )
    },
    // Enrichment failures are silent - don't block form autofill
    onError: (error) => {
      console.warn('Hotel enrichment failed (non-blocking):', error)
    },
  })
}

/**
 * Merge enriched amenities with existing amenities (deduped)
 *
 * @param existing - Current amenities from Google Places
 * @param enriched - Amenities from Booking.com enrichment
 * @returns Merged and deduplicated amenity list
 */
export function mergeHotelAmenities(
  existing: string[] | undefined,
  enriched: string[] | undefined
): string[] {
  const existingSet = new Set(existing ?? [])
  const enrichedSet = new Set(enriched ?? [])
  return [...new Set([...existingSet, ...enrichedSet])]
}

// ============================================================================
// PHOTO IMPORT HOOKS
// ============================================================================

/**
 * DTO for importing hotel photos from Google Places
 */
export interface ImportHotelPhotosDto {
  activityId: string
  entityType?: 'accommodation' | 'tour' | 'flight' | 'transportation' | 'dining' | 'port_info' | 'options' | 'custom_cruise'
  photos: Array<{
    photoReference: string  // Google Places photo reference (e.g., "places/xxx/photos/yyy")
    attribution?: string
    maxWidthPx?: number
  }>
  hotelName?: string
}

/**
 * Response from photo import endpoint
 */
export interface ImportHotelPhotosResponse {
  imported: number
  failed: number
  media: Array<{
    id: string
    fileUrl: string
    fileName: string
  }>
}

/**
 * Mutation hook for importing Google Places photos to an activity
 *
 * Downloads photos from Google Places API and uploads them to R2 storage.
 * Creates activity media records for each imported photo.
 *
 * @example
 * const importPhotos = useImportHotelPhotos()
 * await importPhotos.mutateAsync({
 *   activityId: 'uuid',
 *   entityType: 'accommodation',
 *   photos: [{ photoReference: 'places/xxx/photos/yyy' }],
 *   hotelName: 'Hotel Name'
 * })
 */
export function useImportHotelPhotos() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: ImportHotelPhotosDto): Promise<ImportHotelPhotosResponse> => {
      return await api.post<ImportHotelPhotosResponse>('/external-apis/hotels/photos/import', dto)
    },
    onSuccess: (data, variables) => {
      // Invalidate activity media queries to refresh the media tab
      queryClient.invalidateQueries({
        queryKey: ['activity-media', variables.activityId],
      })

      if (data.imported > 0) {
        toast({
          title: 'Photos imported',
          description: `Successfully imported ${data.imported} photo${data.imported > 1 ? 's' : ''} from Google Places.`,
        })
      }

      if (data.failed > 0) {
        toast({
          title: 'Some photos failed',
          description: `${data.failed} photo${data.failed > 1 ? 's' : ''} could not be imported.`,
          variant: 'default',
        })
      }
    },
    onError: (error) => {
      toast({
        title: 'Photo import failed',
        description: error instanceof Error ? error.message : 'Failed to import photos from Google Places.',
        variant: 'destructive',
      })
    },
  })
}

// ============================================================================
// SESSION STORAGE HELPERS FOR PHOTO IMPORT
// ============================================================================

const HOTEL_PHOTOS_PREFIX = 'hotel_photos_'

/**
 * Stored hotel photo data in session storage
 */
export interface StoredHotelPhotoData {
  placeId: string
  photos: HotelPhoto[]
  hotelName?: string
}

/**
 * Get stored hotel photos from session storage
 */
export function getStoredHotelPhotos(placeId: string): StoredHotelPhotoData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = sessionStorage.getItem(`${HOTEL_PHOTOS_PREFIX}${placeId}`)
    if (!stored) return null
    return JSON.parse(stored) as StoredHotelPhotoData
  } catch {
    return null
  }
}

/**
 * Clear stored hotel photos from session storage
 */
export function clearStoredHotelPhotos(placeId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(`${HOTEL_PHOTOS_PREFIX}${placeId}`)
}

/**
 * Get all stored hotel photo keys from session storage
 */
export function getAllStoredHotelPhotoKeys(): string[] {
  if (typeof window === 'undefined') return []

  const keys: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key?.startsWith(HOTEL_PHOTOS_PREFIX)) {
      keys.push(key.replace(HOTEL_PHOTOS_PREFIX, ''))
    }
  }
  return keys
}

/**
 * Convert stored HotelPhoto array to import DTO format
 */
export function convertPhotosToImportDto(
  photos: HotelPhoto[]
): ImportHotelPhotosDto['photos'] {
  return photos
    .filter(photo => photo.photoReference)
    .map(photo => ({
      photoReference: photo.photoReference!,
      attribution: photo.attribution,
      maxWidthPx: 800,  // Good balance of quality and file size
    }))
}
