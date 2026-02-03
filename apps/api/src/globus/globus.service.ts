/**
 * Globus Service
 *
 * Real-time proxy to the Globus Family of Brands WebAPI.
 * Provides live tour search, departures, filters, and promotions.
 * No DB — pure HTTP proxy with in-memory TTL caching.
 */

import { Injectable, Logger, OnModuleInit, ServiceUnavailableException, BadGatewayException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { TTLCache } from './utils/cache-manager.util'
import { parseDataSet, parseArrayOfString, parseDeparturesWithPricing } from './utils/xml-parser.util'
import {
  GlobusBrand,
  GLOBUS_BRAND_VALUES,
  GlobusVacationRaw,
  GlobusTourRaw,
  GlobusDepartureWithPricingRaw,
  GlobusPromotionRaw,
  GlobusPromotionTourRaw,
  GlobusSearchResult,
  GlobusTour,
  GlobusDeparture,
  GlobusCabinPricing,
  GlobusPromotion,
} from './types/globus-api.types'

// Ensure value is an array (handles XML-to-JSON single element case)
function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

// Cache TTLs
const CACHE_5_MIN = 5 * 60 * 1000
const CACHE_10_MIN = 10 * 60 * 1000
const CACHE_24_HR = 24 * 60 * 60 * 1000

/**
 * Normalize brand string to title case (Globus API returns uppercase).
 * e.g., "COSMOS" → "Cosmos", "GLOBUS" → "Globus"
 */
function normalizeBrand(brand: string): string {
  if (!brand) return brand
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()
}

@Injectable()
export class GlobusService implements OnModuleInit {
  private readonly logger = new Logger(GlobusService.name)
  private readonly baseUrl: string

  // Caches
  private readonly searchCache = new TTLCache<GlobusSearchResult[]>()
  private readonly toursCache = new TTLCache<GlobusTour[]>()
  private readonly departuresCache = new TTLCache<GlobusDeparture[]>()
  private readonly locationsCache = new TTLCache<string[]>()
  private readonly stylesCache = new TTLCache<string[]>()
  private readonly promotionsCache = new TTLCache<GlobusPromotion[]>()

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('GLOBUS_API_URL') ||
      'https://webapi.globusandcosmos.com/gvitawapi.asmx'
  }

  async onModuleInit() {
    // Warm keyword/style caches in background (fire-and-forget)
    this.warmCaches().catch((err) =>
      this.logger.warn(`Cache warming failed: ${err.message}`),
    )
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Search vacations by keyword.
   */
  async searchByKeyword(
    keywords: string,
    brand?: GlobusBrand,
    season?: string,
    currency?: string,
  ): Promise<GlobusSearchResult[]> {
    const yr = season || String(new Date().getFullYear())
    const cur = currency || 'Canada'
    const brands = brand ? [brand] : GLOBUS_BRAND_VALUES

    const results: GlobusSearchResult[] = []
    for (const b of brands) {
      const key = `search:${b}:${yr}:${cur}:${keywords}`
      const cached = this.searchCache.get(key)
      if (cached) {
        results.push(...cached)
        continue
      }

      const xml = await this.fetchXml('GetVacationsByKeyword', {
        keywords,
        brand: b,
        season: yr,
        currency: cur,
        pricingModel: '0',
      })

      const rows = parseDataSet<GlobusVacationRaw>(xml, 'Table')
      const mapped = rows.map((r) => ({
        tourCode: r.TourCode,
        season: r.Season,
        name: r.Name,
      }))
      this.searchCache.set(key, mapped, CACHE_5_MIN)
      results.push(...mapped)
    }

    return results
  }

  /**
   * List all available tours.
   */
  async getAllTours(
    brand?: GlobusBrand,
    season?: string,
    currency?: string,
  ): Promise<GlobusTour[]> {
    const yr = season || String(new Date().getFullYear())
    const cur = currency || 'Canada'
    const brands = brand ? [brand] : GLOBUS_BRAND_VALUES

    const results: GlobusTour[] = []
    for (const b of brands) {
      const key = `tours:${b}:${yr}:${cur}`
      const cached = this.toursCache.get(key)
      if (cached) {
        results.push(...cached)
        continue
      }

      const xml = await this.fetchXml('GetAllAvailableTours', {
        brand: b,
        season: yr,
        currency: cur,
        pricingModel: '0',
      })

      const rows = parseDataSet<GlobusTourRaw>(xml, 'Table')
      const mapped = rows.map((r) => ({
        tourNumber: r.TourNumber,
        brand: normalizeBrand(r.Brand),
        name: r.Name,
      }))
      this.toursCache.set(key, mapped, CACHE_10_MIN)
      results.push(...mapped)
    }

    return results
  }

  /**
   * Get departures with pricing for a specific tour.
   */
  async getDeparturesWithPricing(
    tourCode: string,
    brand: GlobusBrand,
    currency?: string,
  ): Promise<GlobusDeparture[]> {
    const cur = currency || 'Canada'
    const key = `departures:${brand}:${tourCode}:${cur}`
    const cached = this.departuresCache.get(key)
    if (cached) return cached

    const xml = await this.fetchXml('GetDeparturesWithPricing', {
      tourCode,
      brand,
      currency: cur,
      pricingModel: '0',
    })

    const rows = parseDeparturesWithPricing<GlobusDepartureWithPricingRaw>(xml)
    const mapped = rows.map((r) => this.mapDeparture(r))
    this.departuresCache.set(key, mapped, CACHE_5_MIN)
    return mapped
  }

  /**
   * Get location keywords for autocomplete.
   */
  async getLocationKeywords(brand?: GlobusBrand): Promise<string[]> {
    const brands = brand ? [brand] : GLOBUS_BRAND_VALUES
    const results: string[] = []

    for (const b of brands) {
      const key = `locations:${b}`
      const cached = this.locationsCache.get(key)
      if (cached) {
        results.push(...cached)
        continue
      }

      const xml = await this.fetchXml('GetLocationKeywords', { brand: b })
      const keywords = parseArrayOfString(xml)
      this.locationsCache.set(key, keywords, CACHE_24_HR)
      results.push(...keywords)
    }

    // Deduplicate when fetching all brands
    return [...new Set(results)]
  }

  /**
   * Get travel style keywords for filters.
   */
  async getTravelStyleKeywords(brand?: GlobusBrand): Promise<string[]> {
    const brands = brand ? [brand] : GLOBUS_BRAND_VALUES
    const results: string[] = []

    for (const b of brands) {
      const key = `styles:${b}`
      const cached = this.stylesCache.get(key)
      if (cached) {
        results.push(...cached)
        continue
      }

      const xml = await this.fetchXml('GetTravelStyleKeywords', { brand: b })
      const keywords = parseArrayOfString(xml)
      this.stylesCache.set(key, keywords, CACHE_24_HR)
      results.push(...keywords)
    }

    return [...new Set(results)]
  }

  /**
   * Get current promotions.
   */
  async getPromotions(
    brand?: GlobusBrand,
    season?: string,
  ): Promise<GlobusPromotion[]> {
    const yr = season || String(new Date().getFullYear())
    const brands = brand ? [brand] : GLOBUS_BRAND_VALUES

    const results: GlobusPromotion[] = []
    for (const b of brands) {
      const key = `promotions:${b}:${yr}`
      const cached = this.promotionsCache.get(key)
      if (cached) {
        results.push(...cached)
        continue
      }

      const xml = await this.fetchXml('GetCurrentPromotions', {
        brand: b,
        season: yr,
      })

      // Promotions come as two tables: promotions + tour associations
      const promos = parseDataSet<GlobusPromotionRaw>(xml, 'Table')
      const tours = parseDataSet<GlobusPromotionTourRaw>(xml, 'Table1')

      const mapped = promos.map((p) => ({
        promotionId: p.PromotionId,
        headline: p.Headline,
        disclaimer: p.Disclaimer,
        category: p.Category,
        bookStartDate: p.BookStartDate,
        bookEndDate: p.BookEndDate,
        travelStartDate: p.TravelStartDate,
        travelEndDate: p.TravelEndDate,
        askReceiveCode: p.AskReceiveCode,
        requiresAir: p.RequiresAir,
        tours: tours
          .filter((t) => t.PromotionId === p.PromotionId)
          .map((t) => ({
            tourCode: t.TourCode,
            year: t.Year,
            brand: t.Brand,
          })),
      }))

      this.promotionsCache.set(key, mapped, CACHE_24_HR)
      results.push(...mapped)
    }

    return results
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async warmCaches(): Promise<void> {
    this.logger.log('Warming Globus keyword caches...')
    for (const b of GLOBUS_BRAND_VALUES) {
      await this.getLocationKeywords(b).catch(() => {})
      await this.getTravelStyleKeywords(b).catch(() => {})
    }
    this.logger.log('Globus keyword caches warmed')
  }

  /**
   * Fetch XML from the Globus WebAPI with 1 retry on timeout.
   */
  private async fetchXml(
    method: string,
    params: Record<string, string>,
  ): Promise<string> {
    const url = `${this.baseUrl}/${method}`

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<string>(url, {
            params,
            headers: { Accept: 'application/xml' },
            responseType: 'text',
            timeout: 15000,
          }),
        )
        return response.data
      } catch (err: any) {
        const isTimeout =
          err.code === 'ECONNABORTED' ||
          err.code === 'ETIMEDOUT' ||
          err.message?.includes('timeout')

        if (isTimeout && attempt === 0) {
          // Retry once with jitter (200-800ms)
          const jitter = 200 + Math.random() * 600
          this.logger.warn(`Globus API timeout for ${method}, retrying in ${Math.round(jitter)}ms`)
          await new Promise((r) => setTimeout(r, jitter))
          continue
        }

        if (isTimeout) {
          this.logger.warn(`Globus API timeout for ${method} after retry`)
          throw new ServiceUnavailableException('Globus API is temporarily unavailable')
        }

        this.logger.warn(`Globus API error for ${method}: ${err.message}`)
        throw new BadGatewayException('Failed to fetch data from Globus API')
      }
    }

    // Should never reach here, but satisfy TS
    throw new ServiceUnavailableException('Globus API is temporarily unavailable')
  }

  private mapDeparture(raw: GlobusDepartureWithPricingRaw): GlobusDeparture {
    const d = raw.Departure
    const pricingArr = Array.isArray(raw.Pricing)
      ? raw.Pricing
      : ensureArray(raw.Pricing?.DeparturePricing)

    return {
      brand: normalizeBrand(d.Brand),
      name: d.Name,
      airStartDate: d.AirStartDate,
      landStartDate: d.LandStartDate,
      landEndDate: d.LandEndDate,
      landOnlyPrice: d.LandOnlyPrice,
      shipName: d.ShipName,
      status: d.Status,
      departureCode: d.DepartureCode,
      guaranteedDeparture: d.GuaranteedDeparture,
      popularDeparture: d.PopularDeparture,
      intraTourAirRequired: d.IntraTourAirRequired,
      intraTourAir: d.IntraTourAir,
      intraTourAirTax: d.IntraTourAirTax,
      singleSupplement: d.Single,
      tripleReduction: d.Triple,
      tourStartAirportCity: d.TourStartAirportCity,
      tourEndAirportCity: d.TourEndAirportCity,
      pricing: pricingArr.map((p): GlobusCabinPricing => ({
        price: p.Price,
        discount: p.Discount,
        cabinCategory: p.CabinCategory,
        promotions: ensureArray(p.DeparturePricingDetails).map((det) => ({
          promotionId: det.PromotionId,
          amount: det.PromotionAmount,
        })),
      })),
    }
  }
}
