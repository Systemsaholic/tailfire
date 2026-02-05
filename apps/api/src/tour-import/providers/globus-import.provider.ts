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
  GlobusTourMediaResponse,
  GlobusTourMediaContent,
  GlobusTourMediaInfo,
  GlobusDayMediaContent,
  GlobusTourKeyword,
  GlobusHotelMedia,
} from '../tour-import.types'
import { parseStringWrappedJson, parseTourMediaDataSet, parseHotelMediaArray } from '../../globus/utils/xml-parser.util'

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
        // MediaInfo tours have different structure - need to transform
        const mediaInfo = (data as Record<string, unknown>).MediaInfo as Array<{
          Year: number
          TourMediaInfo: Array<{
            TourCode: string
            DeparturesWithPricing: Array<{
              Departure: {
                Name: string
                LandStartDate: string
                LandEndDate: string
                DepartureCode: string
                Status?: string
                GuaranteedDeparture?: boolean
                ShipName?: string
                TourStartAirportCity?: string
                TourEndAirportCity?: string
              }
              Pricing: Array<{
                Price: number
                Discount?: number
                CabinCategory?: string
              }>
            }>
          }>
        }>

        // Transform MediaInfo format to expected format
        tours = mediaInfo?.flatMap((yearInfo) =>
          (yearInfo.TourMediaInfo || []).map((tour) => {
            const firstDeparture = tour.DeparturesWithPricing?.[0]?.Departure
            const landStart = firstDeparture?.LandStartDate ? new Date(firstDeparture.LandStartDate) : null
            const landEnd = firstDeparture?.LandEndDate ? new Date(firstDeparture.LandEndDate) : null
            const days = landStart && landEnd ? Math.ceil((landEnd.getTime() - landStart.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0

            return {
              TourNumber: tour.TourCode,
              TourCode: tour.TourCode,
              TourName: firstDeparture?.Name || `Tour ${tour.TourCode}`,
              Season: String(yearInfo.Year),
              Days: days,
              Nights: Math.max(0, days - 1),
              StartCity: firstDeparture?.TourStartAirportCity,
              EndCity: firstDeparture?.TourEndAirportCity,
              Departures: tour.DeparturesWithPricing?.map((dp) => ({
                DepartureCode: dp.Departure.DepartureCode,
                Season: String(yearInfo.Year),
                LandStartDate: dp.Departure.LandStartDate,
                LandEndDate: dp.Departure.LandEndDate,
                Status: dp.Departure.Status,
                GuaranteedDeparture: dp.Departure.GuaranteedDeparture,
                ShipName: dp.Departure.ShipName?.trim() || undefined,
                StartCity: dp.Departure.TourStartAirportCity,
                EndCity: dp.Departure.TourEndAirportCity,
                CabinPricing: dp.Pricing?.map((p) => ({
                  CabinCategory: p.CabinCategory || undefined,
                  Price: p.Price,
                  Discount: p.Discount,
                  Currency: currency,
                })),
              })),
            } as GlobusExternalContentTour
          })
        ) || []
        this.logger.log(`Transformed ${tours.length} tours from MediaInfo format`)
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

  /**
   * Fetch detailed tour media (description, itinerary, inclusions) for a specific tour.
   * Uses GetTourMedia endpoint which returns full tour content.
   */
  async fetchTourMedia(
    tourCode: string,
    season: string,
    mediaLanguage: string = 'English'
  ): Promise<GlobusTourMediaResponse | null> {
    const url = `${this.baseUrl}/GetTourMedia`
    const params = {
      tourCode,
      season,
      mediaLanguage,
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<string>(url, {
          params,
          timeout: 30000, // 30 seconds for single tour
          responseType: 'text',
          headers: { Accept: 'application/xml' },
        })
      )

      const parsed = parseTourMediaDataSet(response.data)

      return {
        tourMedia: parsed.tourMedia as GlobusTourMediaContent[],
        tourInfo: (parsed.tourInfo[0] as GlobusTourMediaInfo) || null,
        dayMedia: parsed.dayMedia as GlobusDayMediaContent[],
        tourKeywords: parsed.tourKeywords as GlobusTourKeyword[],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to fetch tour media for ${tourCode}: ${message}`)
      return null
    }
  }

  /**
   * Fetch hotel information for a specific tour.
   * Uses GetBasicHotelMedia endpoint.
   */
  async fetchHotelMedia(
    tourCode: string,
    season: string,
    brand: GlobusBrand
  ): Promise<GlobusHotelMedia[]> {
    const url = `${this.baseUrl}/GetBasicHotelMedia`
    const params = {
      tourCode,
      tourYear: season,
      brand: GLOBUS_BRAND_CODES[brand],
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<string>(url, {
          params,
          timeout: 15000,
          responseType: 'text',
          headers: { Accept: 'application/xml' },
        })
      )

      return parseHotelMediaArray<GlobusHotelMedia>(response.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to fetch hotel media for ${tourCode}: ${message}`)
      return []
    }
  }
}
