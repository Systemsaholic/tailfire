/**
 * Unit tests for StorageProviderFactory
 */

import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { StorageProviderFactory, ProviderInitializationError } from '../storage-provider.factory'
import { ApiCredentialsService } from '../../../api-credentials/api-credentials.service'
import { ApiProvider } from '@tailfire/shared-types'
import type {
  SupabaseStorageCredentials,
  CloudflareR2Credentials,
  BackblazeB2Credentials,
} from '@tailfire/shared-types'

describe('StorageProviderFactory', () => {
  let factory: StorageProviderFactory
  let apiCredentialsService: jest.Mocked<ApiCredentialsService>
  let configService: jest.Mocked<ConfigService>

  const mockSupabaseCredentials: SupabaseStorageCredentials = {
    url: 'https://test-project.supabase.co',
    serviceRoleKey: 'mock-service-role-key',
  }

  const mockR2Credentials: CloudflareR2Credentials = {
    accountId: 'test-account-id',
    accessKeyId: 'test-access-key-id',
    secretAccessKey: 'test-secret-access-key',
    bucketName: 'test-r2-bucket',
  }

  const mockB2Credentials: BackblazeB2Credentials = {
    keyId: 'test-key-id',
    applicationKey: 'test-application-key',
    bucketName: 'test-b2-bucket',
    endpoint: 'https://s3.us-west-002.backblazeb2.com',
  }

  beforeEach(async () => {
    // Create mock services
    const mockApiCredentialsService = {
      getActiveCredentials: jest.fn(),
      clearCache: jest.fn(),
    }

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-bucket'),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageProviderFactory,
        {
          provide: ApiCredentialsService,
          useValue: mockApiCredentialsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    factory = module.get<StorageProviderFactory>(StorageProviderFactory)
    apiCredentialsService = module.get(ApiCredentialsService)
    configService = module.get(ConfigService)
  })

  afterEach(() => {
    jest.clearAllMocks()
    factory.clearCache()
  })

  describe('initialization', () => {
    it('should initialize with bucket names from config', () => {
      // Factory now uses separate bucket configs for documents and media
      expect(configService.get).toHaveBeenCalledWith('R2_DOCUMENTS_BUCKET')
      expect(configService.get).toHaveBeenCalledWith('R2_MEDIA_BUCKET')
      expect(configService.get).toHaveBeenCalledWith('R2_MEDIA_PUBLIC_URL')
    })

    it('should use default bucket name if config is missing', async () => {
      configService.get.mockReturnValue(undefined)

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageProviderFactory,
          {
            provide: ApiCredentialsService,
            useValue: apiCredentialsService,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile()

      const newFactory = module.get<StorageProviderFactory>(StorageProviderFactory)
      expect(newFactory).toBeDefined()
    })
  })

  describe('getProvider', () => {
    describe('Supabase Storage', () => {
      beforeEach(() => {
        apiCredentialsService.getActiveCredentials.mockResolvedValue(mockSupabaseCredentials)
      })

      it('should create Supabase provider successfully', async () => {
        const provider = await factory.getProvider(ApiProvider.SUPABASE_STORAGE)

        expect(provider).toBeDefined()
        expect(provider.provider).toBe(ApiProvider.SUPABASE_STORAGE)
        expect(apiCredentialsService.getActiveCredentials).toHaveBeenCalledWith(
          ApiProvider.SUPABASE_STORAGE
        )
      })

      it('should cache provider instance', async () => {
        const provider1 = await factory.getProvider(ApiProvider.SUPABASE_STORAGE)
        const provider2 = await factory.getProvider(ApiProvider.SUPABASE_STORAGE)

        expect(provider1).toBe(provider2)
        expect(apiCredentialsService.getActiveCredentials).toHaveBeenCalledTimes(1)
      })

      it('should throw error for invalid credentials', async () => {
        apiCredentialsService.getActiveCredentials.mockResolvedValue({
          url: 'https://test.supabase.co',
          // Missing serviceRoleKey
        } as any)

        await expect(factory.getProvider(ApiProvider.SUPABASE_STORAGE)).rejects.toThrow(
          ProviderInitializationError
        )
      })
    })

    describe('Cloudflare R2', () => {
      beforeEach(() => {
        apiCredentialsService.getActiveCredentials.mockResolvedValue(mockR2Credentials)
      })

      it('should create R2 provider successfully', async () => {
        const provider = await factory.getProvider(ApiProvider.CLOUDFLARE_R2)

        expect(provider).toBeDefined()
        expect(provider.provider).toBe(ApiProvider.CLOUDFLARE_R2)
        expect(apiCredentialsService.getActiveCredentials).toHaveBeenCalledWith(
          ApiProvider.CLOUDFLARE_R2
        )
      })

      it('should throw error for invalid credentials', async () => {
        apiCredentialsService.getActiveCredentials.mockResolvedValue({
          accountId: 'test-account',
          // Missing other required fields
        } as any)

        await expect(factory.getProvider(ApiProvider.CLOUDFLARE_R2)).rejects.toThrow(
          ProviderInitializationError
        )
      })
    })

    describe('Backblaze B2', () => {
      beforeEach(() => {
        apiCredentialsService.getActiveCredentials.mockResolvedValue(mockB2Credentials)
      })

      it('should create B2 provider successfully', async () => {
        const provider = await factory.getProvider(ApiProvider.BACKBLAZE_B2)

        expect(provider).toBeDefined()
        expect(provider.provider).toBe(ApiProvider.BACKBLAZE_B2)
        expect(apiCredentialsService.getActiveCredentials).toHaveBeenCalledWith(
          ApiProvider.BACKBLAZE_B2
        )
      })

      it('should throw error for invalid credentials', async () => {
        apiCredentialsService.getActiveCredentials.mockResolvedValue({
          keyId: 'test-key-id',
          // Missing other required fields
        } as any)

        await expect(factory.getProvider(ApiProvider.BACKBLAZE_B2)).rejects.toThrow(
          ProviderInitializationError
        )
      })
    })

    it('should cache initialization errors', async () => {
      apiCredentialsService.getActiveCredentials.mockRejectedValue(
        new Error('No active credentials')
      )

      await expect(factory.getProvider(ApiProvider.SUPABASE_STORAGE)).rejects.toThrow(
        ProviderInitializationError
      )

      // Second call should throw cached error without calling service again
      await expect(factory.getProvider(ApiProvider.SUPABASE_STORAGE)).rejects.toThrow(
        ProviderInitializationError
      )

      expect(apiCredentialsService.getActiveCredentials).toHaveBeenCalledTimes(1)
    })

    it('should throw error for unknown provider', async () => {
      apiCredentialsService.getActiveCredentials.mockResolvedValue({} as any)

      await expect(
        factory.getProvider('unknown-provider' as ApiProvider)
      ).rejects.toThrow(ProviderInitializationError)
    })
  })

  describe('getActiveProvider', () => {
    it('should return first available provider (R2)', async () => {
      apiCredentialsService.getActiveCredentials.mockImplementation(async (provider) => {
        if (provider === ApiProvider.CLOUDFLARE_R2) {
          return mockR2Credentials
        }
        throw new Error('No credentials')
      })

      const provider = await factory.getActiveProvider()

      expect(provider.provider).toBe(ApiProvider.CLOUDFLARE_R2)
    })

    it('should fallback to next provider if first fails', async () => {
      apiCredentialsService.getActiveCredentials.mockImplementation(async (provider) => {
        if (provider === ApiProvider.CLOUDFLARE_R2) {
          throw new Error('No credentials')
        }
        if (provider === ApiProvider.BACKBLAZE_B2) {
          return mockB2Credentials
        }
        throw new Error('No credentials')
      })

      const provider = await factory.getActiveProvider()

      expect(provider.provider).toBe(ApiProvider.BACKBLAZE_B2)
    })

    it('should throw error if no providers are available', async () => {
      apiCredentialsService.getActiveCredentials.mockRejectedValue(
        new Error('No credentials')
      )

      await expect(factory.getActiveProvider()).rejects.toThrow(
        'No active storage provider configured'
      )
    })
  })

  describe('clearCache', () => {
    beforeEach(async () => {
      apiCredentialsService.getActiveCredentials.mockResolvedValue(mockSupabaseCredentials)
      await factory.getProvider(ApiProvider.SUPABASE_STORAGE)
    })

    it('should clear cache for specific provider', async () => {
      factory.clearCache(ApiProvider.SUPABASE_STORAGE)

      // Should fetch credentials again after cache clear
      await factory.getProvider(ApiProvider.SUPABASE_STORAGE)

      expect(apiCredentialsService.getActiveCredentials).toHaveBeenCalledTimes(2)
    })

    it('should clear all provider caches', async () => {
      apiCredentialsService.getActiveCredentials.mockResolvedValue(mockR2Credentials)
      await factory.getProvider(ApiProvider.CLOUDFLARE_R2)

      factory.clearCache()

      // Should fetch credentials again for both providers
      apiCredentialsService.getActiveCredentials.mockResolvedValue(mockSupabaseCredentials)
      await factory.getProvider(ApiProvider.SUPABASE_STORAGE)

      apiCredentialsService.getActiveCredentials.mockResolvedValue(mockR2Credentials)
      await factory.getProvider(ApiProvider.CLOUDFLARE_R2)

      expect(apiCredentialsService.getActiveCredentials).toHaveBeenCalledTimes(4)
    })

    it('should clear error cache', async () => {
      apiCredentialsService.getActiveCredentials.mockRejectedValue(
        new Error('No credentials')
      )

      await expect(factory.getProvider(ApiProvider.CLOUDFLARE_R2)).rejects.toThrow()

      // Clear cache
      factory.clearCache(ApiProvider.CLOUDFLARE_R2)

      // Now make it succeed
      apiCredentialsService.getActiveCredentials.mockResolvedValue(mockR2Credentials)

      const provider = await factory.getProvider(ApiProvider.CLOUDFLARE_R2)
      expect(provider).toBeDefined()
    })
  })

  describe('isProviderAvailable', () => {
    it('should return true for available provider', async () => {
      apiCredentialsService.getActiveCredentials.mockResolvedValue(mockSupabaseCredentials)

      const available = await factory.isProviderAvailable(ApiProvider.SUPABASE_STORAGE)

      expect(available).toBe(true)
    })

    it('should return false for unavailable provider', async () => {
      apiCredentialsService.getActiveCredentials.mockRejectedValue(
        new Error('No credentials')
      )

      const available = await factory.isProviderAvailable(ApiProvider.SUPABASE_STORAGE)

      expect(available).toBe(false)
    })
  })

  describe('listAvailableProviders', () => {
    it('should return all available providers', async () => {
      apiCredentialsService.getActiveCredentials.mockImplementation(async (provider) => {
        switch (provider) {
          case ApiProvider.SUPABASE_STORAGE:
            return mockSupabaseCredentials
          case ApiProvider.CLOUDFLARE_R2:
            return mockR2Credentials
          case ApiProvider.BACKBLAZE_B2:
            return mockB2Credentials
          default:
            throw new Error('No credentials')
        }
      })

      const providers = await factory.listAvailableProviders()

      expect(providers).toHaveLength(3)
      expect(providers).toContain(ApiProvider.SUPABASE_STORAGE)
      expect(providers).toContain(ApiProvider.CLOUDFLARE_R2)
      expect(providers).toContain(ApiProvider.BACKBLAZE_B2)
    })

    it('should return only available providers', async () => {
      apiCredentialsService.getActiveCredentials.mockImplementation(async (provider) => {
        if (provider === ApiProvider.CLOUDFLARE_R2) {
          return mockR2Credentials
        }
        throw new Error('No credentials')
      })

      const providers = await factory.listAvailableProviders()

      expect(providers).toHaveLength(1)
      expect(providers).toContain(ApiProvider.CLOUDFLARE_R2)
    })

    it('should return empty array if no providers are available', async () => {
      apiCredentialsService.getActiveCredentials.mockRejectedValue(
        new Error('No credentials')
      )

      const providers = await factory.listAvailableProviders()

      expect(providers).toHaveLength(0)
    })
  })

  describe('ProviderInitializationError', () => {
    it('should create error with correct properties', () => {
      const originalError = new Error('Original error')
      const error = new ProviderInitializationError(
        ApiProvider.SUPABASE_STORAGE,
        'Test error',
        originalError
      )

      expect(error.name).toBe('ProviderInitializationError')
      expect(error.provider).toBe(ApiProvider.SUPABASE_STORAGE)
      expect(error.message).toContain('supabase_storage')
      expect(error.message).toContain('Test error')
      expect(error.originalError).toBe(originalError)
    })

    it('should work without original error', () => {
      const error = new ProviderInitializationError(
        ApiProvider.CLOUDFLARE_R2,
        'Test error'
      )

      expect(error.originalError).toBeUndefined()
      expect(error.message).toContain('cloudflare_r2')
    })
  })
})
