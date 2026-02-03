/**
 * Geocoding Service
 *
 * Provides geocoding functionality with caching.
 * Primary provider: Google Geocoding API
 * Caches results to avoid repeated API calls for the same cities.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { eq } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import { geocodingCache } from '@tailfire/database'
import {
  GeocodingResult,
  GoogleGeocodingResponse,
  GoogleGeocodingResult,
} from './geocoding.types'

@Injectable()
export class GeocodingService implements OnModuleInit {
  private readonly logger = new Logger(GeocodingService.name)
  private readonly googleApiKey: string | undefined
  private readonly googleApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json'

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY')
  }

  async onModuleInit() {
    if (!this.googleApiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not configured - geocoding will not work')
    } else {
      this.logger.log('Geocoding service initialized with Google Maps API')
    }
  }

  /**
   * Geocode a city name to coordinates.
   * Checks cache first, falls back to Google API.
   */
  async geocode(cityName: string): Promise<GeocodingResult | null> {
    if (!cityName || cityName.trim().length === 0) {
      return null
    }

    const locationKey = this.normalizeLocationKey(cityName)

    // Check cache first
    const cached = await this.getFromCache(locationKey)
    if (cached) {
      return cached
    }

    // Fetch from Google API
    const result = await this.fetchFromGoogle(cityName)
    if (result) {
      // Cache the result
      await this.saveToCache(locationKey, result, cityName)
      return result
    }

    return null
  }

  /**
   * Batch geocode multiple city names.
   * Optimized to check cache first for all cities.
   */
  async geocodeBatch(cityNames: string[]): Promise<Map<string, GeocodingResult | null>> {
    const results = new Map<string, GeocodingResult | null>()
    const toFetch: string[] = []

    // Check cache for all cities first
    for (const city of cityNames) {
      if (!city || city.trim().length === 0) {
        results.set(city, null)
        continue
      }

      const locationKey = this.normalizeLocationKey(city)
      const cached = await this.getFromCache(locationKey)
      if (cached) {
        results.set(city, cached)
      } else {
        toFetch.push(city)
      }
    }

    // Fetch remaining from Google API (with rate limiting)
    for (const city of toFetch) {
      const result = await this.geocode(city)
      results.set(city, result)

      // Small delay between API calls to avoid rate limiting
      if (toFetch.indexOf(city) < toFetch.length - 1) {
        await this.delay(100) // 100ms between calls
      }
    }

    return results
  }

  /**
   * Get cached geocoding result.
   */
  private async getFromCache(locationKey: string): Promise<GeocodingResult | null> {
    try {
      const rows = await this.db.db
        .select()
        .from(geocodingCache)
        .where(eq(geocodingCache.locationKey, locationKey))
        .limit(1)

      if (rows.length === 0 || !rows[0]?.latitude || !rows[0]?.longitude) {
        return null
      }

      const row = rows[0]!
      return {
        latitude: parseFloat(row.latitude!),
        longitude: parseFloat(row.longitude!),
        displayName: row.displayName || locationKey,
        country: row.country || undefined,
        countryCode: row.countryCode || undefined,
        region: row.region || undefined,
        provider: 'cache',
      }
    } catch (error) {
      this.logger.warn(`Failed to check geocoding cache: ${error}`)
      return null
    }
  }

  /**
   * Save geocoding result to cache.
   */
  private async saveToCache(
    locationKey: string,
    result: GeocodingResult,
    originalQuery: string
  ): Promise<void> {
    try {
      await this.db.db
        .insert(geocodingCache)
        .values({
          locationKey,
          displayName: result.displayName || originalQuery,
          latitude: String(result.latitude),
          longitude: String(result.longitude),
          country: result.country,
          countryCode: result.countryCode,
          region: result.region,
          provider: result.provider === 'cache' ? 'cache' : 'google',
          rawResponse: null, // Don't store raw response for now
        })
        .onConflictDoUpdate({
          target: geocodingCache.locationKey,
          set: {
            displayName: result.displayName || originalQuery,
            latitude: String(result.latitude),
            longitude: String(result.longitude),
            country: result.country,
            countryCode: result.countryCode,
            region: result.region,
            updatedAt: new Date(),
          },
        })
    } catch (error) {
      this.logger.warn(`Failed to save geocoding result to cache: ${error}`)
    }
  }

  /**
   * Fetch geocoding result from Google Maps API.
   */
  private async fetchFromGoogle(query: string): Promise<GeocodingResult | null> {
    if (!this.googleApiKey) {
      this.logger.warn('Google Maps API key not configured, cannot geocode')
      return null
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<GoogleGeocodingResponse>(this.googleApiUrl, {
          params: {
            address: query,
            key: this.googleApiKey,
          },
          timeout: 10000,
        })
      )

      const data = response.data
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        if (data.status === 'ZERO_RESULTS') {
          this.logger.debug(`No geocoding results for: ${query}`)
        } else if (data.status !== 'OK') {
          this.logger.warn(`Google Geocoding API error: ${data.status} - ${data.error_message}`)
        }
        return null
      }

      const result = data.results[0]!
      return this.parseGoogleResult(result)
    } catch (error) {
      this.logger.warn(`Failed to fetch from Google Geocoding API: ${error}`)
      return null
    }
  }

  /**
   * Parse Google Geocoding API result.
   */
  private parseGoogleResult(result: GoogleGeocodingResult): GeocodingResult {
    const { geometry, formatted_address, address_components } = result

    // Extract country and region from address components
    let country: string | undefined
    let countryCode: string | undefined
    let region: string | undefined

    for (const component of address_components) {
      if (component.types.includes('country')) {
        country = component.long_name
        countryCode = component.short_name
      }
      if (
        component.types.includes('administrative_area_level_1') ||
        component.types.includes('state') ||
        component.types.includes('province')
      ) {
        region = component.long_name
      }
    }

    return {
      latitude: geometry.location.lat,
      longitude: geometry.location.lng,
      displayName: formatted_address,
      country,
      countryCode,
      region,
      provider: 'google',
    }
  }

  /**
   * Normalize location key for cache lookup.
   * Lowercase, trimmed, removes extra spaces.
   */
  private normalizeLocationKey(cityName: string): string {
    return cityName.toLowerCase().trim().replace(/\s+/g, ' ')
  }

  /**
   * Simple delay helper.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
