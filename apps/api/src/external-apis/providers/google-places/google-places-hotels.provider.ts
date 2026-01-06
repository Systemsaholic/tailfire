/**
 * Google Places Hotels Provider
 *
 * External API provider for hotel search using Google Places API (New).
 * Provides hotel metadata, photos, reviews, and contact information.
 *
 * Features:
 * - Text Search for hotels by name or destination
 * - Place Details for full hotel information
 * - Tight field masks to minimize API costs
 * - Photo URL generation with caching considerations
 *
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 * @see https://developers.google.com/maps/documentation/places/web-service/place-details
 */

import { Injectable, OnModuleInit } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { BaseExternalApi } from '../../core/base/base-external-api'
import { RateLimiterService } from '../../core/services/rate-limiter.service'
import { MetricsService } from '../../core/services/metrics.service'
import { ExternalApiRegistryService } from '../../core/services/external-api-registry.service'
import {
  ExternalApiConfig,
  ExternalApiResponse,
  ConnectionTestResult,
  ApiCategory,
} from '../../core/interfaces'
import {
  HotelSearchParams,
  NormalizedHotelResult,
  HotelPhoto,
  HotelReview,
  HotelLocation,
} from '@tailfire/shared-types'
import {
  GooglePlacesSearchResponse,
  GooglePlace,
  GooglePlacesTextSearchRequest,
  GOOGLE_PLACES_FIELD_MASKS,
} from './google-places.types'

/**
 * Build provider configuration
 */
function buildGooglePlacesConfig(): ExternalApiConfig {
  return {
    provider: 'google_places',
    category: ApiCategory.HOTELS,
    baseUrl: 'https://places.googleapis.com/v1',
    rateLimit: {
      requestsPerMinute: parseInt(process.env.GOOGLE_PLACES_RATE_LIMIT_PER_MINUTE || '100', 10),
      requestsPerHour: parseInt(process.env.GOOGLE_PLACES_RATE_LIMIT_PER_HOUR || '1000', 10),
    },
    authentication: {
      type: 'apiKey',
      headerName: 'X-Goog-Api-Key',
    },
  }
}

/**
 * Priority for fallback ordering (1 = primary for hotels)
 */
const PROVIDER_PRIORITY = 1

@Injectable()
export class GooglePlacesHotelsProvider
  extends BaseExternalApi<HotelSearchParams, NormalizedHotelResult>
  implements OnModuleInit
{
  constructor(
    httpService: HttpService,
    rateLimiter: RateLimiterService,
    metrics: MetricsService,
    private readonly registry: ExternalApiRegistryService
  ) {
    super(buildGooglePlacesConfig(), httpService, rateLimiter, metrics)
  }

  /**
   * Register with the API registry on module initialization
   */
  async onModuleInit(): Promise<void> {
    await this.registry.registerProvider(this, PROVIDER_PRIORITY)
  }

  // ============================================================================
  // IExternalApiProvider IMPLEMENTATION
  // ============================================================================

  /**
   * Search for hotels by destination or name
   */
  async search(
    params: HotelSearchParams
  ): Promise<ExternalApiResponse<NormalizedHotelResult[]>> {
    const validation = this.validateParams(params)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
        },
      }
    }

    // Build text query
    let textQuery: string
    if (params.hotelName) {
      // Lookup by name - more specific
      textQuery = params.hotelName
      if (params.destination) {
        textQuery += ` in ${params.destination}`
      }
    } else if (params.destination) {
      // Search by destination
      textQuery = `hotels in ${params.destination}`
    } else {
      return {
        success: false,
        error: 'Either hotelName or destination is required',
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
        },
      }
    }

    // Build request body
    const requestBody: GooglePlacesTextSearchRequest = {
      textQuery,
      includedType: 'lodging',
      languageCode: 'en',
      maxResultCount: params.hotelName ? 5 : 10, // Fewer for lookup, more for search
    }

    // Add location bias if coordinates provided
    if (params.latitude !== undefined && params.longitude !== undefined) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: params.latitude,
            longitude: params.longitude,
          },
          radius: params.radius || 5000, // Default 5km
        },
      }
    }

    // Make request with field mask
    const response = await this.makeTextSearchRequest(requestBody)

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'No results returned',
        metadata: response.metadata,
      }
    }

    // Transform places to normalized results
    const places = response.data.places || []
    if (places.length === 0) {
      return {
        success: true,
        data: [],
        metadata: response.metadata,
      }
    }

    const normalizedResults = places.map(place => this.transformResponse(place))

    return {
      success: true,
      data: normalizedResults,
      metadata: response.metadata,
    }
  }

  /**
   * Get full details for a specific place
   */
  async getDetails(
    placeId: string,
    _additionalParams?: Record<string, any>
  ): Promise<ExternalApiResponse<NormalizedHotelResult>> {
    if (!placeId) {
      return {
        success: false,
        error: 'Place ID is required',
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
        },
      }
    }

    // Get place details with full field mask
    const endpoint = `${this.config.baseUrl}/places/${placeId}`
    const response = await this.makePlaceDetailsRequest(endpoint)

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Place not found',
        metadata: response.metadata,
      }
    }

    const normalized = this.transformResponse(response.data)

    return {
      success: true,
      data: normalized,
      metadata: response.metadata,
    }
  }

  /**
   * Validate search parameters
   */
  validateParams(params: HotelSearchParams): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!params.destination && !params.hotelName) {
      if (params.latitude === undefined || params.longitude === undefined) {
        errors.push('Either destination, hotelName, or coordinates are required')
      }
    }

    // Validate date formats if provided
    if (params.checkIn) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(params.checkIn)) {
        errors.push('Check-in date must be in YYYY-MM-DD format')
      }
    }
    if (params.checkOut) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(params.checkOut)) {
        errors.push('Check-out date must be in YYYY-MM-DD format')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Transform Google Place to NormalizedHotelResult
   */
  transformResponse(apiData: GooglePlace): NormalizedHotelResult {
    // Extract place ID from resource name
    const placeId = apiData.id || apiData.name?.replace('places/', '') || ''

    // Parse address components
    const location = this.parseLocation(apiData)

    // Transform photos
    const photos = this.transformPhotos(apiData.photos)

    // Transform reviews
    const reviews = this.transformReviews(apiData.reviews)

    // Extract amenities from boolean fields
    const amenities = this.extractAmenities(apiData)

    return {
      id: placeId,
      placeId,
      name: apiData.displayName?.text || 'Unknown Hotel',
      description: apiData.editorialSummary?.text,
      location,
      phone: apiData.internationalPhoneNumber || apiData.nationalPhoneNumber,
      website: apiData.websiteUri,
      rating: apiData.rating,
      reviewCount: apiData.userRatingCount,
      photos,
      reviews,
      amenities: amenities.length > 0 ? amenities : undefined,
      provider: 'google_places',
      providers: ['google_places'],
    }
  }

  /**
   * Extract amenities from Google Places boolean fields
   * Maps to common amenity names used in the lodging form
   */
  private extractAmenities(place: GooglePlace): string[] {
    const amenities: string[] = []

    // Valid Google Places API (New) amenity fields
    // Note: Fields like hasFreeWifi, hasPool, hasSpa, hasGym don't exist in the API
    if (place.servesBreakfast) amenities.push('Breakfast')
    if (place.servesBrunch) amenities.push('Brunch')
    if (place.servesLunch) amenities.push('Lunch')
    if (place.servesDinner) amenities.push('Dinner')
    if (place.allowsDogs) amenities.push('Pet Friendly')
    if (place.goodForChildren) amenities.push('Family Friendly')
    if (place.outdoorSeating) amenities.push('Outdoor Seating')

    // Check parking options (valid in Google Places API)
    if (place.parkingOptions?.freeParkingLot || place.parkingOptions?.freeStreetParking || place.parkingOptions?.freeGarageParking) {
      amenities.push('Free Parking')
    } else if (place.parkingOptions?.paidParkingLot || place.parkingOptions?.paidStreetParking || place.parkingOptions?.paidGarageParking) {
      amenities.push('Paid Parking')
    }
    if (place.parkingOptions?.valetParking) {
      amenities.push('Valet Parking')
    }

    // Check accessibility (valid in Google Places API)
    if (place.accessibilityOptions?.wheelchairAccessibleEntrance) {
      amenities.push('Wheelchair Accessible')
    }

    // Check payment options (valid in Google Places API)
    if (place.paymentOptions?.acceptsCreditCards || place.paymentOptions?.acceptsDebitCards) {
      amenities.push('Credit Cards Accepted')
    }

    return amenities
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Make Text Search API request
   */
  private async makeTextSearchRequest(
    body: GooglePlacesTextSearchRequest
  ): Promise<ExternalApiResponse<GooglePlacesSearchResponse>> {
    if (!this.credentials) {
      return {
        success: false,
        error: 'No credentials configured for Google Places',
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
        },
      }
    }

    const endpoint = `${this.config.baseUrl}/places:searchText`
    const requestId = `google_places_${Date.now()}`
    const startTime = Date.now()

    this.logger.log(`Google Places Text Search: ${body.textQuery}`, { requestId })

    // Check rate limit and circuit breaker
    if (!this.canMakeRequest()) {
      const error = this.getCircuitBreakerState() === 'open'
        ? 'Service temporarily unavailable (circuit open)'
        : 'Rate limit exceeded'

      return {
        success: false,
        error,
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
          requestId,
        },
      }
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<GooglePlacesSearchResponse>(endpoint, body, {
          headers: {
            'X-Goog-Api-Key': this.credentials.apiKey,
            'X-Goog-FieldMask': GOOGLE_PLACES_FIELD_MASKS.HOTEL_SEARCH,
            'Content-Type': 'application/json',
          },
          timeout: this.resilience.timeoutMs,
        })
      )

      const latencyMs = Date.now() - startTime
      this.logger.log(`Google Places response`, {
        requestId,
        latencyMs,
        resultCount: response.data?.places?.length || 0,
      })

      return {
        success: true,
        data: response.data,
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
          requestId,
        },
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime

      this.logger.error('Google Places API error', {
        requestId,
        latencyMs,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })

      // Extract error message from Google Places error response
      const errorDetail = error.response?.data?.error?.message
      const errorMessage = errorDetail || error.message

      return {
        success: false,
        error: errorMessage,
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
          requestId,
        },
      }
    }
  }

  /**
   * Make Place Details API request
   */
  private async makePlaceDetailsRequest(
    endpoint: string
  ): Promise<ExternalApiResponse<GooglePlace>> {
    if (!this.credentials) {
      return {
        success: false,
        error: 'No credentials configured for Google Places',
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
        },
      }
    }

    const requestId = `google_places_detail_${Date.now()}`
    const startTime = Date.now()

    this.logger.log(`Google Places Details: ${endpoint}`, { requestId })

    // Check rate limit and circuit breaker
    if (!this.canMakeRequest()) {
      const error = this.getCircuitBreakerState() === 'open'
        ? 'Service temporarily unavailable (circuit open)'
        : 'Rate limit exceeded'

      return {
        success: false,
        error,
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
          requestId,
        },
      }
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<GooglePlace>(endpoint, {
          headers: {
            'X-Goog-Api-Key': this.credentials.apiKey,
            'X-Goog-FieldMask': GOOGLE_PLACES_FIELD_MASKS.HOTEL_DETAILS,
          },
          timeout: this.resilience.timeoutMs,
        })
      )

      const latencyMs = Date.now() - startTime
      this.logger.log(`Google Places Details response`, {
        requestId,
        latencyMs,
        hasPhotos: !!response.data?.photos?.length,
        hasReviews: !!response.data?.reviews?.length,
      })

      return {
        success: true,
        data: response.data,
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
          requestId,
        },
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime

      this.logger.error('Google Places Details API error', {
        requestId,
        latencyMs,
        error: error.message,
        status: error.response?.status,
      })

      const errorDetail = error.response?.data?.error?.message
      const errorMessage = errorDetail || error.message

      return {
        success: false,
        error: errorMessage,
        metadata: {
          provider: this.config.provider,
          timestamp: new Date().toISOString(),
          requestId,
        },
      }
    }
  }

  /**
   * Parse location from Google Place
   */
  private parseLocation(place: GooglePlace): HotelLocation {
    const location: HotelLocation = {
      address: place.formattedAddress || place.shortFormattedAddress || '',
    }

    if (place.location) {
      location.latitude = place.location.latitude
      location.longitude = place.location.longitude
    }

    // Parse address components if available
    if (place.addressComponents) {
      for (const component of place.addressComponents) {
        if (component.types.includes('locality')) {
          location.city = component.longText
        }
        if (component.types.includes('country')) {
          location.country = component.longText
        }
        if (component.types.includes('postal_code')) {
          location.postalCode = component.longText
        }
      }
    }

    return location
  }

  /**
   * Transform photos with URLs
   */
  private transformPhotos(photos?: GooglePlace['photos']): HotelPhoto[] | undefined {
    if (!photos || photos.length === 0) return undefined

    return photos.slice(0, 5).map(photo => {
      // Build photo URL
      // Note: Photos require API key in URL which is handled client-side or via proxy
      const photoUrl = this.getPhotoUrl(photo.name, 800)
      const thumbnailUrl = this.getPhotoUrl(photo.name, 200)

      return {
        url: photoUrl,
        thumbnailUrl,
        width: photo.widthPx,
        height: photo.heightPx,
        attribution: photo.authorAttributions?.[0]?.displayName,
        // Store the photo reference for server-side import
        photoReference: photo.name,
      }
    })
  }

  /**
   * Transform reviews
   */
  private transformReviews(reviews?: GooglePlace['reviews']): HotelReview[] | undefined {
    if (!reviews || reviews.length === 0) return undefined

    return reviews.slice(0, 5).map(review => ({
      author: review.authorAttribution?.displayName || 'Anonymous',
      rating: review.rating,
      text: review.text?.text || review.originalText?.text,
      time: review.publishTime || review.relativePublishTimeDescription,
    }))
  }

  /**
   * Generate photo URL with specified dimensions
   *
   * Note: The actual photo fetch requires authentication.
   * Returns a URL pattern that should be proxied through our API.
   */
  getPhotoUrl(photoReference: string, maxWidthPx: number = 400): string {
    // photoReference is in format "places/{place_id}/photos/{photo_ref}"
    // Return a pattern that our photo proxy endpoint can handle
    return `${this.config.baseUrl}/${photoReference}/media?maxWidthPx=${maxWidthPx}`
  }

  /**
   * Test connection to Google Places API
   */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.credentials) {
      return { success: false, message: 'No credentials configured' }
    }

    try {
      // Make a simple text search to verify API key works
      const response = await this.makeTextSearchRequest({
        textQuery: 'hotel',
        maxResultCount: 1,
      })

      if (response.success) {
        return {
          success: true,
          message: `API key valid - returned ${response.data?.places?.length || 0} results`,
        }
      } else {
        return {
          success: false,
          message: response.error || 'API request failed',
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection test failed',
      }
    }
  }

  /**
   * Override canMakeRequest to add proper access check
   */
  protected canMakeRequest(): boolean {
    return super['canMakeRequest']?.() ?? true
  }
}
