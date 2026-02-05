/**
 * Tour Import Service
 *
 * Orchestrates tour catalog data sync from external providers.
 * Currently supports Globus Family of Brands (Globus, Cosmos, Monograms).
 *
 * IMPORTANT: This service should ONLY run on Production (api.tailfire.ca).
 * Dev and Preview environments use FDW (Foreign Data Wrapper) to read
 * catalog data directly from Production.
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron } from '@nestjs/schedule'
import { sql, eq, and, lt, isNull } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import { GlobusImportProvider } from './providers/globus-import.provider'
import { GeocodingService } from '../geocoding'
import {
  TourSyncOptions,
  TourSyncMetrics,
  TourSyncResult,
  TourSyncError,
  GlobusBrand,
  GLOBUS_BRANDS,
  GLOBUS_BRAND_CODES,
  GlobusExternalContentTour,
  GlobusTourMediaResponse,
  GlobusHotelMedia,
} from './tour-import.types'
import {
  tourOperators,
  tours,
  tourDepartures,
  tourDeparturePricing,
  tourItineraryDays,
  tourHotels,
  tourMedia,
  tourInclusions,
  tourSyncHistory,
} from '@tailfire/database'

@Injectable()
export class TourImportService {
  private readonly logger = new Logger(TourImportService.name)
  private syncInProgress = false

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly globusProvider: GlobusImportProvider,
    private readonly geocodingService: GeocodingService
  ) {}

  // ============================================================================
  // MAIN SYNC ENTRY POINT
  // ============================================================================

  async runSync(options: TourSyncOptions = {}): Promise<TourSyncResult> {
    // Environment guard: Only Production should run tour sync
    const apiUrl = this.configService.get<string>('API_URL') || ''
    const isProduction = apiUrl.includes('api.tailfire.ca')
    const bypassGuard = this.configService.get('BYPASS_SYNC_ENVIRONMENT_GUARD') === 'true'

    if (!isProduction && !bypassGuard) {
      throw new Error(
        'Tour sync is only allowed on Production (api.tailfire.ca). ' +
          'Dev and Preview environments use FDW to read catalog data from Production.'
      )
    }

    if (this.syncInProgress) {
      throw new Error('Sync already in progress')
    }

    this.syncInProgress = true
    const startedAt = new Date()
    const brands = options.brands || GLOBUS_BRANDS
    const currency = options.currency || 'CAD'
    const brandResults: TourSyncMetrics[] = []

    try {
      this.logger.log('Starting tour catalog sync...')
      this.logger.log(`Brands: ${brands.join(', ')}, Currency: ${currency}`)

      // Acquire distributed lock
      const lockAcquired = await this.acquireSyncLock()
      if (!lockAcquired) {
        throw new Error('Could not acquire sync lock - another instance may be running')
      }

      try {
        // Sync each brand
        for (const brand of brands) {
          if (options.dryRun) {
            this.logger.log(`[DRY RUN] Would sync ${brand}`)
            continue
          }

          const metrics = await this.syncBrand(brand, currency, options)
          brandResults.push(metrics)
        }
      } finally {
        await this.releaseSyncLock()
      }

      const completedAt = new Date()
      const result: TourSyncResult = {
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        brandResults,
        totalToursSynced: brandResults.reduce((sum, m) => sum + m.toursSynced, 0),
        totalDeparturesSynced: brandResults.reduce((sum, m) => sum + m.departuresSynced, 0),
        totalErrors: brandResults.reduce((sum, m) => sum + m.errors.length, 0),
        status: this.determineStatus(brandResults),
      }

      this.logSummary(result)
      return result
    } finally {
      this.syncInProgress = false
    }
  }

  // ============================================================================
  // PER-BRAND SYNC
  // ============================================================================

  private async syncBrand(
    brand: GlobusBrand,
    currency: 'CAD' | 'USD',
    options: TourSyncOptions
  ): Promise<TourSyncMetrics> {
    const brandCode = GLOBUS_BRAND_CODES[brand]
    const metrics: TourSyncMetrics = {
      brand: brandCode,
      currency,
      startedAt: new Date(),
      toursSynced: 0,
      toursCreated: 0,
      toursUpdated: 0,
      toursMarkedInactive: 0,
      departuresSynced: 0,
      departuresCreated: 0,
      departuresUpdated: 0,
      departuresMarkedInactive: 0,
      itineraryDaysSynced: 0,
      hotelsSynced: 0,
      mediaSynced: 0,
      inclusionsSynced: 0,
      errors: [],
    }

    // Create sync history record
    const syncHistoryId = await this.createSyncHistoryRecord(brandCode, currency)

    try {
      this.logger.log(`Syncing ${brand} tours...`)

      // Fetch tour data from Globus API
      const tourData = await this.globusProvider.fetchBrandTours(brand, currency)
      this.logger.log(`Fetched ${tourData.length} tours for ${brand}`)

      // Get or create operator
      const operatorId = await this.getOrCreateOperator(brandCode, brand)

      // Track sync start time for soft-delete logic
      const syncStartTime = new Date()

      // Process each tour
      for (const tour of tourData) {
        try {
          await this.upsertTour(tour, operatorId, brandCode, brand, currency, metrics)
        } catch (error) {
          this.recordError(metrics, tour.TourNumber, error)
        }
      }

      // Mark tours/departures not seen in this sync as inactive (soft-delete)
      if (!options.forceFullSync) {
        const inactiveTours = await this.markInactiveTours(brandCode, syncStartTime)
        const inactiveDepartures = await this.markInactiveDepartures(brandCode, syncStartTime)
        metrics.toursMarkedInactive = inactiveTours
        metrics.departuresMarkedInactive = inactiveDepartures
      }

      metrics.completedAt = new Date()
      metrics.durationMs = metrics.completedAt.getTime() - metrics.startedAt.getTime()

      // Update sync history
      await this.finalizeSyncHistory(syncHistoryId, 'completed', metrics)

      return metrics
    } catch (error) {
      // Record fatal error
      this.recordError(metrics, undefined, error)
      await this.finalizeSyncHistory(syncHistoryId, 'failed', metrics)
      throw error
    }
  }

  // ============================================================================
  // TOUR UPSERT
  // ============================================================================

  private async upsertTour(
    tourData: GlobusExternalContentTour,
    operatorId: string,
    operatorCode: string,
    brand: GlobusBrand,
    currency: string,
    metrics: TourSyncMetrics
  ): Promise<void> {
    const now = new Date()
    const currentSeason = String(new Date().getFullYear())

    // Extract start/end cities from first/last departures or itinerary
    const startCity = tourData.StartCity || this.extractStartCity(tourData)
    const endCity = tourData.EndCity || this.extractEndCity(tourData)

    // Geocode start/end cities
    let startCityGeo: { lat: string; lng: string } | null = null
    let endCityGeo: { lat: string; lng: string } | null = null

    if (startCity) {
      const geo = await this.geocodingService.geocode(startCity)
      if (geo) {
        startCityGeo = { lat: String(geo.latitude), lng: String(geo.longitude) }
      }
    }
    if (endCity) {
      const geo = await this.geocodingService.geocode(endCity)
      if (geo) {
        endCityGeo = { lat: String(geo.latitude), lng: String(geo.longitude) }
      }
    }

    // Use TourNumber or fall back to TourCode for MediaInfo format
    const providerIdentifier = tourData.TourNumber || tourData.TourCode || ''
    if (!providerIdentifier) {
      this.logger.warn(`Tour missing identifier: ${JSON.stringify(Object.keys(tourData))}`)
      return
    }

    // Upsert main tour record
    const existingTour = await this.db.db
      .select({ id: tours.id })
      .from(tours)
      .where(
        and(
          eq(tours.provider, 'globus'),
          eq(tours.providerIdentifier, providerIdentifier),
          eq(tours.season, tourData.Season || currentSeason)
        )
      )
      .limit(1)

    let tourId: string

    if (existingTour.length > 0) {
      // Update existing tour
      tourId = existingTour[0]!.id
      await this.db.db
        .update(tours)
        .set({
          name: tourData.TourName,
          days: tourData.Days,
          nights: tourData.Nights,
          description: tourData.Description,
          startCity,
          startCityLat: startCityGeo?.lat,
          startCityLng: startCityGeo?.lng,
          endCity,
          endCityLat: endCityGeo?.lat,
          endCityLng: endCityGeo?.lng,
          isActive: true,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(tours.id, tourId))
      metrics.toursUpdated++
    } else {
      // Insert new tour
      const result = await this.db.db
        .insert(tours)
        .values({
          provider: 'globus',
          providerIdentifier,
          operatorId,
          operatorCode,
          name: tourData.TourName,
          season: tourData.Season || currentSeason,
          days: tourData.Days,
          nights: tourData.Nights,
          description: tourData.Description,
          startCity,
          startCityLat: startCityGeo?.lat,
          startCityLng: startCityGeo?.lng,
          endCity,
          endCityLat: endCityGeo?.lat,
          endCityLng: endCityGeo?.lng,
          isActive: true,
          lastSeenAt: now,
        })
        .returning({ id: tours.id })

      tourId = result[0]!.id
      metrics.toursCreated++
    }
    metrics.toursSynced++

    // Sync related data from initial fetch (if available)
    await this.syncItinerary(tourId, tourData, metrics)
    await this.syncHotels(tourId, tourData, metrics)
    await this.syncMedia(tourId, tourData, operatorCode, currentSeason, metrics)
    await this.syncInclusions(tourId, tourData, metrics)
    await this.syncDepartures(tourId, tourData, currency, metrics)

    // Fetch and sync detailed tour media (description, itinerary, inclusions, hotels)
    // This makes individual API calls per tour to GetTourMedia and GetBasicHotelMedia
    const tourCode = tourData.TourCode || tourData.TourNumber || providerIdentifier
    const season = tourData.Season || currentSeason
    try {
      await this.syncTourMediaDetails(tourId, tourCode, season, brand, metrics)
    } catch (error) {
      // Log but don't fail the entire tour sync for media fetch errors
      this.logger.warn(`Failed to sync tour media details for ${tourCode}: ${error}`)
    }
  }

  // ============================================================================
  // RELATED DATA SYNC
  // ============================================================================

  private async syncItinerary(
    tourId: string,
    tourData: GlobusExternalContentTour,
    metrics: TourSyncMetrics
  ): Promise<void> {
    if (!tourData.Itinerary || tourData.Itinerary.length === 0) return

    // Delete existing itinerary days and re-insert
    await this.db.db.delete(tourItineraryDays).where(eq(tourItineraryDays.tourId, tourId))

    // Batch geocode all overnight cities first
    const overnightCities = tourData.Itinerary
      .map(d => d.OvernightCity)
      .filter((city): city is string => !!city)
    const geocodedCities = await this.geocodingService.geocodeBatch([...new Set(overnightCities)])

    for (const day of tourData.Itinerary) {
      // Get geocoding for overnight city
      let overnightCityLat: string | undefined
      let overnightCityLng: string | undefined

      if (day.OvernightCity) {
        const geo = geocodedCities.get(day.OvernightCity)
        if (geo) {
          overnightCityLat = String(geo.latitude)
          overnightCityLng = String(geo.longitude)
        }
      }

      await this.db.db.insert(tourItineraryDays).values({
        tourId,
        dayNumber: day.DayNumber,
        title: day.Title,
        description: day.Description,
        overnightCity: day.OvernightCity,
        overnightCityLat,
        overnightCityLng,
      })
      metrics.itineraryDaysSynced++
    }
  }

  private async syncHotels(
    tourId: string,
    tourData: GlobusExternalContentTour,
    metrics: TourSyncMetrics
  ): Promise<void> {
    if (!tourData.Hotels || tourData.Hotels.length === 0) return

    // Delete existing hotels and re-insert
    await this.db.db.delete(tourHotels).where(eq(tourHotels.tourId, tourId))

    for (const hotel of tourData.Hotels) {
      await this.db.db.insert(tourHotels).values({
        tourId,
        dayNumber: hotel.DayNumber,
        hotelName: hotel.HotelName,
        city: hotel.City,
        description: hotel.Description,
      })
      metrics.hotelsSynced++
    }
  }

  private async syncMedia(
    tourId: string,
    tourData: GlobusExternalContentTour,
    operatorCode: string,
    season: string,
    metrics: TourSyncMetrics
  ): Promise<void> {
    // Delete existing media and re-insert
    await this.db.db.delete(tourMedia).where(eq(tourMedia.tourId, tourId))

    let sortOrder = 0
    const tourCode = tourData.TourCode || tourData.TourNumber

    // Globus Family image base URL (images are NOT sent through the API)
    // See: https://www.globusandcosmos.com/webapi/index.html
    const imageBaseUrl = 'https://images.globusfamily.com'

    // Add images from API if provided
    if (tourData.Images && tourData.Images.length > 0) {
      for (const image of tourData.Images) {
        await this.db.db.insert(tourMedia).values({
          tourId,
          mediaType: image.Type || 'image',
          url: image.Url,
          caption: image.Caption,
          sortOrder: sortOrder++,
        })
        metrics.mediaSynced++
      }
    } else if (tourCode) {
      // Construct default vacation image URL from tour code
      // Pattern: https://images.globusfamily.com/vacation/TOURCODE.jpg
      const vacationImageUrl = `${imageBaseUrl}/vacation/${tourCode}.jpg`
      await this.db.db.insert(tourMedia).values({
        tourId,
        mediaType: 'image',
        url: vacationImageUrl,
        caption: tourData.TourName,
        sortOrder: sortOrder++,
      })
      metrics.mediaSynced++
    }

    // Add brochure
    if (tourData.BrochureUrl) {
      await this.db.db.insert(tourMedia).values({
        tourId,
        mediaType: 'brochure',
        url: tourData.BrochureUrl,
        sortOrder: sortOrder++,
      })
      metrics.mediaSynced++
    }

    // Add map from API if provided, otherwise construct from tour code
    if (tourData.MapUrl) {
      await this.db.db.insert(tourMedia).values({
        tourId,
        mediaType: 'map',
        url: tourData.MapUrl,
        sortOrder: sortOrder++,
      })
      metrics.mediaSynced++
    } else if (tourCode) {
      // Construct map URL from brand, season, and tour code
      // Pattern: https://images.globusfamily.com/maps/BRAND/YEAR/TOURCODE.jpg
      const brandName = operatorCode.charAt(0).toUpperCase() + operatorCode.slice(1).toLowerCase()
      const mapUrl = `${imageBaseUrl}/maps/${brandName}/${season}/${tourCode}.jpg`
      await this.db.db.insert(tourMedia).values({
        tourId,
        mediaType: 'map',
        url: mapUrl,
        sortOrder: sortOrder++,
      })
      metrics.mediaSynced++
    }

    // Add video
    if (tourData.VideoUrl) {
      await this.db.db.insert(tourMedia).values({
        tourId,
        mediaType: 'video',
        url: tourData.VideoUrl,
        sortOrder: sortOrder++,
      })
      metrics.mediaSynced++
    }
  }

  private async syncInclusions(
    tourId: string,
    tourData: GlobusExternalContentTour,
    metrics: TourSyncMetrics
  ): Promise<void> {
    // Delete existing inclusions and re-insert
    await this.db.db.delete(tourInclusions).where(eq(tourInclusions.tourId, tourId))

    let sortOrder = 0

    // Add highlights
    if (tourData.Highlights) {
      for (const highlight of tourData.Highlights) {
        await this.db.db.insert(tourInclusions).values({
          tourId,
          inclusionType: 'highlight',
          description: highlight,
          sortOrder: sortOrder++,
        })
        metrics.inclusionsSynced++
      }
    }

    // Add included features
    if (tourData.IncludedFeatures) {
      for (const feature of tourData.IncludedFeatures) {
        await this.db.db.insert(tourInclusions).values({
          tourId,
          inclusionType: 'included',
          category: feature.Category,
          description: feature.Description,
          sortOrder: sortOrder++,
        })
        metrics.inclusionsSynced++
      }
    }

    // Add excluded features
    if (tourData.ExcludedFeatures) {
      for (const exclusion of tourData.ExcludedFeatures) {
        await this.db.db.insert(tourInclusions).values({
          tourId,
          inclusionType: 'excluded',
          description: exclusion,
          sortOrder: sortOrder++,
        })
        metrics.inclusionsSynced++
      }
    }
  }

  private async syncDepartures(
    tourId: string,
    tourData: GlobusExternalContentTour,
    currency: string,
    metrics: TourSyncMetrics
  ): Promise<void> {
    if (!tourData.Departures || tourData.Departures.length === 0) return

    const now = new Date()
    const currentSeason = String(new Date().getFullYear())

    // Batch geocode all departure cities first
    const allCities = tourData.Departures
      .flatMap(d => [d.StartCity, d.EndCity])
      .filter((city): city is string => !!city)
    const geocodedCities = await this.geocodingService.geocodeBatch([...new Set(allCities)])

    for (const dep of tourData.Departures) {
      // Parse dates
      const landStartDate = dep.LandStartDate ? new Date(dep.LandStartDate) : null
      const landEndDate = dep.LandEndDate ? new Date(dep.LandEndDate) : null

      // Calculate base price (lowest cabin price)
      const basePriceCents = dep.CabinPricing?.reduce((min, cp) => {
        const price = Math.round(cp.Price * 100)
        return price < min ? price : min
      }, Infinity)

      // Get geocoding for start/end cities
      let startCityLat: string | undefined
      let startCityLng: string | undefined
      let endCityLat: string | undefined
      let endCityLng: string | undefined

      if (dep.StartCity) {
        const geo = geocodedCities.get(dep.StartCity)
        if (geo) {
          startCityLat = String(geo.latitude)
          startCityLng = String(geo.longitude)
        }
      }
      if (dep.EndCity) {
        const geo = geocodedCities.get(dep.EndCity)
        if (geo) {
          endCityLat = String(geo.latitude)
          endCityLng = String(geo.longitude)
        }
      }

      // Upsert departure
      const landStartDateStr = landStartDate?.toISOString().split('T')[0]
      const existingDep = await this.db.db
        .select({ id: tourDepartures.id })
        .from(tourDepartures)
        .where(
          and(
            eq(tourDepartures.tourId, tourId),
            eq(tourDepartures.departureCode, dep.DepartureCode),
            eq(tourDepartures.season, dep.Season || currentSeason),
            landStartDateStr
              ? eq(tourDepartures.landStartDate, landStartDateStr)
              : isNull(tourDepartures.landStartDate)
          )
        )
        .limit(1)

      let departureId: string

      if (existingDep.length > 0) {
        departureId = existingDep[0]!.id
        await this.db.db
          .update(tourDepartures)
          .set({
            landEndDate: landEndDate?.toISOString().split('T')[0],
            status: dep.Status,
            basePriceCents: basePriceCents === Infinity ? null : basePriceCents,
            currency,
            guaranteedDeparture: dep.GuaranteedDeparture ?? false,
            shipName: dep.ShipName,
            startCity: dep.StartCity,
            endCity: dep.EndCity,
            startCityLat,
            startCityLng,
            endCityLat,
            endCityLng,
            isActive: true,
            lastSeenAt: now,
            updatedAt: now,
          })
          .where(eq(tourDepartures.id, departureId))
        metrics.departuresUpdated++
      } else {
        const result = await this.db.db
          .insert(tourDepartures)
          .values({
            tourId,
            departureCode: dep.DepartureCode,
            season: dep.Season || currentSeason,
            landStartDate: landStartDate?.toISOString().split('T')[0],
            landEndDate: landEndDate?.toISOString().split('T')[0],
            status: dep.Status,
            basePriceCents: basePriceCents === Infinity ? null : basePriceCents,
            currency,
            guaranteedDeparture: dep.GuaranteedDeparture ?? false,
            shipName: dep.ShipName,
            startCity: dep.StartCity,
            endCity: dep.EndCity,
            startCityLat,
            startCityLng,
            endCityLat,
            endCityLng,
            isActive: true,
            lastSeenAt: now,
          })
          .returning({ id: tourDepartures.id })

        departureId = result[0]!.id
        metrics.departuresCreated++
      }
      metrics.departuresSynced++

      // Always delete existing pricing first (handles case where source has no pricing)
      await this.db.db.delete(tourDeparturePricing).where(eq(tourDeparturePricing.departureId, departureId))

      // Sync cabin pricing if present
      if (dep.CabinPricing && dep.CabinPricing.length > 0) {
        for (const cabin of dep.CabinPricing) {
          await this.db.db.insert(tourDeparturePricing).values({
            departureId,
            cabinCategory: cabin.CabinCategory,
            priceCents: Math.round(cabin.Price * 100),
            discountCents: cabin.Discount ? Math.round(cabin.Discount * 100) : 0,
            currency: cabin.Currency || currency,
          })
        }
      }
    }
  }

  // ============================================================================
  // TOUR MEDIA DETAILS SYNC (GetTourMedia + GetBasicHotelMedia)
  // ============================================================================

  /**
   * Fetch and sync detailed tour content from GetTourMedia and GetBasicHotelMedia.
   * This populates description, itinerary days, inclusions, and hotels.
   */
  private async syncTourMediaDetails(
    tourId: string,
    tourCode: string,
    season: string,
    brand: GlobusBrand,
    metrics: TourSyncMetrics
  ): Promise<void> {
    // Fetch tour media (description, itinerary, inclusions)
    const tourMedia = await this.globusProvider.fetchTourMedia(tourCode, season)
    if (tourMedia) {
      await this.processTourMediaContent(tourId, tourMedia, metrics)
    }

    // Fetch hotel media
    const hotels = await this.globusProvider.fetchHotelMedia(tourCode, season, brand)
    if (hotels.length > 0) {
      await this.processHotelMedia(tourId, hotels, metrics)
    }
  }

  /**
   * Process and store tour media content (description, itinerary, inclusions)
   */
  private async processTourMediaContent(
    tourId: string,
    mediaResponse: GlobusTourMediaResponse,
    metrics: TourSyncMetrics
  ): Promise<void> {
    // Extract description from "Vacation Overview" content
    const vacationOverview = mediaResponse.tourMedia.find(
      (m) => m.ContentType === 'Vacation Overview'
    )
    if (vacationOverview?.Content) {
      // Clean HTML tags from description
      const cleanDescription = this.cleanHtmlContent(vacationOverview.Content)
      await this.db.db
        .update(tours)
        .set({
          description: cleanDescription,
          updatedAt: new Date(),
        })
        .where(eq(tours.id, tourId))
    }

    // Extract and sync itinerary days
    await this.syncItineraryFromMedia(tourId, mediaResponse, metrics)

    // Extract and sync inclusions/highlights
    await this.syncInclusionsFromMedia(tourId, mediaResponse, metrics)
  }

  /**
   * Sync itinerary days from GetTourMedia response
   */
  private async syncItineraryFromMedia(
    tourId: string,
    mediaResponse: GlobusTourMediaResponse,
    metrics: TourSyncMetrics
  ): Promise<void> {
    // Filter for "Vacation Itinerary" content type in DayMedia
    const itineraryDays = mediaResponse.dayMedia.filter(
      (dm) => dm.ContentType === 'Vacation Itinerary'
    )

    if (itineraryDays.length === 0) return

    // Delete existing itinerary days and re-insert
    await this.db.db.delete(tourItineraryDays).where(eq(tourItineraryDays.tourId, tourId))

    // Extract cities from content for geocoding
    // Cities are in <SPAN CLASS=location>CITY_NAME</SPAN> format
    const cities: string[] = []
    for (const day of itineraryDays) {
      const city = this.extractCityFromItineraryContent(day.Content)
      if (city) cities.push(city)
    }
    const geocodedCities = await this.geocodingService.geocodeBatch([...new Set(cities)])

    for (const day of itineraryDays) {
      // Extract city from <SPAN CLASS=location> tag
      const overnightCity = this.extractCityFromItineraryContent(day.Content)

      // Extract title from <SPAN CLASS=subtitle> tag
      const title = this.extractTitleFromItineraryContent(day.Content)

      // Clean the full description
      const description = this.cleanHtmlContent(day.Content)

      let overnightCityLat: string | undefined
      let overnightCityLng: string | undefined

      if (overnightCity) {
        const geo = geocodedCities.get(overnightCity)
        if (geo) {
          overnightCityLat = String(geo.latitude)
          overnightCityLng = String(geo.longitude)
        }
      }

      await this.db.db.insert(tourItineraryDays).values({
        tourId,
        dayNumber: day.StartDayNum,
        title: title || overnightCity,
        description,
        overnightCity,
        overnightCityLat,
        overnightCityLng,
      })
      metrics.itineraryDaysSynced++
    }
  }

  /**
   * Extract city name from <SPAN CLASS=location>CITY</SPAN> tag
   */
  private extractCityFromItineraryContent(content: string): string | undefined {
    // Match <SPAN CLASS=location>CITY NAME</SPAN>
    const match = content.match(/<SPAN\s+CLASS=location>(.*?)<\/SPAN>/i)
    if (!match || !match[1]) return undefined
    // Clean the city name (remove trailing spaces, commas, etc.)
    return match[1].trim().replace(/[,–-].*$/, '').trim()
  }

  /**
   * Extract title from <SPAN CLASS=subtitle>TITLE</SPAN> tag
   */
  private extractTitleFromItineraryContent(content: string): string | undefined {
    // Match <SPAN CLASS=subtitle>TITLE</SPAN>
    const match = content.match(/<SPAN\s+CLASS=subtitle>(.*?)<\/SPAN>/i)
    if (!match || !match[1]) return undefined
    return match[1].trim()
  }

  /**
   * Sync inclusions/highlights from GetTourMedia response
   */
  private async syncInclusionsFromMedia(
    tourId: string,
    mediaResponse: GlobusTourMediaResponse,
    metrics: TourSyncMetrics
  ): Promise<void> {
    // Delete existing inclusions and re-insert
    await this.db.db.delete(tourInclusions).where(eq(tourInclusions.tourId, tourId))

    let sortOrder = 0

    // Map ContentType to inclusion type
    const contentTypeMap: Record<string, { type: string; category?: string }> = {
      'Meals': { type: 'included', category: 'Meals' },
      'Notes': { type: 'included', category: 'Important Notes' },
      'Travelers Notes': { type: 'highlight', category: 'Special Features' },
      'Small Group': { type: 'included', category: 'Group Size' },
      'UNESCO Sites': { type: 'highlight', category: 'UNESCO Sites' },
    }

    for (const tm of mediaResponse.tourMedia) {
      const mapping = contentTypeMap[tm.ContentType]
      if (!mapping) continue

      const cleanContent = this.cleanHtmlContent(tm.Content)
      if (!cleanContent) continue

      // Some content types have multiple items separated by delimiters
      if (tm.ContentType === 'UNESCO Sites') {
        // UNESCO Sites are pipe-delimited
        const sites = cleanContent.split('|').map((s) => s.trim()).filter(Boolean)
        for (const site of sites) {
          await this.db.db.insert(tourInclusions).values({
            tourId,
            inclusionType: mapping.type,
            category: mapping.category,
            description: site,
            sortOrder: sortOrder++,
          })
          metrics.inclusionsSynced++
        }
      } else {
        await this.db.db.insert(tourInclusions).values({
          tourId,
          inclusionType: mapping.type,
          category: mapping.category,
          description: cleanContent,
          sortOrder: sortOrder++,
        })
        metrics.inclusionsSynced++
      }
    }

    // Also extract highlights from keywords
    const styleKeywords = mediaResponse.tourKeywords.filter(
      (k) => k.KeywordType === 'Travel Style'
    )
    for (const kw of styleKeywords) {
      await this.db.db.insert(tourInclusions).values({
        tourId,
        inclusionType: 'highlight',
        category: 'Travel Style',
        description: kw.Keyword,
        sortOrder: sortOrder++,
      })
      metrics.inclusionsSynced++
    }
  }

  /**
   * Process and store hotel media from GetBasicHotelMedia
   */
  private async processHotelMedia(
    tourId: string,
    hotels: GlobusHotelMedia[],
    metrics: TourSyncMetrics
  ): Promise<void> {
    // Delete existing hotels and re-insert
    await this.db.db.delete(tourHotels).where(eq(tourHotels.tourId, tourId))

    for (const hotel of hotels) {
      await this.db.db.insert(tourHotels).values({
        tourId,
        hotelName: hotel.BasicName,
        city: hotel.BasicAddressCity || hotel.BasicSellingLocation,
        description: hotel.BasicDescription,
      })
      metrics.hotelsSynced++
    }
  }

  /**
   * Clean HTML tags and entities from content
   */
  private cleanHtmlContent(content: string): string {
    if (!content) return ''

    return content
      // Replace HTML breaks with newlines
      .replace(/<\/BR>/gi, '\n')
      .replace(/<BR\s*\/?>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // Remove SPAN tags with class attributes (but keep content)
      .replace(/<SPAN[^>]*>/gi, '')
      .replace(/<\/SPAN>/gi, '')
      // Remove other HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
  }

  // ============================================================================
  // SOFT-DELETE (mark inactive)
  // ============================================================================

  private async markInactiveTours(operatorCode: string, syncStartTime: Date): Promise<number> {
    await this.db.db
      .update(tours)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(tours.operatorCode, operatorCode),
          eq(tours.isActive, true),
          lt(tours.lastSeenAt, syncStartTime)
        )
      )

    // Drizzle doesn't easily return affected rows, would need raw query
    return 0
  }

  private async markInactiveDepartures(operatorCode: string, syncStartTime: Date): Promise<number> {
    // Mark departures inactive where their tour is from this operator
    // and they weren't seen in this sync
    // Note: Convert Date to ISO string for proper PostgreSQL timestamp compatibility
    await this.db.db.execute(sql`
      UPDATE catalog.tour_departures d
      SET is_active = false, updated_at = now()
      FROM catalog.tours t
      WHERE d.tour_id = t.id
        AND t.operator_code = ${operatorCode}
        AND d.is_active = true
        AND d.last_seen_at < ${syncStartTime.toISOString()}::timestamptz
    `)

    return 0
  }

  // ============================================================================
  // OPERATOR MANAGEMENT
  // ============================================================================

  private async getOrCreateOperator(code: string, name: string): Promise<string> {
    // Use case-insensitive matching to prevent duplicate operators
    const existing = await this.db.db
      .select({ id: tourOperators.id })
      .from(tourOperators)
      .where(sql`LOWER(${tourOperators.code}) = LOWER(${code})`)
      .limit(1)

    if (existing.length > 0) {
      return existing[0]!.id
    }

    const result = await this.db.db
      .insert(tourOperators)
      .values({
        code,
        name,
        provider: 'globus',
      })
      .returning({ id: tourOperators.id })

    return result[0]!.id
  }

  // ============================================================================
  // SYNC HISTORY
  // ============================================================================

  private async createSyncHistoryRecord(brand: string, currency: string): Promise<string | null> {
    try {
      const result = await this.db.db
        .insert(tourSyncHistory)
        .values({
          provider: 'globus',
          brand,
          currency,
          startedAt: new Date(),
          status: 'running',
          toursSynced: 0,
          departuresSynced: 0,
          errorsCount: 0,
        })
        .returning({ id: tourSyncHistory.id })

      return result[0]?.id ?? null
    } catch (error) {
      this.logger.warn(`Failed to create sync history record: ${error}`)
      return null
    }
  }

  private async finalizeSyncHistory(
    id: string | null,
    status: 'completed' | 'failed',
    metrics: TourSyncMetrics
  ): Promise<void> {
    if (!id) return

    try {
      await this.db.db
        .update(tourSyncHistory)
        .set({
          status,
          completedAt: new Date(),
          durationMs: metrics.durationMs,
          toursSynced: metrics.toursSynced,
          departuresSynced: metrics.departuresSynced,
          errorsCount: metrics.errors.length,
          errorMessage: metrics.errors[0]?.error ?? null,
        })
        .where(eq(tourSyncHistory.id, id))
    } catch (error) {
      this.logger.warn(`Failed to finalize sync history: ${error}`)
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private recordError(metrics: TourSyncMetrics, tourCode: string | undefined, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    const syncError: TourSyncError = {
      tourCode,
      error: message,
      errorType: 'unknown',
      timestamp: new Date(),
    }

    if (metrics.errors.length < 100) {
      metrics.errors.push(syncError)
    }

    this.logger.warn(`Tour sync error [${tourCode || 'unknown'}]: ${message}`)
  }

  // ============================================================================
  // STATUS & LOCKING
  // ============================================================================

  isSyncInProgress(): boolean {
    return this.syncInProgress
  }

  getSyncStatus(): { inProgress: boolean } {
    return { inProgress: this.syncInProgress }
  }

  private async acquireSyncLock(): Promise<boolean> {
    try {
      const result = await this.db.db.execute(
        sql`SELECT pg_try_advisory_lock(hashtext('tour_sync_lock')) as acquired`
      )
      const row = (result as any)[0]
      return row?.acquired === true
    } catch (error) {
      this.logger.warn(`Failed to acquire sync lock: ${error}`)
      return false
    }
  }

  private async releaseSyncLock(): Promise<void> {
    try {
      await this.db.db.execute(sql`SELECT pg_advisory_unlock(hashtext('tour_sync_lock'))`)
    } catch (error) {
      this.logger.warn(`Failed to release sync lock: ${error}`)
    }
  }

  // ============================================================================
  // CITY EXTRACTION HELPERS
  // ============================================================================

  /**
   * Extract start city from tour data (itinerary first day or departure info)
   */
  private extractStartCity(tourData: GlobusExternalContentTour): string | undefined {
    // Try first departure's start city
    if (tourData.Departures && tourData.Departures.length > 0) {
      const firstDep = tourData.Departures[0]
      if (firstDep?.StartCity) return firstDep.StartCity
    }

    // Try first itinerary day's overnight city
    if (tourData.Itinerary && tourData.Itinerary.length > 0) {
      const firstDay = tourData.Itinerary.find(d => d.DayNumber === 1) || tourData.Itinerary[0]
      if (firstDay?.OvernightCity) return firstDay.OvernightCity
    }

    return undefined
  }

  /**
   * Extract end city from tour data (last itinerary day or departure info)
   */
  private extractEndCity(tourData: GlobusExternalContentTour): string | undefined {
    // Try first departure's end city
    if (tourData.Departures && tourData.Departures.length > 0) {
      const firstDep = tourData.Departures[0]
      if (firstDep?.EndCity) return firstDep.EndCity
    }

    // Try last itinerary day's overnight city
    if (tourData.Itinerary && tourData.Itinerary.length > 0) {
      const sortedDays = [...tourData.Itinerary].sort((a, b) => b.DayNumber - a.DayNumber)
      const lastDay = sortedDays[0]
      if (lastDay?.OvernightCity) return lastDay.OvernightCity
    }

    return undefined
  }

  // ============================================================================
  // SUMMARY & LOGGING
  // ============================================================================

  private determineStatus(results: TourSyncMetrics[]): 'completed' | 'partial' | 'failed' {
    if (results.length === 0) return 'failed'
    const hasErrors = results.some((r) => r.errors.length > 0)
    const allFailed = results.every((r) => r.errors.length > 0 && r.toursSynced === 0)
    if (allFailed) return 'failed'
    if (hasErrors) return 'partial'
    return 'completed'
  }

  private logSummary(result: TourSyncResult): void {
    const duration = `${(result.durationMs / 1000).toFixed(1)}s`

    this.logger.log('='.repeat(60))
    this.logger.log('TOUR SYNC COMPLETE')
    this.logger.log('='.repeat(60))
    this.logger.log(`Status: ${result.status}`)
    this.logger.log(`Duration: ${duration}`)
    this.logger.log(`Total Tours: ${result.totalToursSynced}`)
    this.logger.log(`Total Departures: ${result.totalDeparturesSynced}`)
    this.logger.log(`Total Errors: ${result.totalErrors}`)

    for (const brand of result.brandResults) {
      this.logger.log(`  ${brand.brand}: ${brand.toursSynced} tours, ${brand.departuresSynced} departures`)
    }

    this.logger.log('='.repeat(60))
  }

  // ============================================================================
  // SCHEDULED SYNC (CRON)
  // ============================================================================

  /**
   * Scheduled daily sync at 3 AM Toronto time (after cruise sync at 2 AM).
   * Controlled by ENABLE_SCHEDULED_TOUR_SYNC env var.
   */
  @Cron('0 3 * * *', { timeZone: 'America/Toronto' })
  async scheduledSync(): Promise<void> {
    const enabled = this.configService.get('ENABLE_SCHEDULED_TOUR_SYNC')
    if (!enabled || enabled === 'false') {
      return
    }

    if (this.isSyncInProgress()) {
      this.logger.warn('Scheduled tour sync skipped - sync already in progress')
      return
    }

    try {
      this.logger.log('Starting scheduled tour catalog sync')
      await this.runSync()
      this.logger.log('Scheduled tour sync completed')
    } catch (error) {
      this.logger.error(`Scheduled tour sync failed: ${error}`)
    }
  }
}
