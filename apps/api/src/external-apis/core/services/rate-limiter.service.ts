/**
 * Rate Limiter Service
 *
 * In-memory rate limiting for external API providers.
 * Tracks requests per provider with minute/hour/day windows.
 *
 * @remarks
 * For MVP (single-instance deployment), in-memory rate limiting is acceptable.
 * For production multi-instance deployment, migrate to Redis-backed rate limits.
 */

import { Injectable, Logger } from '@nestjs/common'
import { ApiRateLimit } from '../interfaces'

/**
 * Rate limit remaining by time window
 */
export interface RateLimitRemaining {
  /** Remaining requests in current minute */
  minute: number
  /** Remaining requests in current hour */
  hour: number
  /** Remaining requests in current day (null if no daily limit) */
  day: number | null
}

/**
 * Usage statistics for a provider
 */
export interface UsageStats {
  /** Requests made in the last minute */
  minute: number
  /** Requests made in the last hour */
  hour: number
  /** Requests made in the last 24 hours */
  day: number
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name)

  /**
   * Map of provider IDs to request timestamps
   * Key: provider ID (e.g., 'aerodatabox')
   * Value: Array of Unix timestamps (milliseconds)
   */
  private timestamps = new Map<string, number[]>()

  /**
   * Check if a request can be made without exceeding rate limits
   *
   * @param providerId - Unique provider identifier
   * @param limit - Rate limit configuration
   * @returns true if request is allowed, false if rate limited
   */
  canMakeRequest(providerId: string, limit: ApiRateLimit): boolean {
    const now = Date.now()
    const ts = this.timestamps.get(providerId) || []

    // Clean old timestamps (> 24h)
    const cleaned = ts.filter(t => now - t < 24 * 60 * 60 * 1000)
    this.timestamps.set(providerId, cleaned)

    // Check limits (minute -> hour -> day)
    const minuteCount = cleaned.filter(t => now - t < 60 * 1000).length
    const hourCount = cleaned.filter(t => now - t < 60 * 60 * 1000).length
    const dayCount = cleaned.length // All timestamps within 24h

    if (minuteCount >= limit.requestsPerMinute) {
      this.logger.warn(
        `Rate limit exceeded for ${providerId}: ${minuteCount}/${limit.requestsPerMinute} per minute`
      )
      return false
    }

    if (hourCount >= limit.requestsPerHour) {
      this.logger.warn(
        `Rate limit exceeded for ${providerId}: ${hourCount}/${limit.requestsPerHour} per hour`
      )
      return false
    }

    if (limit.requestsPerDay && dayCount >= limit.requestsPerDay) {
      this.logger.warn(
        `Rate limit exceeded for ${providerId}: ${dayCount}/${limit.requestsPerDay} per day`
      )
      return false
    }

    return true
  }

  /**
   * Record a request for rate limiting purposes
   *
   * @param providerId - Unique provider identifier
   */
  recordRequest(providerId: string): void {
    const ts = this.timestamps.get(providerId) || []
    ts.push(Date.now())
    this.timestamps.set(providerId, ts)
  }

  /**
   * Get remaining requests for the most constrained window
   *
   * Returns the minimum of all configured limits for use in API response metadata.
   *
   * @param providerId - Unique provider identifier
   * @param limit - Rate limit configuration
   * @returns Minimum remaining requests across all windows
   */
  getRemainingRequests(providerId: string, limit: ApiRateLimit): number {
    const remaining = this.getRemainingByWindow(providerId, limit)
    return Math.min(remaining.minute, remaining.hour, remaining.day ?? Infinity)
  }

  /**
   * Get remaining requests broken down by window
   *
   * Use for observability/UX to show which limit is closest to exhaustion.
   *
   * @param providerId - Unique provider identifier
   * @param limit - Rate limit configuration
   * @returns Remaining requests per window
   */
  getRemainingByWindow(providerId: string, limit: ApiRateLimit): RateLimitRemaining {
    const now = Date.now()
    const ts = this.timestamps.get(providerId) || []

    const minuteCount = ts.filter(t => now - t < 60 * 1000).length
    const hourCount = ts.filter(t => now - t < 60 * 60 * 1000).length
    const dayCount = ts.filter(t => now - t < 24 * 60 * 60 * 1000).length

    return {
      minute: Math.max(0, limit.requestsPerMinute - minuteCount),
      hour: Math.max(0, limit.requestsPerHour - hourCount),
      day: limit.requestsPerDay ? Math.max(0, limit.requestsPerDay - dayCount) : null,
    }
  }

  /**
   * Get usage statistics for a provider
   *
   * @param providerId - Unique provider identifier
   * @returns Usage counts per window
   */
  getUsageStats(providerId: string): UsageStats {
    const now = Date.now()
    const ts = this.timestamps.get(providerId) || []

    return {
      minute: ts.filter(t => now - t < 60 * 1000).length,
      hour: ts.filter(t => now - t < 60 * 60 * 1000).length,
      day: ts.filter(t => now - t < 24 * 60 * 60 * 1000).length,
    }
  }

  /**
   * Reset rate limit tracking for a provider
   *
   * Useful for testing or manual intervention.
   *
   * @param providerId - Unique provider identifier
   */
  reset(providerId: string): void {
    this.timestamps.delete(providerId)
    this.logger.log(`Rate limit tracking reset for ${providerId}`)
  }

  /**
   * Reset all rate limit tracking
   *
   * Useful for testing.
   */
  resetAll(): void {
    this.timestamps.clear()
    this.logger.log('All rate limit tracking reset')
  }
}
