/**
 * Storage Provider Factory
 *
 * Factory for creating storage provider instances with lazy-loading and error handling.
 * Providers are instantiated only when first requested, and errors are handled gracefully
 * to prevent service startup failures.
 *
 * Supports multiple buckets per provider (e.g., documents vs media buckets).
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiProvider, StorageCredentials } from '@tailfire/shared-types'
import { ApiCredentialsService } from '../../api-credentials/api-credentials.service'
import { StorageProvider } from './storage-provider.interface'
import { SupabaseStorageProvider } from './supabase-storage.provider'
import { CloudflareR2Provider } from './cloudflare-r2.provider'
import { BackblazeB2Provider } from './backblaze-b2.provider'

/**
 * Storage bucket types
 */
export type StorageBucketType = 'documents' | 'media'

/**
 * Provider initialization error
 */
export class ProviderInitializationError extends Error {
  constructor(
    public readonly provider: ApiProvider,
    message: string,
    public readonly originalError?: Error
  ) {
    super(`[${provider}] ${message}`)
    this.name = 'ProviderInitializationError'
  }
}

/**
 * Storage Provider Factory
 *
 * Responsible for:
 * - Lazy-loading storage provider instances
 * - Caching initialized providers
 * - Multi-bucket support (documents vs media)
 * - Graceful error handling (no crash on misconfiguration)
 * - Retrieving active credentials from ApiCredentialsService
 */
@Injectable()
export class StorageProviderFactory {
  private readonly logger = new Logger(StorageProviderFactory.name)
  // Cache key format: "{provider}:{bucket}" e.g., "cloudflare_r2:documents"
  private readonly providerCache = new Map<string, StorageProvider>()
  private readonly errorCache = new Map<string, ProviderInitializationError>()

  // Bucket configuration
  private readonly documentsBucket: string
  private readonly mediaBucket: string
  private readonly mediaPublicUrl: string

  constructor(
    private readonly configService: ConfigService,
    private readonly apiCredentialsService: ApiCredentialsService
  ) {
    // Configure bucket names from environment
    this.documentsBucket = this.configService.get<string>('R2_DOCUMENTS_BUCKET') || 'tailfire-documents'
    this.mediaBucket = this.configService.get<string>('R2_MEDIA_BUCKET') || 'tailfire-media'
    this.mediaPublicUrl = this.configService.get<string>('R2_MEDIA_PUBLIC_URL') ||
      'https://pub-0ab7614dd4094206aa5c733bea70d570.r2.dev'

    this.logger.log(`StorageProviderFactory initialized`)
    this.logger.log(`  Documents bucket: ${this.documentsBucket}`)
    this.logger.log(`  Media bucket: ${this.mediaBucket}`)
    this.logger.log(`  Media public URL: ${this.mediaPublicUrl}`)

    // Warn if using default bucket names (indicates missing configuration)
    if (!this.configService.get<string>('R2_DOCUMENTS_BUCKET')) {
      this.logger.warn('R2_DOCUMENTS_BUCKET not configured, using default: tailfire-documents')
    }
    if (!this.configService.get<string>('R2_MEDIA_BUCKET')) {
      this.logger.warn('R2_MEDIA_BUCKET not configured, using default: tailfire-media')
    }
    if (!this.configService.get<string>('R2_MEDIA_PUBLIC_URL')) {
      this.logger.warn('R2_MEDIA_PUBLIC_URL not configured, using default public URL')
    }
  }

  /**
   * Validate that bucket configuration exists for a bucket type
   * @throws Error if configuration is missing
   */
  validateBucketConfig(bucketType: StorageBucketType): void {
    if (bucketType === 'media') {
      const mediaUrl = this.configService.get<string>('R2_MEDIA_PUBLIC_URL')
      if (!mediaUrl) {
        throw new Error(
          'Media bucket public URL not configured. Set R2_MEDIA_PUBLIC_URL environment variable. ' +
          'This is required for generating public URLs for media files.'
        )
      }
    }
  }

  /**
   * Check if bucket configuration is complete
   */
  isBucketConfigured(bucketType: StorageBucketType): boolean {
    if (bucketType === 'documents') {
      return !!this.configService.get<string>('R2_DOCUMENTS_BUCKET')
    }
    return !!(
      this.configService.get<string>('R2_MEDIA_BUCKET') &&
      this.configService.get<string>('R2_MEDIA_PUBLIC_URL')
    )
  }

  /**
   * Get the public URL for a media file
   */
  getMediaPublicUrl(path: string): string {
    return `${this.mediaPublicUrl}/${path}`
  }

  /**
   * Get bucket name for a bucket type
   */
  getBucketName(bucketType: StorageBucketType): string {
    return bucketType === 'media' ? this.mediaBucket : this.documentsBucket
  }

  /**
   * Get or create a storage provider instance
   *
   * @param provider - Provider type to instantiate
   * @param bucketType - Bucket type (documents or media), defaults to documents
   * @returns StorageProvider instance
   * @throws ProviderInitializationError if provider cannot be initialized
   */
  async getProvider(
    provider: ApiProvider,
    bucketType: StorageBucketType = 'documents'
  ): Promise<StorageProvider> {
    const cacheKey = `${provider}:${bucketType}`

    // Return cached provider if available
    if (this.providerCache.has(cacheKey)) {
      this.logger.debug(`Returning cached provider: ${cacheKey}`)
      return this.providerCache.get(cacheKey)!
    }

    // Return cached error if initialization previously failed
    if (this.errorCache.has(cacheKey)) {
      throw this.errorCache.get(cacheKey)!
    }

    // Attempt to initialize provider
    try {
      this.logger.log(`Initializing storage provider: ${cacheKey}`)
      const instance = await this.createProvider(provider, bucketType)
      this.providerCache.set(cacheKey, instance)
      this.logger.log(`Successfully initialized provider: ${cacheKey}`)
      return instance
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      const initError = new ProviderInitializationError(
        provider,
        `Failed to initialize provider: ${errorMessage}`,
        error instanceof Error ? error : undefined
      )
      this.errorCache.set(cacheKey, initError)
      this.logger.error(initError.message, errorStack)
      throw initError
    }
  }

  /**
   * Create a storage provider instance
   *
   * @param provider - Provider type
   * @param bucketType - Bucket type (documents or media)
   * @returns StorageProvider instance
   * @throws Error if credentials are invalid or provider type is unknown
   */
  private async createProvider(
    provider: ApiProvider,
    bucketType: StorageBucketType
  ): Promise<StorageProvider> {
    // Fetch active credentials from API Credentials Manager
    const credentials = await this.apiCredentialsService.getActiveCredentials(provider) as StorageCredentials

    if (!credentials) {
      throw new Error(`No active credentials found for provider: ${provider}`)
    }

    // Get the appropriate bucket name based on bucket type
    const bucketName = this.getBucketName(bucketType)

    // Instantiate provider based on type
    switch (provider) {
      case ApiProvider.SUPABASE_STORAGE:
        if (!('url' in credentials && 'serviceRoleKey' in credentials)) {
          throw new Error('Invalid Supabase Storage credentials: missing url or serviceRoleKey')
        }
        return new SupabaseStorageProvider(credentials, bucketName)

      case ApiProvider.CLOUDFLARE_R2:
        if (!('accountId' in credentials && 'accessKeyId' in credentials && 'secretAccessKey' in credentials)) {
          throw new Error('Invalid Cloudflare R2 credentials: missing required fields')
        }
        // For R2, use the configured bucket name based on bucket type
        return new CloudflareR2Provider(credentials, bucketName)

      case ApiProvider.BACKBLAZE_B2:
        if (!('keyId' in credentials && 'applicationKey' in credentials && 'endpoint' in credentials)) {
          throw new Error('Invalid Backblaze B2 credentials: missing required fields')
        }
        // For B2, use the configured bucket name based on bucket type
        return new BackblazeB2Provider(credentials, bucketName)

      default:
        throw new Error(`Unknown storage provider: ${provider}`)
    }
  }

  /**
   * Get active provider for documents (the currently configured storage provider)
   *
   * Returns the provider for the active credential using the documents bucket.
   *
   * @returns StorageProvider instance for documents storage
   * @throws ProviderInitializationError if no active provider is configured
   */
  async getActiveProvider(): Promise<StorageProvider> {
    return this.getActiveProviderForBucket('documents')
  }

  /**
   * Get active provider for media (public storage)
   *
   * Returns the provider for the active credential using the media bucket.
   *
   * @returns StorageProvider instance for media storage
   * @throws ProviderInitializationError if no active provider is configured
   */
  async getMediaProvider(): Promise<StorageProvider> {
    return this.getActiveProviderForBucket('media')
  }

  /**
   * Get active provider for a specific bucket type
   *
   * @param bucketType - Bucket type (documents or media)
   * @returns StorageProvider instance
   * @throws ProviderInitializationError if no active provider is configured
   */
  private async getActiveProviderForBucket(bucketType: StorageBucketType): Promise<StorageProvider> {
    // Try providers in order of preference
    const providerPriority = [
      ApiProvider.CLOUDFLARE_R2,
      ApiProvider.BACKBLAZE_B2,
      ApiProvider.SUPABASE_STORAGE,
    ]

    for (const provider of providerPriority) {
      try {
        return await this.getProvider(provider, bucketType)
      } catch (error) {
        // Continue to next provider if this one fails
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.logger.debug(`Provider ${provider} not available for ${bucketType}: ${errorMessage}`)
        continue
      }
    }

    throw new ProviderInitializationError(
      ApiProvider.SUPABASE_STORAGE, // Default to Supabase for error message
      `No active storage provider configured for ${bucketType}. Please configure storage credentials via the admin panel.`
    )
  }

  /**
   * Clear cached provider instance
   *
   * Call this after credential rotation to force re-initialization
   *
   * @param provider - Provider to clear (or all if not specified)
   * @param bucketType - Bucket type to clear (or all if not specified)
   */
  clearCache(provider?: ApiProvider, bucketType?: StorageBucketType): void {
    if (provider && bucketType) {
      // Clear specific provider + bucket combination
      const cacheKey = `${provider}:${bucketType}`
      this.providerCache.delete(cacheKey)
      this.errorCache.delete(cacheKey)
      this.logger.log(`Cleared cache for: ${cacheKey}`)
    } else if (provider) {
      // Clear all bucket types for this provider
      for (const bt of ['documents', 'media'] as StorageBucketType[]) {
        const cacheKey = `${provider}:${bt}`
        this.providerCache.delete(cacheKey)
        this.errorCache.delete(cacheKey)
      }
      this.logger.log(`Cleared cache for provider: ${provider} (all buckets)`)
    } else {
      this.providerCache.clear()
      this.errorCache.clear()
      this.logger.log('Cleared all provider cache')
    }
  }

  /**
   * Check if a provider is available (has active credentials)
   *
   * @param provider - Provider to check
   * @returns True if provider can be initialized
   */
  async isProviderAvailable(provider: ApiProvider): Promise<boolean> {
    try {
      await this.getProvider(provider)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * List all available providers
   *
   * @returns Array of provider types that have active credentials
   */
  async listAvailableProviders(): Promise<ApiProvider[]> {
    const providers = [
      ApiProvider.SUPABASE_STORAGE,
      ApiProvider.CLOUDFLARE_R2,
      ApiProvider.BACKBLAZE_B2,
    ]

    const available: ApiProvider[] = []

    for (const provider of providers) {
      if (await this.isProviderAvailable(provider)) {
        available.push(provider)
      }
    }

    return available
  }
}
