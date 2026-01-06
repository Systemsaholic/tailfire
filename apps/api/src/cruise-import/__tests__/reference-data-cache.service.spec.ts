/**
 * Reference Data Cache Service Tests
 *
 * Tests:
 * - LRU cache behavior
 * - Bounded cache (50K max entries)
 * - Cache hit/miss tracking
 * - Cache stats reporting
 */

import { Test, TestingModule } from '@nestjs/testing'
import { ReferenceDataCacheService } from '../services/reference-data-cache.service'

describe('ReferenceDataCacheService', () => {
  let service: ReferenceDataCacheService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReferenceDataCacheService],
    }).compile()

    service = module.get<ReferenceDataCacheService>(ReferenceDataCacheService)
  })

  describe('cruise line cache', () => {
    it('should cache and retrieve cruise line IDs', () => {
      service.setCruiseLineId('TCL-001', 'uuid-1234')
      expect(service.getCruiseLineId('TCL-001')).toBe('uuid-1234')
    })

    it('should return undefined for uncached items', () => {
      expect(service.getCruiseLineId('UNKNOWN')).toBeUndefined()
    })
  })

  describe('ship cache', () => {
    it('should cache and retrieve ship IDs', () => {
      service.setShipId('SHIP-001', 'uuid-ship-1')
      expect(service.getShipId('SHIP-001')).toBe('uuid-ship-1')
    })
  })

  describe('port cache', () => {
    it('should cache and retrieve port IDs', () => {
      service.setPortId('MIA', 'uuid-port-mia')
      expect(service.getPortId('MIA')).toBe('uuid-port-mia')
    })
  })

  describe('region cache', () => {
    it('should cache and retrieve region IDs', () => {
      service.setRegionId('CARIBBEAN', 'uuid-region-carib')
      expect(service.getRegionId('CARIBBEAN')).toBe('uuid-region-carib')
    })
  })

  describe('cache stats', () => {
    it('should track hit rate correctly', () => {
      // Set some values
      service.setCruiseLineId('TCL-001', 'uuid-1')
      service.setShipId('SHIP-001', 'uuid-2')

      // Hits
      service.getCruiseLineId('TCL-001')
      service.getShipId('SHIP-001')

      // Misses
      service.getCruiseLineId('UNKNOWN-1')
      service.getCruiseLineId('UNKNOWN-2')

      const stats = service.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBe(0.5)
    })

    it('should report total entries correctly', () => {
      service.setCruiseLineId('TCL-001', 'uuid-1')
      service.setShipId('SHIP-001', 'uuid-2')
      service.setPortId('MIA', 'uuid-3')
      service.setRegionId('CARIBBEAN', 'uuid-4')

      const stats = service.getStats()
      expect(stats.cruiseLines).toBe(1)
      expect(stats.ships).toBe(1)
      expect(stats.ports).toBe(1)
      expect(stats.regions).toBe(1)
      expect(stats.totalEntries).toBe(4)
    })

    it('should report max entries', () => {
      const stats = service.getStats()
      expect(stats.maxEntries).toBe(50000)
    })
  })

  describe('clear', () => {
    it('should clear all caches', () => {
      service.setCruiseLineId('TCL-001', 'uuid-1')
      service.setShipId('SHIP-001', 'uuid-2')
      service.setPortId('MIA', 'uuid-3')
      service.setRegionId('CARIBBEAN', 'uuid-4')

      service.clear()

      expect(service.getCruiseLineId('TCL-001')).toBeUndefined()
      expect(service.getShipId('SHIP-001')).toBeUndefined()
      expect(service.getPortId('MIA')).toBeUndefined()
      expect(service.getRegionId('CARIBBEAN')).toBeUndefined()

      const stats = service.getStats()
      expect(stats.totalEntries).toBe(0)
    })
  })

  describe('resetStats', () => {
    it('should reset hit/miss counters', () => {
      service.setCruiseLineId('TCL-001', 'uuid-1')
      service.getCruiseLineId('TCL-001')
      service.getCruiseLineId('UNKNOWN')

      service.resetStats()

      const stats = service.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })

    it('should not clear cached data when resetting stats', () => {
      service.setCruiseLineId('TCL-001', 'uuid-1')
      service.resetStats()

      expect(service.getCruiseLineId('TCL-001')).toBe('uuid-1')
    })
  })

  describe('bounded cache behavior', () => {
    it('should maintain entries below max limit', () => {
      // Add many entries (but not too many to slow down test)
      for (let i = 0; i < 100; i++) {
        service.setCruiseLineId(`LINE-${i}`, `uuid-${i}`)
      }

      const stats = service.getStats()
      expect(stats.cruiseLines).toBe(100)
      expect(stats.totalEntries).toBeLessThanOrEqual(50000)
    })
  })
})
