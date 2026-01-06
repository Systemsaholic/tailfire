/**
 * Metrics Service
 *
 * Observability metrics for external API providers.
 * Tracks request counts, latency, errors, and circuit breaker state.
 *
 * @remarks
 * This is a simple in-memory implementation for MVP.
 * For production, integrate with Prometheus, DataDog, or similar.
 */

import { Injectable, Logger } from '@nestjs/common'

/**
 * Circuit breaker state values
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open'

/**
 * Request status for metrics
 */
export type RequestStatus = 'success' | 'error' | 'fallback' | 'rate_limited'

/**
 * Metrics snapshot for a provider
 */
export interface ProviderMetrics {
  /** Total requests made */
  totalRequests: number
  /** Successful requests */
  successCount: number
  /** Failed requests */
  errorCount: number
  /** Fallback requests (to another provider) */
  fallbackCount: number
  /** Average latency in milliseconds */
  avgLatencyMs: number
  /** Current circuit breaker state */
  circuitBreakerState: CircuitBreakerState
  /** Rate limit remaining (minimum across all windows) */
  rateLimitRemaining?: number
  /** Timestamp of last request */
  lastRequestAt?: string
}

/**
 * Internal metrics storage per provider
 */
interface InternalMetrics {
  totalRequests: number
  successCount: number
  errorCount: number
  fallbackCount: number
  totalLatencyMs: number
  circuitBreakerState: CircuitBreakerState
  rateLimitRemaining?: number
  lastRequestAt?: Date
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name)

  /**
   * Map of provider IDs to their metrics
   */
  private metrics = new Map<string, InternalMetrics>()

  /**
   * Initialize metrics for a provider if not exists
   */
  private ensureMetrics(provider: string): InternalMetrics {
    if (!this.metrics.has(provider)) {
      this.metrics.set(provider, {
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        fallbackCount: 0,
        totalLatencyMs: 0,
        circuitBreakerState: 'closed',
      })
    }
    return this.metrics.get(provider)!
  }

  /**
   * Record a request to an external API
   *
   * @param provider - Provider identifier
   * @param endpoint - API endpoint (for logging)
   * @param status - Request status
   */
  recordRequest(provider: string, endpoint: string, status: RequestStatus): void {
    const m = this.ensureMetrics(provider)
    m.totalRequests++
    m.lastRequestAt = new Date()

    switch (status) {
      case 'success':
        m.successCount++
        break
      case 'error':
        m.errorCount++
        break
      case 'fallback':
        m.fallbackCount++
        break
    }

    // Log at debug level (sample in production)
    this.logger.debug(`Request: ${provider} ${endpoint} - ${status}`)
  }

  /**
   * Record request latency
   *
   * @param provider - Provider identifier
   * @param endpoint - API endpoint (for logging)
   * @param durationMs - Request duration in milliseconds
   */
  recordLatency(provider: string, endpoint: string, durationMs: number): void {
    const m = this.ensureMetrics(provider)
    m.totalLatencyMs += durationMs

    // Log slow requests
    if (durationMs > 5000) {
      this.logger.warn(`Slow request: ${provider} ${endpoint} - ${durationMs}ms`)
    }
  }

  /**
   * Update rate limit remaining (for alerting and metrics)
   *
   * @param provider - Provider identifier
   * @param remaining - Remaining requests (minimum across all windows)
   */
  setRateLimitRemaining(provider: string, remaining: number): void {
    const m = this.ensureMetrics(provider)
    m.rateLimitRemaining = remaining

    // Log when rate limit is getting low
    if (remaining < 10) {
      this.logger.warn(`Rate limit low for ${provider}: ${remaining} remaining`)
    }
  }

  /**
   * Update circuit breaker state
   *
   * @param provider - Provider identifier
   * @param state - New circuit breaker state
   */
  setCircuitBreakerState(provider: string, state: CircuitBreakerState): void {
    const m = this.ensureMetrics(provider)
    const previousState = m.circuitBreakerState

    if (previousState !== state) {
      m.circuitBreakerState = state
      this.logger.log(`Circuit breaker state change: ${provider} ${previousState} -> ${state}`)
    }
  }

  /**
   * Record a tracking job run (for flight tracking scheduler)
   *
   * @param successCount - Number of successful updates
   * @param errorCount - Number of failed updates
   * @param durationMs - Total job duration in milliseconds
   */
  recordTrackingJobRun(successCount: number, errorCount: number, durationMs: number): void {
    this.logger.log(
      `Tracking job completed: ${successCount} success, ${errorCount} errors, ${durationMs}ms`
    )
  }

  /**
   * Get metrics snapshot for a provider
   *
   * @param provider - Provider identifier
   * @returns Metrics snapshot or null if provider not tracked
   */
  getMetrics(provider: string): ProviderMetrics | null {
    const m = this.metrics.get(provider)
    if (!m) return null

    return {
      totalRequests: m.totalRequests,
      successCount: m.successCount,
      errorCount: m.errorCount,
      fallbackCount: m.fallbackCount,
      avgLatencyMs: m.totalRequests > 0 ? m.totalLatencyMs / m.totalRequests : 0,
      circuitBreakerState: m.circuitBreakerState,
      rateLimitRemaining: m.rateLimitRemaining,
      lastRequestAt: m.lastRequestAt?.toISOString(),
    }
  }

  /**
   * Get metrics for all providers
   *
   * @returns Map of provider IDs to metrics
   */
  getAllMetrics(): Record<string, ProviderMetrics> {
    const result: Record<string, ProviderMetrics> = {}

    for (const [provider, m] of this.metrics) {
      result[provider] = {
        totalRequests: m.totalRequests,
        successCount: m.successCount,
        errorCount: m.errorCount,
        fallbackCount: m.fallbackCount,
        avgLatencyMs: m.totalRequests > 0 ? m.totalLatencyMs / m.totalRequests : 0,
        circuitBreakerState: m.circuitBreakerState,
        rateLimitRemaining: m.rateLimitRemaining,
        lastRequestAt: m.lastRequestAt?.toISOString(),
      }
    }

    return result
  }

  /**
   * Reset metrics for a provider (for testing)
   *
   * @param provider - Provider identifier
   */
  reset(provider: string): void {
    this.metrics.delete(provider)
  }

  /**
   * Reset all metrics (for testing)
   */
  resetAll(): void {
    this.metrics.clear()
  }
}
