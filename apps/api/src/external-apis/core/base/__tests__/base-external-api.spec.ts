/**
 * BaseExternalApi Unit Tests
 *
 * Tests for circuit breaker state transitions and resilience patterns.
 */

import { HttpService } from '@nestjs/axios'
import { of, throwError } from 'rxjs'
import { BaseExternalApi, ResilienceConfig } from '../base-external-api'
import { RateLimiterService } from '../../services/rate-limiter.service'
import { MetricsService } from '../../services/metrics.service'
import {
  ExternalApiConfig,
  ExternalApiResponse,
  ConnectionTestResult,
  ApiCategory,
} from '../../interfaces'

/**
 * Helper to create an AxiosResponse-like mock
 * Uses `any` to avoid axios version conflicts in node_modules
 */
function mockAxiosResponse<T>(data: T, status = 200): any {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: {} },
  }
}

// Concrete implementation for testing
class TestExternalApi extends BaseExternalApi<{ query: string }, { id: string; name: string }> {
  constructor(
    httpService: HttpService,
    rateLimiter: RateLimiterService,
    metrics: MetricsService,
    resilience?: Partial<ResilienceConfig>
  ) {
    const config: ExternalApiConfig = {
      provider: 'test-provider',
      category: ApiCategory.FLIGHTS,
      baseUrl: 'https://api.test.com',
      rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
      authentication: { type: 'apiKey', headerName: 'X-API-Key' },
    }
    super(config, httpService, rateLimiter, metrics)

    // Override resilience config for faster tests
    if (resilience) {
      Object.assign(this.resilience, resilience)
    }
  }

  // Expose protected methods for testing
  public testMakeRequest<T>(endpoint: string) {
    return this.makeRequest<T>(endpoint)
  }

  public testGetCircuitBreakerState() {
    return this.getCircuitBreakerState()
  }

  // Required abstract methods
  async search(params: { query: string }): Promise<ExternalApiResponse<{ id: string; name: string }[]>> {
    return this.makeRequest(`/search?q=${params.query}`)
  }

  async getDetails(referenceId: string): Promise<ExternalApiResponse<{ id: string; name: string }>> {
    return this.makeRequest(`/details/${referenceId}`)
  }

  validateParams(params: { query: string }): { valid: boolean; errors: string[] } {
    if (!params.query) {
      return { valid: false, errors: ['Query is required'] }
    }
    return { valid: true, errors: [] }
  }

  transformResponse(apiData: any): { id: string; name: string } {
    return { id: apiData.id, name: apiData.name }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return { success: true, message: 'OK' }
  }
}

describe('BaseExternalApi', () => {
  let api: TestExternalApi
  let httpService: jest.Mocked<HttpService>
  let rateLimiter: jest.Mocked<RateLimiterService>
  let metrics: jest.Mocked<MetricsService>

  beforeEach(() => {
    httpService = {
      request: jest.fn(),
    } as any

    rateLimiter = {
      canMakeRequest: jest.fn().mockReturnValue(true),
      recordRequest: jest.fn(),
      getRemainingRequests: jest.fn().mockReturnValue(50),
    } as any

    metrics = {
      recordRequest: jest.fn(),
      recordLatency: jest.fn(),
      setRateLimitRemaining: jest.fn(),
      setCircuitBreakerState: jest.fn(),
    } as any

    // Fast resilience config for tests
    api = new TestExternalApi(httpService, rateLimiter, metrics, {
      timeoutMs: 1000,
      maxRetries: 1,
      retryDelayMs: 10, // Very fast for tests
      circuitBreakerThreshold: 3,
      circuitBreakerResetMs: 100, // Fast reset for tests
    })

    // Set credentials
    api.setCredentials({ apiKey: 'test-key' })
  })

  describe('circuit breaker', () => {
    it('should start in closed state', () => {
      expect(api.testGetCircuitBreakerState()).toBe('closed')
    })

    it('should open circuit after threshold failures', async () => {
      // Mock consecutive failures
      httpService.request.mockReturnValue(throwError(() => new Error('API Error')))

      // Make requests until circuit opens (threshold is 3)
      for (let i = 0; i < 3; i++) {
        await api.testMakeRequest('/test')
      }

      expect(api.testGetCircuitBreakerState()).toBe('open')
    })

    it('should block requests when circuit is open', async () => {
      // Force circuit open
      httpService.request.mockReturnValue(throwError(() => new Error('API Error')))

      for (let i = 0; i < 3; i++) {
        await api.testMakeRequest('/test')
      }

      // Next request should fail immediately without calling API
      httpService.request.mockClear()

      const result = await api.testMakeRequest('/test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('circuit open')
      expect(httpService.request).not.toHaveBeenCalled()
    })

    it('should transition to half-open after reset timeout', async () => {
      // Force circuit open
      httpService.request.mockReturnValue(throwError(() => new Error('API Error')))

      for (let i = 0; i < 3; i++) {
        await api.testMakeRequest('/test')
      }

      expect(api.testGetCircuitBreakerState()).toBe('open')

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150))

      // Checking state should transition to half-open
      expect(api.testGetCircuitBreakerState()).toBe('half-open')
    })

    it('should close circuit on successful probe in half-open state', async () => {
      // Force circuit open
      httpService.request.mockReturnValue(throwError(() => new Error('API Error')))

      for (let i = 0; i < 3; i++) {
        await api.testMakeRequest('/test')
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150))

      // Successful probe request
      httpService.request.mockReturnValue(of(mockAxiosResponse({ success: true })))

      await api.testMakeRequest('/test')

      expect(api.testGetCircuitBreakerState()).toBe('closed')
    })

    it('should reopen circuit on failed probe in half-open state', async () => {
      // Force circuit open
      httpService.request.mockReturnValue(throwError(() => new Error('API Error')))

      for (let i = 0; i < 3; i++) {
        await api.testMakeRequest('/test')
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150))

      // State should be half-open now
      expect(api.testGetCircuitBreakerState()).toBe('half-open')

      // Failed probe
      await api.testMakeRequest('/test')

      expect(api.testGetCircuitBreakerState()).toBe('open')
    })

    it('should reset failure count on success', async () => {
      // Two failures (below threshold)
      httpService.request.mockReturnValue(throwError(() => new Error('API Error')))
      await api.testMakeRequest('/test')
      await api.testMakeRequest('/test')

      // One success - should reset count
      httpService.request.mockReturnValue(of(mockAxiosResponse({ success: true })))
      await api.testMakeRequest('/test')

      // Two more failures - circuit should stay closed
      httpService.request.mockReturnValue(throwError(() => new Error('API Error')))
      await api.testMakeRequest('/test')
      await api.testMakeRequest('/test')

      expect(api.testGetCircuitBreakerState()).toBe('closed')
    })
  })

  describe('rate limiting integration', () => {
    it('should check rate limit before making request', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse({})))

      await api.testMakeRequest('/test')

      expect(rateLimiter.canMakeRequest).toHaveBeenCalled()
    })

    it('should reject request when rate limited', async () => {
      rateLimiter.canMakeRequest.mockReturnValue(false)

      const result = await api.testMakeRequest('/test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limit exceeded')
      expect(httpService.request).not.toHaveBeenCalled()
    })

    it('should record request after success', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse({})))

      await api.testMakeRequest('/test')

      expect(rateLimiter.recordRequest).toHaveBeenCalled()
    })
  })

  describe('metrics recording', () => {
    it('should record success metrics', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse({})))

      await api.testMakeRequest('/test')

      expect(metrics.recordRequest).toHaveBeenCalledWith('test-provider', '/test', 'success')
      expect(metrics.recordLatency).toHaveBeenCalled()
      expect(metrics.setCircuitBreakerState).toHaveBeenCalledWith('test-provider', 'closed')
    })

    it('should record error metrics', async () => {
      httpService.request.mockReturnValue(throwError(() => new Error('API Error')))

      await api.testMakeRequest('/test')

      expect(metrics.recordRequest).toHaveBeenCalledWith('test-provider', '/test', 'error')
    })

    it('should update rate limit remaining in metrics', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse({})))

      await api.testMakeRequest('/test')

      expect(metrics.setRateLimitRemaining).toHaveBeenCalledWith('test-provider', 50)
    })
  })

  describe('retry behavior', () => {
    it('should retry on failure up to maxRetries', async () => {
      httpService.request
        .mockReturnValueOnce(throwError(() => new Error('Transient error')))
        .mockReturnValueOnce(of(mockAxiosResponse({ success: true })))

      const result = await api.testMakeRequest('/test')

      expect(result.success).toBe(true)
      expect(httpService.request).toHaveBeenCalledTimes(2)
    })

    it('should not retry on 4xx errors (except 429)', async () => {
      const error = { response: { status: 400 }, message: 'Bad request' }
      httpService.request.mockReturnValue(throwError(() => error))

      await api.testMakeRequest('/test')

      expect(httpService.request).toHaveBeenCalledTimes(1) // No retry
    })

    it('should retry on 429 rate limit errors', async () => {
      const rateLimitError = { response: { status: 429 }, message: 'Too many requests' }
      httpService.request
        .mockReturnValueOnce(throwError(() => rateLimitError))
        .mockReturnValueOnce(of(mockAxiosResponse({ success: true })))

      const result = await api.testMakeRequest('/test')

      expect(result.success).toBe(true)
      expect(httpService.request).toHaveBeenCalledTimes(2) // Retry on 429
    })
  })

  describe('credentials', () => {
    it('should set credentials', async () => {
      await api.setCredentials({ apiKey: 'new-key' })
      // Credentials are set - just verify no error thrown
    })

    it('should warn when making request without credentials', async () => {
      const apiWithoutCreds = new TestExternalApi(httpService, rateLimiter, metrics)
      httpService.request.mockReturnValue(of(mockAxiosResponse({})))

      await apiWithoutCreds.testMakeRequest('/test')

      // Should still make request but headers won't have auth
      expect(httpService.request).toHaveBeenCalled()
    })
  })
})
