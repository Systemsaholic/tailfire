import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DatabaseService } from '../db/database.service'
import { eq } from 'drizzle-orm'

// Response types for API
export interface CruiseLineDto {
  id: string
  name: string
  slug: string
  providerIdentifier: string
}

export interface CruiseShipDto {
  id: string
  name: string
  slug: string
  providerIdentifier: string
  cruiseLineId: string | null
  cruiseLineName: string | null
}

export interface CruiseRegionDto {
  id: string
  name: string
  slug: string
  providerIdentifier: string
}

export interface CruisePortDto {
  id: string
  name: string
  slug: string
  providerIdentifier: string
}

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000
// Maximum cache entries to prevent unbounded growth
const MAX_CACHE_ENTRIES = 10

@Injectable()
export class ReferenceDataService implements OnModuleInit {
  private cruiseLinesCache: CacheEntry<CruiseLineDto[]> | null = null
  private cruiseShipsCache: Map<string, CacheEntry<CruiseShipDto[]>> = new Map()
  private cruiseRegionsCache: CacheEntry<CruiseRegionDto[]> | null = null
  private cruisePortsCache: CacheEntry<CruisePortDto[]> | null = null
  private readonly logger = new Logger(ReferenceDataService.name)

  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit() {
    if (process.env.DISABLE_REFERENCE_CACHE === 'true') {
      this.logger.warn('Reference data cache preload disabled by DISABLE_REFERENCE_CACHE')
      return
    }

    // Pre-load cache on startup (non-blocking - catalog tables may not exist)
    try {
      await this.refreshCache()
    } catch (error) {
      this.logger.warn('Failed to preload reference data cache (catalog tables may not exist). Reference data endpoints will return empty arrays.')
    }
  }

  /**
   * Refresh all cached data from database
   */
  async refreshCache(): Promise<void> {
    this.logger.log('Refreshing reference data cache...')

    // Clear existing caches
    this.cruiseLinesCache = null
    this.cruiseShipsCache.clear()
    this.cruiseRegionsCache = null
    this.cruisePortsCache = null

    // Pre-load main data (catch errors for missing catalog tables)
    const results = await Promise.allSettled([
      this.getCruiseLines(),
      this.getRegions(),
    ])

    const failed = results.filter(r => r.status === 'rejected')
    if (failed.length > 0) {
      this.logger.warn(`Reference data cache partially loaded (${failed.length} queries failed - catalog tables may not exist)`)
    } else {
      this.logger.log('Reference data cache refreshed')
    }
  }

  /**
   * Get all cruise lines
   */
  async getCruiseLines(): Promise<CruiseLineDto[]> {
    // Check cache
    if (this.cruiseLinesCache && Date.now() < this.cruiseLinesCache.expiresAt) {
      return this.cruiseLinesCache.data
    }

    try {
      const db = this.databaseService.db
      const schema = this.databaseService.schema

      const results = await db
        .select({
          id: schema.cruiseLines.id,
          name: schema.cruiseLines.name,
          slug: schema.cruiseLines.slug,
          providerIdentifier: schema.cruiseLines.providerIdentifier,
        })
        .from(schema.cruiseLines)
        .orderBy(schema.cruiseLines.name)

      const data: CruiseLineDto[] = results.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        providerIdentifier: r.providerIdentifier,
      }))

      // Update cache
      this.cruiseLinesCache = {
        data,
        expiresAt: Date.now() + CACHE_TTL,
      }

      return data
    } catch {
      // Return empty array if catalog tables don't exist
      return []
    }
  }

  /**
   * Get cruise ships, optionally filtered by cruise line ID
   */
  async getShips(cruiseLineId?: string): Promise<CruiseShipDto[]> {
    const cacheKey = cruiseLineId || 'all'

    // Check cache
    const cached = this.cruiseShipsCache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }

    try {
      const db = this.databaseService.db
      const schema = this.databaseService.schema

      let query = db
        .select({
          id: schema.cruiseShips.id,
          name: schema.cruiseShips.name,
          slug: schema.cruiseShips.slug,
          providerIdentifier: schema.cruiseShips.providerIdentifier,
          cruiseLineId: schema.cruiseShips.cruiseLineId,
          cruiseLineName: schema.cruiseLines.name,
        })
        .from(schema.cruiseShips)
        .leftJoin(schema.cruiseLines, eq(schema.cruiseShips.cruiseLineId, schema.cruiseLines.id))
        .orderBy(schema.cruiseShips.name)

      if (cruiseLineId) {
        query = query.where(eq(schema.cruiseShips.cruiseLineId, cruiseLineId)) as typeof query
      }

      const results = await query

      const data: CruiseShipDto[] = results.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        providerIdentifier: r.providerIdentifier,
        cruiseLineId: r.cruiseLineId,
        cruiseLineName: r.cruiseLineName,
      }))

      // Guard against unbounded cache growth
      if (this.cruiseShipsCache.size >= MAX_CACHE_ENTRIES) {
        // Remove oldest entry
        const firstKey = this.cruiseShipsCache.keys().next().value
        if (firstKey) {
          this.cruiseShipsCache.delete(firstKey)
        }
      }

      // Update cache
      this.cruiseShipsCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_TTL,
      })

      return data
    } catch {
      // Return empty array if catalog tables don't exist
      return []
    }
  }

  /**
   * Get all cruise regions
   */
  async getRegions(): Promise<CruiseRegionDto[]> {
    // Check cache
    if (this.cruiseRegionsCache && Date.now() < this.cruiseRegionsCache.expiresAt) {
      return this.cruiseRegionsCache.data
    }

    try {
      const db = this.databaseService.db
      const schema = this.databaseService.schema

      const results = await db
        .select({
          id: schema.cruiseRegions.id,
          name: schema.cruiseRegions.name,
          slug: schema.cruiseRegions.slug,
          providerIdentifier: schema.cruiseRegions.providerIdentifier,
        })
        .from(schema.cruiseRegions)
        .orderBy(schema.cruiseRegions.name)

      const data: CruiseRegionDto[] = results.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        providerIdentifier: r.providerIdentifier,
      }))

      // Update cache
      this.cruiseRegionsCache = {
        data,
        expiresAt: Date.now() + CACHE_TTL,
      }

      return data
    } catch {
      // Return empty array if catalog tables don't exist
      return []
    }
  }

  /**
   * Get all cruise ports
   */
  async getPorts(): Promise<CruisePortDto[]> {
    // Check cache
    if (this.cruisePortsCache && Date.now() < this.cruisePortsCache.expiresAt) {
      return this.cruisePortsCache.data
    }

    try {
      const db = this.databaseService.db
      const schema = this.databaseService.schema

      const results = await db
        .select({
          id: schema.cruisePorts.id,
          name: schema.cruisePorts.name,
          slug: schema.cruisePorts.slug,
          providerIdentifier: schema.cruisePorts.providerIdentifier,
        })
        .from(schema.cruisePorts)
        .orderBy(schema.cruisePorts.name)

      const data: CruisePortDto[] = results.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        providerIdentifier: r.providerIdentifier,
      }))

      // Update cache
      this.cruisePortsCache = {
        data,
        expiresAt: Date.now() + CACHE_TTL,
      }

      return data
    } catch {
      // Return empty array if catalog tables don't exist
      return []
    }
  }

  /**
   * Get metadata about the reference data
   */
  async getMetadata(): Promise<{ counts: Record<string, number>; cacheStatus: string }> {
    const lines = await this.getCruiseLines()
    const regions = await this.getRegions()
    const ships = await this.getShips()
    const ports = await this.getPorts()

    return {
      counts: {
        cruiseLines: lines.length,
        cruiseShips: ships.length,
        cruiseRegions: regions.length,
        cruisePorts: ports.length,
      },
      cacheStatus: 'active',
    }
  }
}
