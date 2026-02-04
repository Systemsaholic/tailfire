/**
 * Globus Import Provider
 *
 * Fetches tour data from the Globus GetExternalContentApiFile endpoint
 * for each brand (Globus, Cosmos, Monograms).
 *
 * This is the full JSON export (~16MB per brand) used for catalog sync.
 */

import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import {
  GlobusBrand,
  GLOBUS_BRAND_CODES,
  GLOBUS_CURRENCY_MAP,
  GlobusExternalContentResponse,
  GlobusExternalContentTour,
} from '../tour-import.types'
import { parseStringWrappedJson } from '../../globus/utils/xml-parser.util'

@Injectable()
export class GlobusImportProvider {
  private readonly logger = new Logger(GlobusImportProvider.name)
  private readonly baseUrl: string
  private readonly timeout = 120000 // 2 minutes for large file downloads

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl =
      this.configService.get<string>('GLOBUS_API_URL') ||
      'https://webapi.globusandcosmos.com/gvitawapi.asmx'
  }

  /**
   * Fetch all tour data for a specific brand.
   * Uses GetExternalContentApiFile endpoint which returns full tour details
   * including itinerary, hotels, media, and departures with pricing.
   */
  async fetchBrandTours(
    brand: GlobusBrand,
    currency: 'CAD' | 'USD' = 'CAD'
  ): Promise<GlobusExternalContentTour[]> {
    const brandCode = GLOBUS_BRAND_CODES[brand]
    const currentYear = new Date().getFullYear()
    const currentSeason = String(currentYear)

    // Build URL for GetExternalContentApiFile
    // This endpoint returns a JSON file with all tour data for the brand
    const url = `${this.baseUrl}/GetExternalContentApiFile`
    const currencyCode = GLOBUS_CURRENCY_MAP[currency]
    const params = {
      brand: brandCode,
      currency: currencyCode,
      season: currentSeason,
      format: 'json',
    }

    this.logger.log(`Fetching ${brand} tours from ${url}`)
    this.logger.log(`Params: ${JSON.stringify(params)}`)

    try {
      // Use responseType: 'text' because Globus API may return XML-wrapped JSON
      const response = await firstValueFrom(
        this.httpService.get<string>(url, {
          params,
          timeout: this.timeout,
          responseType: 'text',
          headers: {
            Accept: 'application/json',
          },
        })
      )

      // Parse response - handles both plain JSON and XML-wrapped JSON
      const data = parseStringWrappedJson<GlobusExternalContentResponse | GlobusExternalContentTour[]>(
        response.data
      )

      // Handle various response formats from Globus API
      let tours: GlobusExternalContentTour[]
      if (Array.isArray(data)) {
        tours = data
      } else if (data && 'Tours' in data) {
        tours = data.Tours
      } else if (data && 'MediaInfo' in (data as Record<string, unknown>)) {
        // Handle MediaInfo format: { Brand, MediaInfo: [{ Year, TourMediaInfo: [...] }] }
        const mediaInfo = (data as Record<string, unknown>).MediaInfo as Array<{
          Year: number
          TourMediaInfo: GlobusExternalContentTour[]
        }>
        tours = mediaInfo?.flatMap((m) => m.TourMediaInfo || []) || []
        this.logger.log(`Extracted ${tours.length} tours from MediaInfo format`)
      } else {
        this.logger.warn(`Unexpected response format for ${brand}: ${JSON.stringify(Object.keys(data as object))}`)
        tours = []
      }

      this.logger.log(`Fetched ${tours.length} tours for ${brand}`)
      return tours
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to fetch ${brand} tours: ${message}`)
      throw new Error(`Failed to fetch ${brand} tours: ${message}`)
    }
  }

  /**
   * Fetch tours for multiple brands.
   */
  async fetchAllBrandTours(
    brands: GlobusBrand[],
    currency: 'CAD' | 'USD' = 'CAD'
  ): Promise<Map<GlobusBrand, GlobusExternalContentTour[]>> {
    const results = new Map<GlobusBrand, GlobusExternalContentTour[]>()

    for (const brand of brands) {
      try {
        const tours = await this.fetchBrandTours(brand, currency)
        results.set(brand, tours)
      } catch (error) {
        this.logger.error(`Failed to fetch ${brand} tours: ${error}`)
        results.set(brand, [])
      }
    }

    return results
  }
}
