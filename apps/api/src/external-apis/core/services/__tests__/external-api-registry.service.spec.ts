/**
 * ExternalApiRegistryService Unit Tests
 *
 * Tests for provider registration, credential loading, and fallback chain behavior.
 */

import { Test, TestingModule } from '@nestjs/testing'
import { ExternalApiRegistryService } from '../external-api-registry.service'
import { MetricsService } from '../metrics.service'
import { ApiCredentialsService } from '../../../../api-credentials/api-credentials.service'
import { ApiCategory, IExternalApiProvider, ExternalApiConfig } from '../../interfaces'

// Mock provider for testing
const createMockProvider = (
  provider: string,
  category: ApiCategory
): IExternalApiProvider<any, any> => ({
  config: {
    provider,
    category,
    baseUrl: `https://${provider}.example.com`,
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
    authentication: { type: 'apiKey' },
  } as ExternalApiConfig,
  search: jest.fn(),
  getDetails: jest.fn(),
  validateParams: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  transformResponse: jest.fn(),
  testConnection: jest.fn().mockResolvedValue({ success: true, message: 'OK' }),
  setCredentials: jest.fn().mockResolvedValue(undefined),
})

describe('ExternalApiRegistryService', () => {
  let service: ExternalApiRegistryService
  let credentialsService: jest.Mocked<ApiCredentialsService>
  let metricsService: jest.Mocked<MetricsService>

  beforeEach(async () => {
    const mockCredentialsService = {
      getDecryptedCredentials: jest.fn(),
    }

    const mockMetricsService = {
      recordRequest: jest.fn(),
      recordLatency: jest.fn(),
      setRateLimitRemaining: jest.fn(),
      setCircuitBreakerState: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalApiRegistryService,
        { provide: ApiCredentialsService, useValue: mockCredentialsService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile()

    service = module.get<ExternalApiRegistryService>(ExternalApiRegistryService)
    credentialsService = module.get(ApiCredentialsService)
    metricsService = module.get(MetricsService)
  })

  describe('registerProvider', () => {
    it('should register a provider and load credentials immediately', async () => {
      const mockProvider = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      credentialsService.getDecryptedCredentials.mockResolvedValue({ rapidApiKey: 'test-key' })

      await service.registerProvider(mockProvider, 1)

      // Verify credentials were loaded
      expect(credentialsService.getDecryptedCredentials).toHaveBeenCalledWith('aerodatabox')
      expect(mockProvider.setCredentials).toHaveBeenCalledWith({ rapidApiKey: 'test-key' })
    })

    it('should handle missing credentials gracefully', async () => {
      const mockProvider = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      credentialsService.getDecryptedCredentials.mockResolvedValue(null)

      await service.registerProvider(mockProvider, 1)

      // Should not throw, but provider won't have credentials
      expect(mockProvider.setCredentials).not.toHaveBeenCalled()
    })

    it('should rebuild active provider lists after registration', async () => {
      const mockProvider = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      credentialsService.getDecryptedCredentials.mockResolvedValue({ rapidApiKey: 'test-key' })

      await service.registerProvider(mockProvider, 1)

      // Provider should now be in the fallback chain
      const chain = service.getFallbackChain(ApiCategory.FLIGHTS)
      expect(chain).toContain('aerodatabox')
    })
  })

  describe('getProvider', () => {
    beforeEach(async () => {
      const mockProvider = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      credentialsService.getDecryptedCredentials.mockResolvedValue({ rapidApiKey: 'test-key' })
      await service.registerProvider(mockProvider, 1)
    })

    it('should return provider by name when credentials exist', async () => {
      const provider = await service.getProvider(ApiCategory.FLIGHTS, 'aerodatabox')
      expect(provider).not.toBeNull()
      expect(provider?.config.provider).toBe('aerodatabox')
    })

    it('should return default provider when no name specified', async () => {
      const provider = await service.getProvider(ApiCategory.FLIGHTS)
      expect(provider).not.toBeNull()
      expect(provider?.config.provider).toBe('aerodatabox')
    })

    it('should return null for unknown provider', async () => {
      const provider = await service.getProvider(ApiCategory.FLIGHTS, 'unknown')
      expect(provider).toBeNull()
    })

    it('should return null when provider has no credentials', async () => {
      const mockProvider2 = createMockProvider('amadeus', ApiCategory.FLIGHTS)
      credentialsService.getDecryptedCredentials.mockResolvedValue(null)
      await service.registerProvider(mockProvider2, 2)

      const provider = await service.getProvider(ApiCategory.FLIGHTS, 'amadeus')
      expect(provider).toBeNull()
    })
  })

  describe('getFallbackChain', () => {
    it('should return providers sorted by priority', async () => {
      const provider1 = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      const provider2 = createMockProvider('amadeus', ApiCategory.FLIGHTS)

      credentialsService.getDecryptedCredentials.mockResolvedValue({ key: 'test' })

      await service.registerProvider(provider1, 2)
      await service.registerProvider(provider2, 1)

      const chain = service.getFallbackChain(ApiCategory.FLIGHTS)
      expect(chain).toEqual(['amadeus', 'aerodatabox']) // Lower priority first
    })

    it('should use alphabetical order as tie-breaker', async () => {
      const provider1 = createMockProvider('beta', ApiCategory.FLIGHTS)
      const provider2 = createMockProvider('alpha', ApiCategory.FLIGHTS)

      credentialsService.getDecryptedCredentials.mockResolvedValue({ key: 'test' })

      await service.registerProvider(provider1, 1)
      await service.registerProvider(provider2, 1)

      const chain = service.getFallbackChain(ApiCategory.FLIGHTS)
      expect(chain).toEqual(['alpha', 'beta']) // Alphabetical for same priority
    })

    it('should exclude providers without credentials', async () => {
      const provider1 = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      const provider2 = createMockProvider('amadeus', ApiCategory.FLIGHTS)

      credentialsService.getDecryptedCredentials
        .mockResolvedValueOnce({ key: 'test' }) // aerodatabox
        .mockResolvedValueOnce(null) // amadeus - no credentials

      await service.registerProvider(provider1, 1)
      await service.registerProvider(provider2, 2)

      const chain = service.getFallbackChain(ApiCategory.FLIGHTS)
      expect(chain).toEqual(['aerodatabox'])
      expect(chain).not.toContain('amadeus')
    })
  })

  describe('tryWithFallback', () => {
    it('should try primary provider first and return on success', async () => {
      const provider1 = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      credentialsService.getDecryptedCredentials.mockResolvedValue({ key: 'test' })
      await service.registerProvider(provider1, 1)

      const operation = jest.fn().mockResolvedValue({ data: 'success' })
      const result = await service.tryWithFallback(ApiCategory.FLIGHTS, operation)

      expect(result).toEqual({ data: 'success' })
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should fallback to next provider on failure', async () => {
      const provider1 = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      const provider2 = createMockProvider('amadeus', ApiCategory.FLIGHTS)

      credentialsService.getDecryptedCredentials.mockResolvedValue({ key: 'test' })
      await service.registerProvider(provider1, 1)
      await service.registerProvider(provider2, 2)

      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce({ data: 'fallback success' })

      const result = await service.tryWithFallback(ApiCategory.FLIGHTS, operation)

      expect(result).toEqual({ data: 'fallback success' })
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should record fallback success metric', async () => {
      const provider1 = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      const provider2 = createMockProvider('amadeus', ApiCategory.FLIGHTS)

      credentialsService.getDecryptedCredentials.mockResolvedValue({ key: 'test' })
      await service.registerProvider(provider1, 1)
      await service.registerProvider(provider2, 2)

      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce({ data: 'success' })

      await service.tryWithFallback(ApiCategory.FLIGHTS, operation)

      // Should record error for first provider
      expect(metricsService.recordRequest).toHaveBeenCalledWith('aerodatabox', '_fallback', 'error')
      // Should record fallback success for second provider
      expect(metricsService.recordRequest).toHaveBeenCalledWith('amadeus', '_fallback', 'fallback')
    })

    it('should return null when all providers fail', async () => {
      const provider1 = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)

      credentialsService.getDecryptedCredentials.mockResolvedValue({ key: 'test' })
      await service.registerProvider(provider1, 1)

      const operation = jest.fn().mockRejectedValue(new Error('All failed'))
      const result = await service.tryWithFallback(ApiCategory.FLIGHTS, operation)

      expect(result).toBeNull()
    })
  })

  describe('refreshCredentials', () => {
    it('should reload credentials and rebuild active lists', async () => {
      const mockProvider = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      credentialsService.getDecryptedCredentials.mockResolvedValue(null) // No credentials initially
      await service.registerProvider(mockProvider, 1)

      // Initially no providers in chain
      expect(service.getFallbackChain(ApiCategory.FLIGHTS)).toEqual([])

      // Now credentials become available
      credentialsService.getDecryptedCredentials.mockResolvedValue({ key: 'new-key' })
      await service.refreshCredentials('aerodatabox')

      // Provider should now be in chain
      expect(service.getFallbackChain(ApiCategory.FLIGHTS)).toContain('aerodatabox')
      expect(mockProvider.setCredentials).toHaveBeenCalledWith({ key: 'new-key' })
    })
  })

  describe('setProviderActive', () => {
    it('should exclude inactive providers from fallback chain', async () => {
      const mockProvider = createMockProvider('aerodatabox', ApiCategory.FLIGHTS)
      credentialsService.getDecryptedCredentials.mockResolvedValue({ key: 'test' })
      await service.registerProvider(mockProvider, 1)

      expect(service.getFallbackChain(ApiCategory.FLIGHTS)).toContain('aerodatabox')

      service.setProviderActive('aerodatabox', false)

      expect(service.getFallbackChain(ApiCategory.FLIGHTS)).not.toContain('aerodatabox')
    })
  })
})
