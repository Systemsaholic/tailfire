/**
 * Sailing Import Service
 *
 * Handles upsert of cruise sailing data with:
 * - Idempotent upsert via ON CONFLICT DO UPDATE
 * - Stub creation for unknown reference data (needs_review flag)
 * - Full metadata population for ships, ports, cruise lines
 * - Ship decks, cabin types, and images import
 * - Price summary calculation in same transaction
 * - CAD canonical currency storage
 * - Daily stub report for visibility
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { eq, and, sql } from 'drizzle-orm'
import { DatabaseService } from '../../db/database.service'
import { ReferenceDataCacheService } from './reference-data-cache.service'
import {
  TraveltekSailingData,
  TraveltekShipContent,
  TraveltekCruiseLineContent,
  TraveltekPortInfo,
  TraveltekCabinInfo,
  TraveltekCachedPrice,
  TraveltekAltSailing,
  TraveltekShipDeck,
} from '../cruise-import.types'
import type { DeckMetadata } from '@tailfire/database'

@Injectable()
export class SailingImportService {
  private readonly logger = new Logger(SailingImportService.name)

  // Track stubs created during import session
  private stubsCreated = {
    cruiseLines: 0,
    ships: 0,
    ports: 0,
    regions: 0,
  }

  constructor(
    private readonly db: DatabaseService,
    private readonly cache: ReferenceDataCacheService
  ) {}

  // ============================================================================
  // MAIN UPSERT ENTRY POINT
  // ============================================================================

  /**
   * Upsert a sailing from Traveltek data.
   * Returns true if created, false if updated.
   */
  async upsertSailing(data: TraveltekSailingData, rawJson?: string): Promise<boolean> {
    const providerIdentifier = data.codetocruiseid
    if (!providerIdentifier) {
      throw new Error('Missing Traveltek provider identifier (codetocruiseid)')
    }
    const {
      cruiseSailings,
      cruiseSailingStops,
      cruiseSailingRegions,
      cruiseSyncRaw,
    } = this.db.schema

    // Extract names from nested content objects
    const cruiseLineName = data.linecontent?.name || `Unknown Line ${data.cruiselineid}`
    const shipName = data.shipcontent?.name || `Unknown Ship ${data.shipid}`

    // Get port names from ports lookup
    // The ports object can be either:
    // 1. Simple format: {id: "name"} (most common from Traveltek)
    // 2. Nested format: {id: {name: "...", latitude: "...", ...}}
    const getPortName = (portId: string | number): string => {
      const portData = data.ports?.[String(portId)]
      if (!portData) return `Port ${portId}`
      if (typeof portData === 'string') return portData
      if (typeof portData === 'object' && portData !== null) {
        return (portData as TraveltekPortInfo).name || `Port ${portId}`
      }
      return `Port ${portId}`
    }
    const embarkPortName = getPortName(data.startportid)
    const disembarkPortName = getPortName(data.endportid)

    // Resolve all FK references (with stub creation if needed)
    // Pass full content objects to populate metadata
    const cruiseLineId = await this.resolveCruiseLineId(
      data.cruiselineid,
      cruiseLineName,
      data.linecontent
    )
    const shipId = await this.resolveShipId(
      data.shipid,
      shipName,
      cruiseLineId,
      data.shipcontent
    )
    const embarkPortId = await this.resolvePortId(
      String(data.startportid),
      embarkPortName,
      data.ports?.[String(data.startportid)]
    )
    const disembarkPortId = await this.resolvePortId(
      String(data.endportid),
      disembarkPortName,
      data.ports?.[String(data.endportid)]
    )

    // Get regions - data.regions is Record<string, string> like {"4": "Europe", "9": "Scandinavia"}
    const regionEntries = data.regions ? Object.entries(data.regions) : []
    const firstRegion = regionEntries[0]
    const regionId = firstRegion
      ? await this.resolveRegionId(firstRegion[0], firstRegion[1])
      : null

    // Calculate end date
    if (!data.saildate) {
      throw new Error(`Missing sail date for sailing ${providerIdentifier}`)
    }
    const sailDate = new Date(data.saildate)
    const endDate = new Date(sailDate)
    endDate.setDate(endDate.getDate() + data.nights)
    const endDateStr = endDate.toISOString().split('T')[0] ?? ''

    // Perform atomic upsert
    return await this.db.db.transaction(async (tx) => {
      // 1. Upsert sailing
      const [existingSailing] = await tx
        .select({ id: cruiseSailings.id })
        .from(cruiseSailings)
        .where(
          and(
            eq(cruiseSailings.provider, 'traveltek'),
            eq(cruiseSailings.providerIdentifier, providerIdentifier)
          )
        )
        .limit(1)

      const isNew = !existingSailing

      // Build sailing metadata with market/flight data
      const sailingMetadata: Record<string, unknown> = {}
      if (data.marketid != null) sailingMetadata.marketid = data.marketid
      if (data.nofly != null) sailingMetadata.nofly = data.nofly
      if (data.departuk != null) sailingMetadata.departuk = data.departuk

      const [sailing] = await tx
        .insert(cruiseSailings)
        .values({
          provider: 'traveltek',
          providerIdentifier,
          shipId,
          cruiseLineId,
          embarkPortId,
          disembarkPortId,
          name: data.name || `Cruise ${providerIdentifier}`,
          sailDate: data.saildate,
          endDate: endDateStr,
          nights: data.nights,
          seaDays: data.seadays ?? null,
          voyageCode: data.voyagecode ?? null,
          // Market and flight data (dedicated columns)
          marketId: data.marketid ?? null,
          noFly: data.nofly ?? null,
          departUk: data.departuk ?? null,
          embarkPortName,
          disembarkPortName,
          metadata: Object.keys(sailingMetadata).length > 0 ? sailingMetadata : null,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [cruiseSailings.provider, cruiseSailings.providerIdentifier],
          set: {
            shipId,
            cruiseLineId,
            embarkPortId,
            disembarkPortId,
            name: data.name || `Cruise ${providerIdentifier}`,
            sailDate: data.saildate,
            endDate: endDateStr,
            nights: data.nights,
            seaDays: data.seadays ?? null,
            voyageCode: data.voyagecode ?? null,
            // Market and flight data (dedicated columns)
            marketId: data.marketid ?? null,
            noFly: data.nofly ?? null,
            departUk: data.departuk ?? null,
            embarkPortName,
            disembarkPortName,
            metadata: Object.keys(sailingMetadata).length > 0 ? sailingMetadata : null,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning({ id: cruiseSailings.id })

      if (!sailing) {
        throw new Error(`Failed to upsert sailing ${providerIdentifier}`)
      }
      const sailingId = sailing.id

      // 2. Upsert region association
      if (regionId) {
        await tx
          .insert(cruiseSailingRegions)
          .values({
            sailingId,
            regionId,
            isPrimary: true,
          })
          .onConflictDoNothing()
      }

      // 3. Delete old stops and insert new
      await tx.delete(cruiseSailingStops).where(eq(cruiseSailingStops.sailingId, sailingId))

      if (data.itinerary && data.itinerary.length > 0) {
        const stops = await Promise.all(
          data.itinerary.map(async (day, index) => {
            const portName = day.name || 'Unknown Port'
            const isSeaDay = portName.toLowerCase() === 'at sea'

            // Build port info from itinerary day (may have lat/long inline)
            const portInfo: TraveltekPortInfo | undefined =
              !isSeaDay && day.portid
                ? {
                    id: day.portid,
                    name: portName,
                    latitude: day.latitude,
                    longitude: day.longitude,
                    description: day.description,
                    shortdescription: day.shortdescription,
                    itinerarydescription: day.itinerarydescription,
                  }
                : undefined

            const portId =
              !isSeaDay && day.portid
                ? await this.resolvePortId(String(day.portid), portName, portInfo)
                : null

            return {
              sailingId,
              portId,
              portName: isSeaDay ? 'At Sea' : portName,
              isSeaDay,
              dayNumber: parseInt(day.day, 10) || index + 1,
              sequenceOrder: day.orderid ?? index,
              arrivalTime: day.arrivetime || null,
              departureTime: day.departtime || null,
            }
          })
        )

        await tx.insert(cruiseSailingStops).values(stops)
      }

      // 3b. Import ship cabin types if available
      if (data.cabins && shipId) {
        await this.importShipCabinTypes(shipId, data.cabins)
      }

      // 4. Use pre-calculated cheapest prices from JSON root
      // The Traveltek JSON has complex nested pricing in prices/cachedprices objects,
      // but also provides pre-aggregated cheapest prices at the root level
      // For initial import, we use these pre-calculated values directly
      const cheapestInsideCents = data.cheapestinside ? Math.round(data.cheapestinside * 100) : null
      const cheapestOceanviewCents = data.cheapestoutside ? Math.round(data.cheapestoutside * 100) : null
      const cheapestBalconyCents = data.cheapestbalcony ? Math.round(data.cheapestbalcony * 100) : null
      const cheapestSuiteCents = data.cheapestsuite ? Math.round(data.cheapestsuite * 100) : null

      await tx
        .update(cruiseSailings)
        .set({
          cheapestInsideCents,
          cheapestOceanviewCents,
          cheapestBalconyCents,
          cheapestSuiteCents,
        })
        .where(eq(cruiseSailings.id, sailingId))

      // 5. Import detailed cabin pricing from cachedprices (if available)
      if (data.cachedprices && Object.keys(data.cachedprices).length > 0) {
        await this.importDetailedCabinPrices(tx, sailingId, data.cachedprices, data.cabins)
      }

      // 5b. Import cabin images from cabin data
      if (data.cabins && shipId) {
        await this.importCabinImages(shipId, data.cabins)
      }

      // 5c. Import alternate sailings
      if (data.altsailings && data.altsailings.length > 0) {
        await this.importAlternateSailings(tx, sailingId, data.altsailings)
      }

      // 6. Store raw JSON for debugging (optional)
      if (rawJson) {
        await tx
          .insert(cruiseSyncRaw)
          .values({
            providerSailingId: providerIdentifier,
            rawData: JSON.parse(rawJson),
            syncedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          })
          .onConflictDoUpdate({
            target: cruiseSyncRaw.providerSailingId,
            set: {
              rawData: JSON.parse(rawJson),
              syncedAt: new Date(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          })
      }

      return isNew
    })
  }

  // ============================================================================
  // REFERENCE DATA RESOLUTION (with stub creation)
  // ============================================================================

  private async resolveCruiseLineId(
    providerIdentifier: string,
    name: string,
    lineContent?: TraveltekCruiseLineContent
  ): Promise<string> {
    const { cruiseLines } = this.db.schema

    // Check cache first
    let id = this.cache.getCruiseLineId(providerIdentifier)
    if (id) {
      // Even if cached, update metadata if we have new content
      if (lineContent) {
        await this.updateCruiseLineMetadata(id, lineContent)
      }
      return id
    }

    // Check DB
    const [existing] = await this.db.db
      .select({ id: cruiseLines.id })
      .from(cruiseLines)
      .where(
        and(
          eq(cruiseLines.provider, 'traveltek'),
          eq(cruiseLines.providerIdentifier, providerIdentifier)
        )
      )
      .limit(1)

    if (existing) {
      this.cache.setCruiseLineId(providerIdentifier, existing.id)
      // Update metadata if we have content
      if (lineContent) {
        await this.updateCruiseLineMetadata(existing.id, lineContent)
      }
      return existing.id
    }

    // Build metadata from linecontent
    const metadata: Record<string, unknown> = {
      auto_created: true,
      needs_review: !lineContent, // Only needs review if we don't have full content
    }
    if (lineContent) {
      if (lineContent.logo) metadata.logo_url = lineContent.logo
      if (lineContent.description) metadata.description = lineContent.description
      if (lineContent.code) metadata.code = lineContent.code
      if (lineContent.shortname) metadata.shortname = lineContent.shortname
      if (lineContent.niceurl) metadata.website = lineContent.niceurl
    }

    // Create with full metadata
    const slug = this.slugify(name || `line-${providerIdentifier}`)
    const [newLine] = await this.db.db
      .insert(cruiseLines)
      .values({
        provider: 'traveltek',
        providerIdentifier,
        name: name || `Unknown Line ${providerIdentifier}`,
        slug: `${slug}-${providerIdentifier}`,
        metadata,
      })
      .onConflictDoNothing()
      .returning({ id: cruiseLines.id })

    if (newLine) {
      id = newLine.id
      this.stubsCreated.cruiseLines++
      this.logger.log(`Created cruise line: ${name} (${providerIdentifier}) with metadata`)
    } else {
      // Race condition - fetch again
      const [after] = await this.db.db
        .select({ id: cruiseLines.id })
        .from(cruiseLines)
        .where(
          and(
            eq(cruiseLines.provider, 'traveltek'),
            eq(cruiseLines.providerIdentifier, providerIdentifier)
          )
        )
        .limit(1)
      id = after!.id
    }

    this.cache.setCruiseLineId(providerIdentifier, id)
    return id
  }

  /**
   * Update cruise line metadata with content from Traveltek.
   */
  private async updateCruiseLineMetadata(
    cruiseLineId: string,
    lineContent: TraveltekCruiseLineContent
  ): Promise<void> {
    const metadataUpdate: Record<string, unknown> = {}
    if (lineContent.logo) metadataUpdate.logo_url = lineContent.logo
    if (lineContent.description) metadataUpdate.description = lineContent.description
    if (lineContent.code) metadataUpdate.code = lineContent.code
    if (lineContent.shortname) metadataUpdate.shortname = lineContent.shortname
    if (lineContent.niceurl) metadataUpdate.website = lineContent.niceurl

    if (Object.keys(metadataUpdate).length > 0) {
      // Use raw SQL to merge metadata (don't overwrite existing fields)
      await this.db.db.execute(sql`
        UPDATE catalog.cruise_lines
        SET metadata = metadata || ${JSON.stringify(metadataUpdate)}::jsonb,
            updated_at = NOW()
        WHERE id = ${cruiseLineId}
          AND (metadata->>'needs_review' = 'true' OR metadata->>'logo_url' IS NULL)
      `)
    }
  }

  private async resolveShipId(
    providerIdentifier: string,
    name: string,
    cruiseLineId: string,
    shipContent?: TraveltekShipContent
  ): Promise<string> {
    const { cruiseShips } = this.db.schema

    let id = this.cache.getShipId(providerIdentifier)
    if (id) {
      // Update metadata and decks if we have content
      if (shipContent) {
        await this.updateShipMetadataAndDecks(id, shipContent)
      }
      return id
    }

    const [existing] = await this.db.db
      .select({ id: cruiseShips.id })
      .from(cruiseShips)
      .where(
        and(
          eq(cruiseShips.provider, 'traveltek'),
          eq(cruiseShips.providerIdentifier, providerIdentifier)
        )
      )
      .limit(1)

    if (existing) {
      this.cache.setShipId(providerIdentifier, existing.id)
      // Update metadata and decks if we have content
      if (shipContent) {
        await this.updateShipMetadataAndDecks(existing.id, shipContent)
      }
      return existing.id
    }

    // Build metadata from shipcontent
    const metadata: Record<string, unknown> = {
      auto_created: true,
      needs_review: !shipContent, // Only needs review if we don't have full content
    }
    let shipClass: string | undefined
    let imageUrl: string | undefined

    if (shipContent) {
      if (shipContent.tonnage) metadata.tonnage = shipContent.tonnage
      if (shipContent.occupancy) metadata.passenger_capacity = shipContent.occupancy
      if (shipContent.launched) {
        const launchYear = new Date(shipContent.launched).getFullYear()
        if (!isNaN(launchYear)) metadata.year_built = launchYear
      }
      if (shipContent.length) metadata.length_feet = shipContent.length
      if (shipContent.code) metadata.code = shipContent.code
      shipClass = shipContent.shipclass

      // Extract default ship image - try multiple quality levels
      imageUrl =
        shipContent.defaultshipimagehd ||
        shipContent.defaultshipimage2k ||
        shipContent.defaultshipimage

      // Store all ship images in metadata for rich display
      if (shipContent.shipimages && shipContent.shipimages.length > 0) {
        metadata.ship_images = shipContent.shipimages.map((img) => ({
          url: img.imageurl,
          url_hd: img.imageurlhd,
          url_2k: img.imageurl2k,
          caption: img.caption,
          is_default: img.default === 'Y',
        }))
      }
    }

    const slug = this.slugify(name || `ship-${providerIdentifier}`)
    const [newShip] = await this.db.db
      .insert(cruiseShips)
      .values({
        provider: 'traveltek',
        providerIdentifier,
        name: name || `Unknown Ship ${providerIdentifier}`,
        slug: `${slug}-${providerIdentifier}`,
        cruiseLineId,
        shipClass: shipClass ?? null,
        imageUrl: imageUrl ?? null,
        metadata,
      })
      .onConflictDoNothing()
      .returning({ id: cruiseShips.id })

    if (newShip) {
      id = newShip.id
      this.stubsCreated.ships++
      this.logger.log(`Created ship: ${name} (${providerIdentifier}) with metadata`)

      // Import ship decks if available
      if (shipContent?.shipdecks) {
        await this.importShipDecks(id, shipContent.shipdecks)
      }
    } else {
      const [after] = await this.db.db
        .select({ id: cruiseShips.id })
        .from(cruiseShips)
        .where(
          and(
            eq(cruiseShips.provider, 'traveltek'),
            eq(cruiseShips.providerIdentifier, providerIdentifier)
          )
        )
        .limit(1)
      id = after!.id
    }

    this.cache.setShipId(providerIdentifier, id)
    return id
  }

  /**
   * Update ship metadata and decks with content from Traveltek.
   */
  private async updateShipMetadataAndDecks(
    shipId: string,
    shipContent: TraveltekShipContent
  ): Promise<void> {
    const metadataUpdate: Record<string, unknown> = {}
    if (shipContent.tonnage) metadataUpdate.tonnage = shipContent.tonnage
    if (shipContent.occupancy) metadataUpdate.passenger_capacity = shipContent.occupancy
    if (shipContent.launched) {
      const launchYear = new Date(shipContent.launched).getFullYear()
      if (!isNaN(launchYear)) metadataUpdate.year_built = launchYear
    }
    if (shipContent.length) metadataUpdate.length_feet = shipContent.length
    if (shipContent.code) metadataUpdate.code = shipContent.code

    // Store all ship images in metadata for rich display
    if (shipContent.shipimages && shipContent.shipimages.length > 0) {
      metadataUpdate.ship_images = shipContent.shipimages.map((img) => ({
        url: img.imageurl,
        url_hd: img.imageurlhd,
        url_2k: img.imageurl2k,
        caption: img.caption,
        is_default: img.default === 'Y',
      }))
    }

    // Extract default ship image - try multiple quality levels
    const imageUrl =
      shipContent.defaultshipimagehd ||
      shipContent.defaultshipimage2k ||
      shipContent.defaultshipimage

    if (Object.keys(metadataUpdate).length > 0 || imageUrl) {
      // Use raw SQL to merge metadata and update image_url
      await this.db.db.execute(sql`
        UPDATE catalog.cruise_ships
        SET metadata = metadata || ${JSON.stringify(metadataUpdate)}::jsonb,
            ship_class = COALESCE(ship_class, ${shipContent.shipclass ?? null}),
            image_url = COALESCE(image_url, ${imageUrl ?? null}),
            updated_at = NOW()
        WHERE id = ${shipId}
          AND (metadata->>'needs_review' = 'true' OR metadata->>'tonnage' IS NULL OR image_url IS NULL)
      `)
    }

    // Import ship decks if available (only if we don't have them yet)
    if (shipContent.shipdecks) {
      await this.importShipDecks(shipId, shipContent.shipdecks)
    }
  }

  /**
   * Import ship decks with deck plans and cabin coordinates.
   */
  private async importShipDecks(
    shipId: string,
    shipDecks: Record<string, TraveltekShipDeck>
  ): Promise<void> {
    const { cruiseShipDecks } = this.db.schema

    // Check if we already have decks for this ship
    const existingDecks = await this.db.db
      .select({ id: cruiseShipDecks.id })
      .from(cruiseShipDecks)
      .where(eq(cruiseShipDecks.shipId, shipId))
      .limit(1)

    if (existingDecks.length > 0) {
      return // Already have decks, skip
    }

    const decksToInsert = Object.entries(shipDecks).map(([deckId, deck], index) => {
      // Extract and validate cabin coordinates
      const cabinLocations: DeckMetadata['cabin_locations'] = []

      if (deck.cabinlocations) {
        for (const [cabinId, loc] of Object.entries(deck.cabinlocations)) {
          // Validate coordinate bounds per plan spec
          if (this.isValidCabinCoordinate(loc)) {
            cabinLocations.push({
              cabin_id: loc.cabinid || cabinId,
              x1: loc.x1!,
              y1: loc.y1!,
              x2: loc.x2!,
              y2: loc.y2!,
            })
          }
        }
      }

      // Build metadata with cabin locations if any valid ones found
      const metadata: DeckMetadata =
        cabinLocations.length > 0 ? { cabin_locations: cabinLocations } : {}

      return {
        shipId,
        name: deck.deckname || `Deck ${deckId}`,
        deckNumber: parseInt(deckId, 10) || index + 1,
        deckPlanUrl: deck.planimage ?? null,
        description: deck.description ?? null,
        displayOrder: index,
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
      }
    })

    if (decksToInsert.length > 0) {
      await this.db.db
        .insert(cruiseShipDecks)
        .values(decksToInsert)
        .onConflictDoNothing()
    }
  }

  /**
   * Validate cabin coordinate bounding box.
   * Returns true if coordinates are valid for deck plan overlay.
   */
  private isValidCabinCoordinate(loc: {
    x1?: number
    y1?: number
    x2?: number
    y2?: number
  }): boolean {
    const { x1, y1, x2, y2 } = loc
    // Must have all four values
    if (x1 == null || y1 == null || x2 == null || y2 == null) return false
    // Must be non-negative
    if (x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0) return false
    // x2 must be > x1, y2 must be > y1 (valid bounding box)
    if (x2 <= x1 || y2 <= y1) return false
    // Reasonable upper bound (deck plans typically < 5000px)
    if (x2 > 10000 || y2 > 10000) return false
    return true
  }

  /**
   * Import ship cabin types with images and descriptions.
   */
  private async importShipCabinTypes(
    shipId: string,
    cabins: Record<string, TraveltekCabinInfo>
  ): Promise<void> {
    const { cruiseShipCabinTypes } = this.db.schema

    // Check if we already have cabin types for this ship
    const existingCabins = await this.db.db
      .select({ id: cruiseShipCabinTypes.id })
      .from(cruiseShipCabinTypes)
      .where(eq(cruiseShipCabinTypes.shipId, shipId))
      .limit(1)

    if (existingCabins.length > 0) {
      return // Already have cabin types, skip
    }

    const cabinTypesToInsert = Object.entries(cabins).map(([cabinId, cabin]) => {
      // Map codtype to our cabin category
      const cabinCategory = this.normalizeCabinCategory(cabin.codtype || 'unknown')

      // Build metadata for additional fields
      const metadata: Record<string, unknown> = {}
      if (cabin.colourcode) metadata.color_code = cabin.colourcode
      if (cabin.allcabindecks?.length) metadata.all_decks = cabin.allcabindecks
      if (cabin.allcabinimages?.length) {
        metadata.additional_images = cabin.allcabinimages.map((img) => ({
          url: img.url,
          caption: img.caption,
        }))
      }
      if (cabin.imageurl2k) metadata.image_url_2k = cabin.imageurl2k
      if (cabin.imageurlhd) metadata.image_url_hd = cabin.imageurlhd

      return {
        shipId,
        cabinCode: cabin.id || cabinId,
        cabinCategory,
        name: cabin.name || `Cabin ${cabinId}`,
        description: cabin.description ?? null,
        imageUrl: cabin.imageurl ?? null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      }
    })

    if (cabinTypesToInsert.length > 0) {
      await this.db.db
        .insert(cruiseShipCabinTypes)
        .values(cabinTypesToInsert)
        .onConflictDoNothing()
    }
  }

  /**
   * Import detailed cabin pricing from Traveltek cachedprices.
   * Populates the cruise_sailing_cabin_prices table with per-cabin prices.
   */
  private async importDetailedCabinPrices(
    tx: Parameters<Parameters<typeof this.db.db.transaction>[0]>[0],
    sailingId: string,
    cachedprices: Record<string, TraveltekCachedPrice>,
    cabins?: Record<string, TraveltekCabinInfo>
  ): Promise<void> {
    const { cruiseSailingCabinPrices } = this.db.schema

    // Delete existing prices for this sailing (full replace on re-import)
    await tx.delete(cruiseSailingCabinPrices).where(eq(cruiseSailingCabinPrices.sailingId, sailingId))

    const pricesToInsert: Array<{
      sailingId: string
      cabinCode: string
      cabinCategory: string
      occupancy: number
      basePriceCents: number
      taxesCents: number
      originalCurrency: string
      originalAmountCents: number
      isPerPerson: number
    }> = []

    for (const [cabinCode, priceData] of Object.entries(cachedprices)) {
      // Skip if price is missing, null, 0, or undefined (don't write stale values)
      if (!priceData.price || priceData.price <= 0) continue

      // Derive cabin category from cabin data or cabin code prefix
      let cabinCategory = 'other'
      if (cabins?.[cabinCode]?.codtype) {
        cabinCategory = this.normalizeCabinCategory(cabins[cabinCode].codtype!)
      } else {
        // Fallback: infer from code prefix (common patterns: IA/IB=inside, OA/OV=oceanview, BA/BF=balcony, SA/SU=suite)
        const prefix = cabinCode.substring(0, 2).toUpperCase()
        if (['IA', 'IB', 'IC', 'ID', 'IE', 'IF', 'IG', 'IN'].includes(prefix)) cabinCategory = 'inside'
        else if (['OA', 'OB', 'OC', 'OD', 'OE', 'OF', 'OG', 'OV'].includes(prefix)) cabinCategory = 'oceanview'
        else if (['BA', 'BB', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH', 'BV'].includes(prefix)) cabinCategory = 'balcony'
        else if (['SA', 'SB', 'SC', 'SD', 'SE', 'SF', 'SG', 'SU', 'GS', 'PS', 'OS'].includes(prefix)) cabinCategory = 'suite'
      }

      // Convert price to cents (CAD canonical)
      const priceCents = Math.round(priceData.price * 100)
      const currency = priceData.currency || 'CAD'

      pricesToInsert.push({
        sailingId,
        cabinCode,
        cabinCategory,
        occupancy: 2, // Default double occupancy
        basePriceCents: priceCents,
        taxesCents: 0, // Traveltek prices typically include taxes
        originalCurrency: currency,
        originalAmountCents: priceCents,
        isPerPerson: 1, // Cruise prices are typically per person
      })
    }

    if (pricesToInsert.length > 0) {
      await tx.insert(cruiseSailingCabinPrices).values(pricesToInsert).onConflictDoNothing()
    }
  }

  /**
   * Import cabin images from Traveltek cabin data.
   * Populates the cruise_cabin_images table with gallery images per cabin type.
   */
  private async importCabinImages(
    shipId: string,
    cabins: Record<string, TraveltekCabinInfo>
  ): Promise<void> {
    const { cruiseShipCabinTypes, cruiseCabinImages } = this.db.schema

    // Get all cabin types for this ship to resolve FKs
    const cabinTypes = await this.db.db
      .select({ id: cruiseShipCabinTypes.id, cabinCode: cruiseShipCabinTypes.cabinCode })
      .from(cruiseShipCabinTypes)
      .where(eq(cruiseShipCabinTypes.shipId, shipId))

    const cabinTypeMap = new Map(cabinTypes.map((ct) => [ct.cabinCode, ct.id]))

    for (const [cabinId, cabin] of Object.entries(cabins)) {
      const cabinCode = cabin.id || cabinId
      const cabinTypeId = cabinTypeMap.get(cabinCode)
      if (!cabinTypeId) continue // No matching cabin type in DB

      // Check if images exist for this cabin type
      if (!cabin.allcabinimages || cabin.allcabinimages.length === 0) continue

      const imagesToInsert = cabin.allcabinimages
        .filter((img) => img.url) // Must have URL
        .map((img, index) => ({
          cabinTypeId,
          imageUrl: img.url!,
          imageUrlHd: cabin.imageurlhd ?? null,
          imageUrl2k: cabin.imageurl2k ?? null,
          caption: img.caption ?? null,
          displayOrder: index,
          isDefault: index === 0,
        }))

      if (imagesToInsert.length > 0) {
        // Use ON CONFLICT DO NOTHING to skip duplicates
        await this.db.db.insert(cruiseCabinImages).values(imagesToInsert).onConflictDoNothing()
      }
    }
  }

  /**
   * Import alternate sailings from Traveltek altsailings array.
   * Stores in cruise_alternate_sailings table with denormalized data.
   * FK resolution happens via backfill query at end of sync.
   */
  private async importAlternateSailings(
    tx: Parameters<Parameters<typeof this.db.db.transaction>[0]>[0],
    sailingId: string,
    altsailings: TraveltekAltSailing[]
  ): Promise<void> {
    const { cruiseAlternateSailings } = this.db.schema

    const alternatesToInsert = altsailings
      .filter((alt) => alt.id) // Must have alternate sailing ID
      .map((alt) => ({
        sailingId,
        provider: 'traveltek' as const,
        alternateProviderIdentifier: alt.id!,
        alternateSailDate: alt.saildate ?? null,
        alternateNights: alt.nights ?? null,
        alternateLeadPriceCents: alt.cheapestprice ? Math.round(alt.cheapestprice * 100) : null,
      }))

    if (alternatesToInsert.length > 0) {
      await tx.insert(cruiseAlternateSailings).values(alternatesToInsert).onConflictDoNothing()
    }
  }

  /**
   * Backfill alternate sailing FKs after a sync batch.
   * Resolves alternate_sailing_id when the referenced sailing exists in DB.
   * This method should be called at the END of each FTP sync.
   * Idempotent - running twice has no effect.
   */
  async backfillAlternateSailingFKs(): Promise<number> {
    const result = await this.db.db.execute(sql`
      UPDATE catalog.cruise_alternate_sailings alt
      SET alternate_sailing_id = s.id
      FROM catalog.cruise_sailings s
      WHERE alt.alternate_sailing_id IS NULL
        AND s.provider = alt.provider
        AND s.provider_identifier = alt.alternate_provider_identifier
    `)

    const rowsUpdated = (result as { rowCount?: number }).rowCount ?? 0
    if (rowsUpdated > 0) {
      this.logger.log(`Backfilled ${rowsUpdated} alternate sailing FK(s)`)
    }
    return rowsUpdated
  }

  private async resolvePortId(
    providerIdentifier: string,
    name: string,
    portInfo?: TraveltekPortInfo
  ): Promise<string | null> {
    if (!providerIdentifier) return null

    const { cruisePorts } = this.db.schema

    let id = this.cache.getPortId(providerIdentifier)
    if (id) {
      // Update metadata if we have content
      if (portInfo) {
        await this.updatePortMetadata(id, portInfo)
      }
      return id
    }

    const [existing] = await this.db.db
      .select({ id: cruisePorts.id })
      .from(cruisePorts)
      .where(
        and(
          eq(cruisePorts.provider, 'traveltek'),
          eq(cruisePorts.providerIdentifier, providerIdentifier)
        )
      )
      .limit(1)

    if (existing) {
      this.cache.setPortId(providerIdentifier, existing.id)
      // Update metadata if we have content
      if (portInfo) {
        await this.updatePortMetadata(existing.id, portInfo)
      }
      return existing.id
    }

    // Build metadata from portInfo
    const metadata: Record<string, unknown> = {
      auto_created: true,
      needs_review: !portInfo, // Only needs review if we don't have full content
    }
    if (portInfo) {
      if (portInfo.latitude) metadata.latitude = parseFloat(portInfo.latitude)
      if (portInfo.longitude) metadata.longitude = parseFloat(portInfo.longitude)
      if (portInfo.country) metadata.country = portInfo.country
      if (portInfo.countrycode) metadata.country_code = portInfo.countrycode
      if (portInfo.description) metadata.description = portInfo.description
      if (portInfo.shortdescription) metadata.short_description = portInfo.shortdescription
    }

    const slug = this.slugify(name || `port-${providerIdentifier}`)
    const [newPort] = await this.db.db
      .insert(cruisePorts)
      .values({
        provider: 'traveltek',
        providerIdentifier,
        name: name || `Unknown Port ${providerIdentifier}`,
        slug: `${slug}-${providerIdentifier}`,
        metadata,
      })
      .onConflictDoNothing()
      .returning({ id: cruisePorts.id })

    if (newPort) {
      id = newPort.id
      this.stubsCreated.ports++
      this.logger.log(`Created port: ${name} (${providerIdentifier}) with metadata`)
    } else {
      const [after] = await this.db.db
        .select({ id: cruisePorts.id })
        .from(cruisePorts)
        .where(
          and(
            eq(cruisePorts.provider, 'traveltek'),
            eq(cruisePorts.providerIdentifier, providerIdentifier)
          )
        )
        .limit(1)
      if (!after) {
        throw new Error(`Failed to resolve port ${providerIdentifier}`)
      }
      id = after.id
    }

    this.cache.setPortId(providerIdentifier, id)
    return id
  }

  /**
   * Update port metadata with content from Traveltek.
   * Always updates if lat/long available and port is missing coordinates.
   * Also clears needs_review flag when we have coordinates.
   */
  private async updatePortMetadata(
    portId: string,
    portInfo: TraveltekPortInfo
  ): Promise<void> {
    const metadataUpdate: Record<string, unknown> = {}

    // Parse coordinates if available
    const hasCoordinates = portInfo.latitude && portInfo.longitude
    if (hasCoordinates) {
      const lat = parseFloat(portInfo.latitude!)
      const lng = parseFloat(portInfo.longitude!)
      // Validate coordinates are reasonable
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        metadataUpdate.latitude = lat
        metadataUpdate.longitude = lng
        metadataUpdate.needs_review = false // Clear review flag when we have good coords
      }
    }

    if (portInfo.country) metadataUpdate.country = portInfo.country
    if (portInfo.countrycode) metadataUpdate.country_code = portInfo.countrycode
    if (portInfo.description) metadataUpdate.description = portInfo.description
    if (portInfo.shortdescription) metadataUpdate.short_description = portInfo.shortdescription

    if (Object.keys(metadataUpdate).length > 0) {
      // Use raw SQL to merge metadata - only update if port lacks coordinates
      await this.db.db.execute(sql`
        UPDATE catalog.cruise_ports
        SET metadata = metadata || ${JSON.stringify(metadataUpdate)}::jsonb,
            updated_at = NOW()
        WHERE id = ${portId}
          AND metadata->>'latitude' IS NULL
      `)
    }
  }

  private async resolveRegionId(
    providerIdentifier: string,
    name: string
  ): Promise<string | null> {
    if (!providerIdentifier) return null

    const { cruiseRegions } = this.db.schema

    let id = this.cache.getRegionId(providerIdentifier)
    if (id) return id

    const [existing] = await this.db.db
      .select({ id: cruiseRegions.id })
      .from(cruiseRegions)
      .where(
        and(
          eq(cruiseRegions.provider, 'traveltek'),
          eq(cruiseRegions.providerIdentifier, providerIdentifier)
        )
      )
      .limit(1)

    if (existing) {
      this.cache.setRegionId(providerIdentifier, existing.id)
      return existing.id
    }

    const slug = this.slugify(name || `region-${providerIdentifier}`)
    const [newRegion] = await this.db.db
      .insert(cruiseRegions)
      .values({
        provider: 'traveltek',
        providerIdentifier,
        name: name || `Unknown Region ${providerIdentifier}`,
        slug: `${slug}-${providerIdentifier}`,
        metadata: { auto_created: true, needs_review: true },
      })
      .onConflictDoNothing()
      .returning({ id: cruiseRegions.id })

    if (newRegion) {
      id = newRegion.id
      this.stubsCreated.regions++
      this.logger.log(`Created stub region: ${name} (${providerIdentifier})`)
    } else {
      const [after] = await this.db.db
        .select({ id: cruiseRegions.id })
        .from(cruiseRegions)
        .where(
          and(
            eq(cruiseRegions.provider, 'traveltek'),
            eq(cruiseRegions.providerIdentifier, providerIdentifier)
          )
        )
        .limit(1)
      if (!after) {
        throw new Error(`Failed to resolve region ${providerIdentifier}`)
      }
      id = after.id
    }

    this.cache.setRegionId(providerIdentifier, id)
    return id
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private normalizeCabinCategory(category: string): string {
    const lower = category.toLowerCase()
    if (lower.includes('inside') || lower.includes('interior')) return 'inside'
    if (lower.includes('ocean') || lower.includes('outside')) return 'oceanview'
    if (lower.includes('balcon') || lower.includes('verand')) return 'balcony'
    if (lower.includes('suite')) return 'suite'
    return 'other' // Fallback for unknown Traveltek custom tags
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 200)
  }

  // ============================================================================
  // STUB REPORTING
  // ============================================================================

  getStubsCreated() {
    return { ...this.stubsCreated }
  }

  resetStubsCreated() {
    this.stubsCreated = { cruiseLines: 0, ships: 0, ports: 0, regions: 0 }
  }

  async logStubReport(): Promise<void> {
    const { cruiseLines: lines, ships, ports, regions } = this.stubsCreated

    if (lines > 0 || ships > 0 || ports > 0 || regions > 0) {
      this.logger.warn(
        `[ACTION REQUIRED] Stubs created (needs_review=true): ` +
          `${lines} lines, ${ships} ships, ${ports} ports, ${regions} regions`
      )

      // Query total pending stubs
      const pending = await this.db.db.execute(sql`
        SELECT 'cruise_lines' as type, COUNT(*)::int as count FROM catalog.cruise_lines WHERE metadata->>'needs_review' = 'true'
        UNION ALL
        SELECT 'cruise_ships', COUNT(*)::int FROM catalog.cruise_ships WHERE metadata->>'needs_review' = 'true'
        UNION ALL
        SELECT 'cruise_ports', COUNT(*)::int FROM catalog.cruise_ports WHERE metadata->>'needs_review' = 'true'
        UNION ALL
        SELECT 'cruise_regions', COUNT(*)::int FROM catalog.cruise_regions WHERE metadata->>'needs_review' = 'true'
      `)

      this.logger.warn(`Total pending review: ${JSON.stringify(pending)}`)
    }
  }

  // ============================================================================
  // SCHEDULED STUB REPORT (Daily at 6 AM - after sync/cleanup jobs)
  // ============================================================================

  /**
   * Daily scheduled report of all stubs needing review.
   * Runs at 6 AM EST, after the sync (3 AM) and cleanup (4 AM) jobs.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    name: 'daily-stub-report',
    timeZone: 'America/Toronto',
  })
  async scheduledStubReport(): Promise<void> {
    const startTime = new Date()
    this.logger.log(`[${startTime.toISOString()}] Running daily stub review report...`)

    try {
      const report = await this.getPendingStubsReport()

      if (report.totalPending === 0) {
        this.logger.log('No stubs pending review.')
        return
      }

      this.logger.warn('='.repeat(60))
      this.logger.warn('[ACTION REQUIRED] DAILY STUB REVIEW REPORT')
      this.logger.warn('='.repeat(60))
      this.logger.warn(`Total pending review: ${report.totalPending}`)
      this.logger.warn(`  - Cruise lines: ${report.cruiseLines}`)
      this.logger.warn(`  - Ships: ${report.ships}`)
      this.logger.warn(`  - Ports: ${report.ports}`)
      this.logger.warn(`  - Regions: ${report.regions}`)

      // Port coordinate coverage - focus on active ports (used in sailings)
      this.logger.warn('')
      this.logger.warn(`Port Coordinate Coverage (Active Ports): ${report.portCoverage.activeCoveragePercent}%`)
      this.logger.warn(`  - Active ports (used in sailings): ${report.portCoverage.activePorts}`)
      this.logger.warn(`  - With coordinates: ${report.portCoverage.activeWithCoords}`)
      this.logger.warn(`  - Missing coordinates: ${report.portCoverage.activeWithoutCoords}`)
      if (report.portCoverage.activeCoveragePercent < 80) {
        this.logger.warn(`  [!] ACTION NEEDED: Active port coverage below 80%. Run larger sync to populate coords.`)
      }
      this.logger.warn('')
      this.logger.warn(`Port Coverage (All - includes orphan ports): ${report.portCoverage.coveragePercent}%`)
      this.logger.warn(`  - Total ports: ${report.portCoverage.totalPorts}`)
      this.logger.warn(`  - Orphan ports (never used): ${report.portCoverage.totalPorts - report.portCoverage.activePorts}`)

      // Log oldest stubs
      if (report.oldestStubs.length > 0) {
        this.logger.warn('')
        this.logger.warn('Oldest pending stubs:')
        for (const stub of report.oldestStubs) {
          this.logger.warn(`  - [${stub.type}] ${stub.name} (created: ${stub.createdAt})`)
        }
      }

      this.logger.warn('='.repeat(60))
    } catch (error) {
      this.logger.error(`Daily stub report failed: ${error}`)
    }
  }

  /**
   * Get a full report of pending stubs.
   */
  async getPendingStubsReport(): Promise<{
    totalPending: number
    cruiseLines: number
    ships: number
    ports: number
    regions: number
    portCoverage: {
      totalPorts: number
      withCoordinates: number
      withoutCoordinates: number
      coveragePercent: number
      // Active ports = ports used in actual sailings (actionable metric)
      activePorts: number
      activeWithCoords: number
      activeWithoutCoords: number
      activeCoveragePercent: number
    }
    oldestStubs: Array<{ type: string; name: string; createdAt: string }>
  }> {
    const counts = await this.db.db.execute<{ type: string; count: string }>(sql`
      SELECT 'cruise_lines' as type, COUNT(*)::text as count FROM catalog.cruise_lines WHERE metadata->>'needs_review' = 'true'
      UNION ALL
      SELECT 'cruise_ships', COUNT(*)::text FROM catalog.cruise_ships WHERE metadata->>'needs_review' = 'true'
      UNION ALL
      SELECT 'cruise_ports', COUNT(*)::text FROM catalog.cruise_ports WHERE metadata->>'needs_review' = 'true'
      UNION ALL
      SELECT 'cruise_regions', COUNT(*)::text FROM catalog.cruise_regions WHERE metadata->>'needs_review' = 'true'
    `)

    const countMap: Record<string, number> = {}
    for (const row of counts) {
      countMap[row.type] = parseInt(row.count, 10)
    }

    // Get port coordinate coverage stats - distinguish active (used in sailings) vs orphan ports
    const portStats = await this.db.db.execute<{
      total: string
      with_coords: string
      without_coords: string
      active_ports: string
      active_with_coords: string
      active_without_coords: string
    }>(sql`
      WITH port_usage AS (
        SELECT
          p.id,
          p.metadata->>'latitude' as lat,
          COUNT(DISTINCT st.sailing_id) > 0 as is_active
        FROM catalog.cruise_ports p
        LEFT JOIN catalog.cruise_sailing_stops st ON st.port_id = p.id
        GROUP BY p.id, p.metadata->>'latitude'
      )
      SELECT
        COUNT(*)::text as total,
        COUNT(*) FILTER (WHERE lat IS NOT NULL)::text as with_coords,
        COUNT(*) FILTER (WHERE lat IS NULL)::text as without_coords,
        COUNT(*) FILTER (WHERE is_active)::text as active_ports,
        COUNT(*) FILTER (WHERE is_active AND lat IS NOT NULL)::text as active_with_coords,
        COUNT(*) FILTER (WHERE is_active AND lat IS NULL)::text as active_without_coords
      FROM port_usage
    `)

    const totalPorts = parseInt(portStats[0]?.total ?? '0', 10)
    const withCoordinates = parseInt(portStats[0]?.with_coords ?? '0', 10)
    const withoutCoordinates = parseInt(portStats[0]?.without_coords ?? '0', 10)
    const coveragePercent = totalPorts > 0 ? Math.round((withCoordinates / totalPorts) * 1000) / 10 : 0

    // Active ports = ports actually used in sailings (more actionable metric)
    const activePorts = parseInt(portStats[0]?.active_ports ?? '0', 10)
    const activeWithCoords = parseInt(portStats[0]?.active_with_coords ?? '0', 10)
    const activeWithoutCoords = parseInt(portStats[0]?.active_without_coords ?? '0', 10)
    const activeCoveragePercent = activePorts > 0 ? Math.round((activeWithCoords / activePorts) * 1000) / 10 : 0

    // Get oldest 5 stubs across all types
    const oldestStubs = await this.db.db.execute<{
      type: string
      name: string
      created_at: string
    }>(sql`
      (SELECT 'cruise_lines' as type, name, created_at::text FROM catalog.cruise_lines WHERE metadata->>'needs_review' = 'true' ORDER BY created_at LIMIT 2)
      UNION ALL
      (SELECT 'cruise_ships', name, created_at::text FROM catalog.cruise_ships WHERE metadata->>'needs_review' = 'true' ORDER BY created_at LIMIT 2)
      UNION ALL
      (SELECT 'cruise_ports', name, created_at::text FROM catalog.cruise_ports WHERE metadata->>'needs_review' = 'true' ORDER BY created_at LIMIT 2)
      UNION ALL
      (SELECT 'cruise_regions', name, created_at::text FROM catalog.cruise_regions WHERE metadata->>'needs_review' = 'true' ORDER BY created_at LIMIT 2)
      ORDER BY created_at
      LIMIT 5
    `)

    const cruiseLines = countMap['cruise_lines'] ?? 0
    const ships = countMap['cruise_ships'] ?? 0
    const ports = countMap['cruise_ports'] ?? 0
    const regions = countMap['cruise_regions'] ?? 0

    return {
      totalPending: cruiseLines + ships + ports + regions,
      cruiseLines,
      ships,
      ports,
      regions,
      portCoverage: {
        totalPorts,
        withCoordinates,
        withoutCoordinates,
        coveragePercent,
        // Active ports = ports used in actual sailings (actionable metric)
        activePorts,
        activeWithCoords,
        activeWithoutCoords,
        activeCoveragePercent,
      },
      oldestStubs: oldestStubs.map((s) => ({
        type: s.type,
        name: s.name,
        createdAt: s.created_at,
      })),
    }
  }

  // ============================================================================
  // COVERAGE STATISTICS
  // ============================================================================

  /**
   * Get comprehensive coverage statistics for admin dashboard.
   * Shows completeness of metadata and media across all cruise entities.
   */
  async getCoverageStats(): Promise<{
    ships: {
      total: number
      withImage: number
      withDeckPlans: number
      needsReview: number
    }
    cruiseLines: {
      total: number
      withLogo: number
      needsReview: number
    }
    ports: {
      total: number
      active: number
      withCoordinates: number
      needsReview: number
    }
    regions: {
      total: number
      needsReview: number
    }
    sailings: {
      total: number
      activeFuture: number
    }
  }> {
    // Ships coverage
    const shipStats = await this.db.db.execute<{
      total: string
      with_image: string
      with_decks: string
      needs_review: string
    }>(sql`
      SELECT
        COUNT(*)::text as total,
        COUNT(*) FILTER (WHERE image_url IS NOT NULL)::text as with_image,
        (SELECT COUNT(DISTINCT ship_id) FROM catalog.cruise_ship_decks)::text as with_decks,
        COUNT(*) FILTER (WHERE metadata->>'needs_review' = 'true')::text as needs_review
      FROM catalog.cruise_ships
    `)

    // Cruise lines coverage
    const lineStats = await this.db.db.execute<{
      total: string
      with_logo: string
      needs_review: string
    }>(sql`
      SELECT
        COUNT(*)::text as total,
        COUNT(*) FILTER (WHERE metadata->>'logo_url' IS NOT NULL)::text as with_logo,
        COUNT(*) FILTER (WHERE metadata->>'needs_review' = 'true')::text as needs_review
      FROM catalog.cruise_lines
    `)

    // Ports coverage
    const portStats = await this.db.db.execute<{
      total: string
      active: string
      with_coords: string
      needs_review: string
    }>(sql`
      SELECT
        COUNT(*)::text as total,
        (SELECT COUNT(DISTINCT port_id) FROM catalog.cruise_sailing_stops WHERE port_id IS NOT NULL)::text as active,
        COUNT(*) FILTER (WHERE metadata->>'latitude' IS NOT NULL AND metadata->>'longitude' IS NOT NULL)::text as with_coords,
        COUNT(*) FILTER (WHERE metadata->>'needs_review' = 'true')::text as needs_review
      FROM catalog.cruise_ports
    `)

    // Regions coverage
    const regionStats = await this.db.db.execute<{
      total: string
      needs_review: string
    }>(sql`
      SELECT
        COUNT(*)::text as total,
        COUNT(*) FILTER (WHERE metadata->>'needs_review' = 'true')::text as needs_review
      FROM catalog.cruise_regions
    `)

    // Sailings stats
    const sailingStats = await this.db.db.execute<{
      total: string
      active_future: string
    }>(sql`
      SELECT
        COUNT(*)::text as total,
        COUNT(*) FILTER (WHERE sail_date >= CURRENT_DATE AND is_active = true)::text as active_future
      FROM catalog.cruise_sailings
    `)

    return {
      ships: {
        total: parseInt(shipStats[0]?.total ?? '0', 10),
        withImage: parseInt(shipStats[0]?.with_image ?? '0', 10),
        withDeckPlans: parseInt(shipStats[0]?.with_decks ?? '0', 10),
        needsReview: parseInt(shipStats[0]?.needs_review ?? '0', 10),
      },
      cruiseLines: {
        total: parseInt(lineStats[0]?.total ?? '0', 10),
        withLogo: parseInt(lineStats[0]?.with_logo ?? '0', 10),
        needsReview: parseInt(lineStats[0]?.needs_review ?? '0', 10),
      },
      ports: {
        total: parseInt(portStats[0]?.total ?? '0', 10),
        active: parseInt(portStats[0]?.active ?? '0', 10),
        withCoordinates: parseInt(portStats[0]?.with_coords ?? '0', 10),
        needsReview: parseInt(portStats[0]?.needs_review ?? '0', 10),
      },
      regions: {
        total: parseInt(regionStats[0]?.total ?? '0', 10),
        needsReview: parseInt(regionStats[0]?.needs_review ?? '0', 10),
      },
      sailings: {
        total: parseInt(sailingStats[0]?.total ?? '0', 10),
        activeFuture: parseInt(sailingStats[0]?.active_future ?? '0', 10),
      },
    }
  }
}
