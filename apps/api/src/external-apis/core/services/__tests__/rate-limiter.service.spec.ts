/**
 * RateLimiterService Unit Tests
 *
 * Tests for rate limiting with minute/hour/day windows.
 */

import { Test, TestingModule } from '@nestjs/testing'
import { RateLimiterService } from '../rate-limiter.service'
import { ApiRateLimit } from '../../interfaces'

describe('RateLimiterService', () => {
  let service: RateLimiterService

  const defaultLimit: ApiRateLimit = {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimiterService],
    }).compile()

    service = module.get<RateLimiterService>(RateLimiterService)
  })

  afterEach(() => {
    service.resetAll()
  })

  describe('canMakeRequest', () => {
    it('should allow requests within rate limit', () => {
      expect(service.canMakeRequest('test-provider', defaultLimit)).toBe(true)
    })

    it('should block requests exceeding minute limit', () => {
      // Make 10 requests (at the limit)
      for (let i = 0; i < 10; i++) {
        service.recordRequest('test-provider')
      }

      expect(service.canMakeRequest('test-provider', defaultLimit)).toBe(false)
    })

    it('should block requests exceeding hour limit', () => {
      const hourLimit: ApiRateLimit = {
        requestsPerMinute: 1000, // High minute limit
        requestsPerHour: 5,
        requestsPerDay: 1000,
      }

      for (let i = 0; i < 5; i++) {
        service.recordRequest('test-provider')
      }

      expect(service.canMakeRequest('test-provider', hourLimit)).toBe(false)
    })

    it('should block requests exceeding day limit', () => {
      const dayLimit: ApiRateLimit = {
        requestsPerMinute: 1000,
        requestsPerHour: 1000,
        requestsPerDay: 3,
      }

      for (let i = 0; i < 3; i++) {
        service.recordRequest('test-provider')
      }

      expect(service.canMakeRequest('test-provider', dayLimit)).toBe(false)
    })

    it('should allow requests when daily limit is undefined', () => {
      const noDayLimit: ApiRateLimit = {
        requestsPerMinute: 100,
        requestsPerHour: 100,
      }

      for (let i = 0; i < 50; i++) {
        service.recordRequest('test-provider')
      }

      // Should still be allowed (no daily limit)
      expect(service.canMakeRequest('test-provider', noDayLimit)).toBe(true)
    })
  })

  describe('getRemainingRequests', () => {
    it('should return correct remaining count', () => {
      service.recordRequest('test-provider')
      service.recordRequest('test-provider')

      const remaining = service.getRemainingRequests('test-provider', defaultLimit)
      expect(remaining).toBe(8) // 10 - 2 = 8 (minute limit is most constrained)
    })

    it('should return minimum across all windows', () => {
      const tightHourLimit: ApiRateLimit = {
        requestsPerMinute: 100,
        requestsPerHour: 5,
        requestsPerDay: 1000,
      }

      service.recordRequest('test-provider')
      service.recordRequest('test-provider')

      const remaining = service.getRemainingRequests('test-provider', tightHourLimit)
      expect(remaining).toBe(3) // Hour limit (5-2=3) is most constrained
    })
  })

  describe('getRemainingByWindow', () => {
    it('should return breakdown by window', () => {
      service.recordRequest('test-provider')
      service.recordRequest('test-provider')

      const remaining = service.getRemainingByWindow('test-provider', defaultLimit)

      expect(remaining.minute).toBe(8)
      expect(remaining.hour).toBe(98)
      expect(remaining.day).toBe(998)
    })

    it('should return null for day when no daily limit', () => {
      const noDayLimit: ApiRateLimit = {
        requestsPerMinute: 10,
        requestsPerHour: 100,
      }

      const remaining = service.getRemainingByWindow('test-provider', noDayLimit)

      expect(remaining.day).toBeNull()
    })
  })

  describe('getUsageStats', () => {
    it('should return correct usage counts', () => {
      service.recordRequest('test-provider')
      service.recordRequest('test-provider')
      service.recordRequest('test-provider')

      const stats = service.getUsageStats('test-provider')

      expect(stats.minute).toBe(3)
      expect(stats.hour).toBe(3)
      expect(stats.day).toBe(3)
    })

    it('should return zero for unknown provider', () => {
      const stats = service.getUsageStats('unknown')

      expect(stats.minute).toBe(0)
      expect(stats.hour).toBe(0)
      expect(stats.day).toBe(0)
    })
  })

  describe('reset', () => {
    it('should clear tracking for specific provider', () => {
      service.recordRequest('provider-a')
      service.recordRequest('provider-b')

      service.reset('provider-a')

      expect(service.getUsageStats('provider-a').minute).toBe(0)
      expect(service.getUsageStats('provider-b').minute).toBe(1)
    })
  })

  describe('resetAll', () => {
    it('should clear all tracking', () => {
      service.recordRequest('provider-a')
      service.recordRequest('provider-b')

      service.resetAll()

      expect(service.getUsageStats('provider-a').minute).toBe(0)
      expect(service.getUsageStats('provider-b').minute).toBe(0)
    })
  })
})
