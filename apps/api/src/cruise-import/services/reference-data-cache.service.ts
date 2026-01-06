/**
 * Reference Data Cache Service
 *
 * Bounded in-memory cache for cruise reference data FKs.
 * Avoids repeated DB lookups during import.
 * Max 50K entries with LRU eviction.
 */

import { Injectable, Logger } from '@nestjs/common'
import { CacheStats } from '../cruise-import.types'

interface CacheEntry<T> {
  value: T
  lastAccessed: number
}

@Injectable()
export class ReferenceDataCacheService {
  private readonly logger = new Logger(ReferenceDataCacheService.name)

  // Separate caches for each reference type
  private cruiseLineCache = new Map<string, CacheEntry<string>>()
  private shipCache = new Map<string, CacheEntry<string>>()
  private portCache = new Map<string, CacheEntry<string>>()
  private regionCache = new Map<string, CacheEntry<string>>()

  // Cache limits
  private readonly MAX_ENTRIES_PER_TYPE = 12500 // 50K total / 4 types
  private readonly MAX_TOTAL_ENTRIES = 50000

  // Stats
  private hits = 0
  private misses = 0

  // ============================================================================
  // CRUISE LINES
  // ============================================================================

  getCruiseLineId(providerIdentifier: string): string | undefined {
    return this.get(this.cruiseLineCache, providerIdentifier)
  }

  setCruiseLineId(providerIdentifier: string, id: string): void {
    this.set(this.cruiseLineCache, providerIdentifier, id)
  }

  // ============================================================================
  // SHIPS
  // ============================================================================

  getShipId(providerIdentifier: string): string | undefined {
    return this.get(this.shipCache, providerIdentifier)
  }

  setShipId(providerIdentifier: string, id: string): void {
    this.set(this.shipCache, providerIdentifier, id)
  }

  // ============================================================================
  // PORTS
  // ============================================================================

  getPortId(providerIdentifier: string): string | undefined {
    return this.get(this.portCache, providerIdentifier)
  }

  setPortId(providerIdentifier: string, id: string): void {
    this.set(this.portCache, providerIdentifier, id)
  }

  // ============================================================================
  // REGIONS
  // ============================================================================

  getRegionId(providerIdentifier: string): string | undefined {
    return this.get(this.regionCache, providerIdentifier)
  }

  setRegionId(providerIdentifier: string, id: string): void {
    this.set(this.regionCache, providerIdentifier, id)
  }

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  private get<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const entry = cache.get(key)
    if (entry) {
      entry.lastAccessed = Date.now()
      this.hits++
      return entry.value
    }
    this.misses++
    return undefined
  }

  private set<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
    // Check if we need to evict
    if (cache.size >= this.MAX_ENTRIES_PER_TYPE) {
      this.evictLRU(cache)
    }

    // Also check total entries
    if (this.getTotalEntries() >= this.MAX_TOTAL_ENTRIES) {
      this.evictFromLargestCache()
    }

    cache.set(key, { value, lastAccessed: Date.now() })
  }

  private evictLRU<T>(cache: Map<string, CacheEntry<T>>): void {
    // Find and remove least recently used entry
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey)
    }
  }

  private evictFromLargestCache(): void {
    // Find the largest cache and evict from it
    const caches = [
      { cache: this.cruiseLineCache, name: 'cruiseLines' },
      { cache: this.shipCache, name: 'ships' },
      { cache: this.portCache, name: 'ports' },
      { cache: this.regionCache, name: 'regions' },
    ]

    const largest = caches.reduce((prev, curr) =>
      prev.cache.size > curr.cache.size ? prev : curr
    )

    this.evictLRU(largest.cache)
  }

  // ============================================================================
  // STATS & UTILITIES
  // ============================================================================

  getTotalEntries(): number {
    return (
      this.cruiseLineCache.size +
      this.shipCache.size +
      this.portCache.size +
      this.regionCache.size
    )
  }

  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses
    return {
      cruiseLines: this.cruiseLineCache.size,
      ships: this.shipCache.size,
      ports: this.portCache.size,
      regions: this.regionCache.size,
      totalEntries: this.getTotalEntries(),
      maxEntries: this.MAX_TOTAL_ENTRIES,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      hits: this.hits,
      misses: this.misses,
    }
  }

  clear(): void {
    this.cruiseLineCache.clear()
    this.shipCache.clear()
    this.portCache.clear()
    this.regionCache.clear()
    this.hits = 0
    this.misses = 0
    this.logger.log('Reference data cache cleared')
  }

  resetStats(): void {
    this.hits = 0
    this.misses = 0
  }

  logStats(): void {
    const stats = this.getStats()
    this.logger.log(
      `Cache stats: ${stats.totalEntries}/${stats.maxEntries} entries, ` +
        `${(stats.hitRate * 100).toFixed(1)}% hit rate ` +
        `(${stats.hits} hits, ${stats.misses} misses)`
    )
  }
}
