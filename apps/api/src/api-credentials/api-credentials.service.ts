import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { eq, and } from 'drizzle-orm'
import { ZodError } from 'zod'
import { DatabaseService } from '../db/database.service'
import { EncryptionService, EncryptedData } from '../common/encryption'
import { schema } from '@tailfire/database'
import { ConnectionTestResult } from '../storage/providers'
import { SupabaseStorageProvider } from '../storage/providers/supabase-storage.provider'
import { CloudflareR2Provider } from '../storage/providers/cloudflare-r2.provider'
import { BackblazeB2Provider } from '../storage/providers/backblaze-b2.provider'
import {
  CreateCredentialDto,
  UpdateCredentialDto,
  RotateCredentialDto,
  CredentialMetadataDto,
  CredentialSecretsDto,
  ApiProvider,
  validateCredentials,
  getValidationErrors,
  ProviderMetadataDto,
  PROVIDER_METADATA,
} from './dto'
import type {
  SupabaseStorageCredentials,
  CloudflareR2Credentials,
  BackblazeB2Credentials,
} from '@tailfire/shared-types'

const { apiCredentials } = schema

/**
 * Cache entry for decrypted credentials
 */
interface CachedCredential {
  credentials: Record<string, any>
  cachedAt: number
}

/**
 * ApiCredentialsService
 *
 * Manages API credentials with encryption, versioning, and rotation support.
 * Implements in-memory caching with 5-minute TTL for decrypted credentials.
 */
@Injectable()
export class ApiCredentialsService {
  private readonly logger = new Logger(ApiCredentialsService.name)
  private readonly credentialCache = new Map<ApiProvider, CachedCredential>()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  constructor(
    private readonly db: DatabaseService,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Create a new API credential
   */
  async create(dto: CreateCredentialDto): Promise<CredentialMetadataDto> {
    this.logger.log(`Creating new credential for provider: ${dto.provider}`)

    // Validate credentials before encryption
    try {
      validateCredentials(dto.provider, dto.credentials)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = getValidationErrors(error)
        throw new BadRequestException(
          `Invalid credentials for provider ${dto.provider}: ${errors.join(', ')}`
        )
      }
      throw error
    }

    // Check if there's already an active credential for this provider
    const existing = await this.db.client.query.apiCredentials.findFirst({
      where: and(
        eq(apiCredentials.provider, dto.provider),
        eq(apiCredentials.isActive, true)
      )
    })

    if (existing) {
      throw new BadRequestException(
        `An active credential already exists for provider ${dto.provider}. ` +
        `Use rotation to update or deactivate the existing credential first.`
      )
    }

    // Encrypt the credentials
    const encrypted = this.encryption.encryptObject(dto.credentials)

    // Insert into database
    const [created] = await this.db.client
      .insert(apiCredentials)
      .values({
        provider: dto.provider,
        name: dto.name,
        encryptedCredentials: encrypted as any,
        version: 1,
        isActive: true,
        status: 'active',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      })
      .returning()

    this.logger.log(`Credential created successfully: ${created!.id}`)

    // Clear cache since we have a new credential
    this.clearCache(dto.provider)

    return this.toMetadataDto(created)
  }

  /**
   * Find all credentials (metadata only)
   */
  async findAll(): Promise<CredentialMetadataDto[]> {
    const credentials = await this.db.client.query.apiCredentials.findMany({
      orderBy: (creds, { desc }) => [desc(creds.createdAt)]
    })

    return credentials.map(c => this.toMetadataDto(c))
  }

  /**
   * Find one credential by ID (metadata only)
   */
  async findOne(id: string): Promise<CredentialMetadataDto> {
    const credential = await this.db.client.query.apiCredentials.findFirst({
      where: eq(apiCredentials.id, id)
    })

    if (!credential) {
      throw new NotFoundException(`Credential with ID ${id} not found`)
    }

    return this.toMetadataDto(credential)
  }

  /**
   * Reveal decrypted credentials (use sparingly!)
   */
  async reveal(id: string): Promise<CredentialSecretsDto> {
    const credential = await this.db.client.query.apiCredentials.findFirst({
      where: eq(apiCredentials.id, id)
    })

    if (!credential) {
      throw new NotFoundException(`Credential with ID ${id} not found`)
    }

    // Decrypt credentials
    const decrypted = this.encryption.decryptObject<Record<string, any>>(
      credential.encryptedCredentials as EncryptedData
    )

    return {
      ...this.toMetadataDto(credential),
      credentials: decrypted,
    }
  }

  /**
   * Update credential metadata (not the credentials themselves)
   */
  async update(id: string, dto: UpdateCredentialDto): Promise<CredentialMetadataDto> {
    this.logger.log(`Updating credential ${id}`)

    const existing = await this.db.client.query.apiCredentials.findFirst({
      where: eq(apiCredentials.id, id)
    })

    if (!existing) {
      throw new NotFoundException(`Credential with ID ${id} not found`)
    }

    const [updated] = await this.db.client
      .update(apiCredentials)
      .set({
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status }),
        ...(dto.expiresAt && { expiresAt: new Date(dto.expiresAt) }),
        updatedAt: new Date(),
      })
      .where(eq(apiCredentials.id, id))
      .returning()

    return this.toMetadataDto(updated)
  }

  /**
   * Rotate credentials - creates new version with parent_id set
   */
  async rotate(id: string, dto: RotateCredentialDto): Promise<CredentialMetadataDto> {
    this.logger.log(`Rotating credential ${id}`)

    const current = await this.db.client.query.apiCredentials.findFirst({
      where: eq(apiCredentials.id, id)
    })

    if (!current) {
      throw new NotFoundException(`Credential with ID ${id} not found`)
    }

    if (!current.isActive) {
      throw new BadRequestException(`Cannot rotate inactive credential ${id}`)
    }

    // Validate new credentials before encryption
    try {
      validateCredentials(current.provider as ApiProvider, dto.credentials)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = getValidationErrors(error)
        throw new BadRequestException(
          `Invalid credentials for provider ${current.provider}: ${errors.join(', ')}`
        )
      }
      throw error
    }

    // Encrypt new credentials
    const encrypted = this.encryption.encryptObject(dto.credentials)

    // Begin transaction-like operations
    // 1. Mark current credential as inactive
    await this.db.client
      .update(apiCredentials)
      .set({
        isActive: false,
        lastRotatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(apiCredentials.id, id))

    // 2. Create new credential version
    const [newCredential] = await this.db.client
      .insert(apiCredentials)
      .values({
        parentId: id,
        provider: current.provider,
        name: current.name,
        encryptedCredentials: encrypted as any,
        version: current.version + 1,
        isActive: true,
        status: 'active',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : current.expiresAt,
      })
      .returning()

    // Clear cache
    this.clearCache(current.provider as ApiProvider)

    this.logger.log(`Rotated credential ${id} to new version ${newCredential!.id}`)

    return this.toMetadataDto(newCredential)
  }

  /**
   * Rollback to a specific version (flips is_active flags)
   */
  async rollback(id: string): Promise<CredentialMetadataDto> {
    this.logger.log(`Rolling back to credential ${id}`)

    const target = await this.db.client.query.apiCredentials.findFirst({
      where: eq(apiCredentials.id, id)
    })

    if (!target) {
      throw new NotFoundException(`Credential with ID ${id} not found`)
    }

    if (target.isActive) {
      throw new BadRequestException(`Credential ${id} is already active`)
    }

    // Find currently active credential for this provider
    const current = await this.db.client.query.apiCredentials.findFirst({
      where: and(
        eq(apiCredentials.provider, target.provider),
        eq(apiCredentials.isActive, true)
      )
    })

    if (current) {
      // Deactivate current
      await this.db.client
        .update(apiCredentials)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(apiCredentials.id, current.id))
    }

    // Activate target
    const [activated] = await this.db.client
      .update(apiCredentials)
      .set({
        isActive: true,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(apiCredentials.id, id))
      .returning()

    // Clear cache
    this.clearCache(target.provider as ApiProvider)

    this.logger.log(`Rolled back to credential ${id}`)

    return this.toMetadataDto(activated)
  }

  /**
   * Soft delete (mark as revoked)
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Revoking credential ${id}`)

    const existing = await this.db.client.query.apiCredentials.findFirst({
      where: eq(apiCredentials.id, id)
    })

    if (!existing) {
      throw new NotFoundException(`Credential with ID ${id} not found`)
    }

    await this.db.client
      .update(apiCredentials)
      .set({
        status: 'revoked',
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(apiCredentials.id, id))

    // Clear cache
    this.clearCache(existing.provider as ApiProvider)
  }

  /**
   * Get decrypted credentials for a provider (returns null if not found)
   *
   * Used by ExternalApiRegistryService for credential loading.
   * Does not throw if no credentials are configured.
   *
   * @param providerName - Provider identifier (string)
   * @returns Decrypted credentials or null if not found
   */
  async getDecryptedCredentials(providerName: string): Promise<Record<string, any> | null> {
    try {
      const provider = providerName as ApiProvider
      return await this.getActiveCredentials(provider)
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null
      }
      throw error
    }
  }

  /**
   * Get active credentials for a provider (for internal use by services)
   * Returns decrypted credentials with caching
   */
  async getActiveCredentials(provider: ApiProvider): Promise<Record<string, any>> {
    // Check cache first
    const cached = this.credentialCache.get(provider)
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      this.logger.debug(`Returning cached credentials for ${provider}`)
      return cached.credentials
    }

    // Fetch from database
    const credential = await this.db.client.query.apiCredentials.findFirst({
      where: and(
        eq(apiCredentials.provider, provider),
        eq(apiCredentials.isActive, true)
      )
    })

    if (!credential) {
      throw new NotFoundException(
        `No active credentials found for provider ${provider}. ` +
        `Please configure credentials in the admin panel.`
      )
    }

    // Decrypt
    const decrypted = this.encryption.decryptObject<Record<string, any>>(
      credential.encryptedCredentials as EncryptedData
    )

    // Cache
    this.credentialCache.set(provider, {
      credentials: decrypted,
      cachedAt: Date.now(),
    })

    this.logger.debug(`Fetched and cached credentials for ${provider}`)

    return decrypted
  }

  /**
   * Clear credential cache (call after rotation/updates)
   */
  clearCache(provider?: ApiProvider): void {
    if (provider) {
      this.credentialCache.delete(provider)
      this.logger.debug(`Cleared cache for ${provider}`)
    } else {
      this.credentialCache.clear()
      this.logger.debug('Cleared all credential cache')
    }
  }

  /**
   * Refresh credentials from database (bypasses cache)
   */
  async refreshCredentials(provider: ApiProvider): Promise<void> {
    this.clearCache(provider)
    await this.getActiveCredentials(provider)
  }

  /**
   * Get version history for a credential
   */
  async getHistory(id: string): Promise<CredentialMetadataDto[]> {
    const credential = await this.db.client.query.apiCredentials.findFirst({
      where: eq(apiCredentials.id, id)
    })

    if (!credential) {
      throw new NotFoundException(`Credential with ID ${id} not found`)
    }

    // Find all credentials in the version chain
    const history = await this.db.client.query.apiCredentials.findMany({
      where: eq(apiCredentials.provider, credential.provider),
      orderBy: (creds, { desc }) => [desc(creds.version)]
    })

    return history.map(c => this.toMetadataDto(c))
  }

  /**
   * Get metadata for all available storage providers
   *
   * Returns provider information including required fields, features, and availability status.
   * Used by the Admin UI to render dynamic credential forms.
   */
  async getProviderMetadata(): Promise<ProviderMetadataDto[]> {
    const providers = Object.values(ApiProvider)
    const metadata: ProviderMetadataDto[] = []

    for (const provider of providers) {
      const staticMetadata = PROVIDER_METADATA[provider]
      if (!staticMetadata) {
        this.logger.warn(`No metadata found for provider: ${provider}`)
        continue
      }

      // Check if provider has active credentials configured
      let isAvailable = false
      try {
        const credential = await this.db.client.query.apiCredentials.findFirst({
          where: and(
            eq(apiCredentials.provider, provider),
            eq(apiCredentials.isActive, true)
          )
        })
        isAvailable = !!credential
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.error(`Error checking availability for ${provider}: ${message}`)
        isAvailable = false
      }

      metadata.push({
        ...staticMetadata,
        isAvailable,
      })
    }

    return metadata
  }

  /**
   * Test connection for a specific credential
   *
   * Decrypts the credential, creates a temporary provider instance, and tests the connection.
   * Does not affect the currently active provider.
   *
   * @param id - Credential ID to test
   * @returns Connection test result with success status and message
   */
  async testConnection(id: string): Promise<ConnectionTestResult> {
    this.logger.log(`Testing connection for credential ${id}`)

    // Get credential from database
    const credential = await this.db.client.query.apiCredentials.findFirst({
      where: eq(apiCredentials.id, id)
    })

    if (!credential) {
      throw new NotFoundException(`Credential with ID ${id} not found`)
    }

    try {
      // Decrypt credentials - use Record<string, any> to handle all provider types
      const decrypted = this.encryption.decryptObject<Record<string, any>>(
        credential.encryptedCredentials as EncryptedData
      )

      // Create temporary provider instance based on provider type
      let provider
      switch (credential.provider) {
        case ApiProvider.SUPABASE_STORAGE: {
          if (!('url' in decrypted && 'serviceRoleKey' in decrypted)) {
            throw new Error('Invalid Supabase Storage credentials')
          }
          const supabaseCreds = decrypted as SupabaseStorageCredentials
          provider = new SupabaseStorageProvider(supabaseCreds, 'test-bucket')
          break
        }

        case ApiProvider.CLOUDFLARE_R2: {
          if (!('accountId' in decrypted && 'accessKeyId' in decrypted && 'secretAccessKey' in decrypted && 'bucketName' in decrypted)) {
            throw new Error('Invalid Cloudflare R2 credentials')
          }
          const r2Creds = decrypted as CloudflareR2Credentials
          provider = new CloudflareR2Provider(r2Creds, r2Creds.bucketName)
          break
        }

        case ApiProvider.BACKBLAZE_B2: {
          if (!('keyId' in decrypted && 'applicationKey' in decrypted && 'bucketName' in decrypted && 'endpoint' in decrypted)) {
            throw new Error('Invalid Backblaze B2 credentials')
          }
          const b2Creds = decrypted as BackblazeB2Credentials
          provider = new BackblazeB2Provider(b2Creds, b2Creds.bucketName)
          break
        }

        case ApiProvider.UNSPLASH:
          // Unsplash doesn't have a dedicated health endpoint, test by making a small request
          if (!('accessKey' in decrypted) || typeof decrypted.accessKey !== 'string') {
            throw new Error('Invalid Unsplash credentials')
          }
          return await this.testUnsplashConnection(decrypted.accessKey as string)

        case ApiProvider.AERODATABOX:
          // Aerodatabox health check via RapidAPI
          if (!('rapidApiKey' in decrypted) || typeof decrypted.rapidApiKey !== 'string') {
            throw new Error('Invalid Aerodatabox credentials')
          }
          return await this.testAerodataboxConnection(decrypted.rapidApiKey as string)

        case ApiProvider.AMADEUS:
          // Amadeus OAuth2 token test
          if (!('clientId' in decrypted) || !('clientSecret' in decrypted)) {
            throw new Error('Invalid Amadeus credentials')
          }
          return await this.testAmadeusConnection(
            decrypted.clientId as string,
            decrypted.clientSecret as string
          )

        case ApiProvider.GOOGLE_PLACES:
          // Google Places API key test
          if (!('apiKey' in decrypted) || typeof decrypted.apiKey !== 'string') {
            throw new Error('Invalid Google Places credentials')
          }
          return await this.testGooglePlacesConnection(decrypted.apiKey as string)

        case ApiProvider.BOOKING_COM:
          // Booking.com via RapidAPI DataCrawler
          if (!('rapidApiKey' in decrypted) || typeof decrypted.rapidApiKey !== 'string') {
            throw new Error('Invalid Booking.com credentials')
          }
          return await this.testBookingComConnection(decrypted.rapidApiKey as string)

        default:
          throw new Error(`Unknown provider: ${credential.provider}`)
      }

      // Test connection (for storage providers)
      const result = await provider.testConnection()

      this.logger.log(
        `Connection test for credential ${id} (${credential.provider}): ${result.success ? 'SUCCESS' : 'FAILED'}`
      )

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Connection test failed for credential ${id}: ${message}`)

      return {
        success: false,
        message: `Connection test failed: ${message}`,
        error: message,
      }
    }
  }

  /**
   * Convert database record to metadata DTO
   */
  private toMetadataDto(credential: any): CredentialMetadataDto {
    return {
      id: credential.id,
      parentId: credential.parentId,
      provider: credential.provider,
      name: credential.name,
      version: credential.version,
      isActive: credential.isActive,
      status: credential.status,
      lastRotatedAt: credential.lastRotatedAt,
      expiresAt: credential.expiresAt,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      createdBy: credential.createdBy,
      updatedBy: credential.updatedBy,
    }
  }

  // ============================================================================
  // External API Connection Test Helpers
  // ============================================================================

  /**
   * Test Aerodatabox API connection via RapidAPI
   *
   * Uses the health/services endpoint which doesn't count against rate limits.
   */
  private async testAerodataboxConnection(rapidApiKey: string): Promise<ConnectionTestResult> {
    const baseUrl = process.env.AERODATABOX_API_URL || 'https://aerodatabox.p.rapidapi.com'
    // Extract host from URL for x-rapidapi-host header (handles custom RapidAPI endpoints)
    const rapidApiHost = new URL(baseUrl).host

    try {
      const response = await fetch(`${baseUrl}/health/services/feeds/Schedules`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': rapidApiHost,
        },
      })

      if (response.ok) {
        this.logger.log('Aerodatabox connection test: SUCCESS')
        return {
          success: true,
          message: 'Connection successful - Aerodatabox API is reachable',
        }
      }

      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Invalid API key or unauthorized access',
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit exceeded - try again later',
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: false,
        message: `API returned error: ${response.statusText}`,
        error: `HTTP ${response.status}`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Aerodatabox connection test failed: ${message}`)
      return {
        success: false,
        message: `Connection failed: ${message}`,
        error: message,
      }
    }
  }

  /**
   * Test Unsplash API connection
   *
   * Makes a minimal request to verify API key validity.
   */
  private async testUnsplashConnection(accessKey: string): Promise<ConnectionTestResult> {
    try {
      // Use /photos/random with count=1 as a lightweight test
      const response = await fetch(
        'https://api.unsplash.com/photos/random?count=1',
        {
          method: 'GET',
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
        }
      )

      if (response.ok) {
        this.logger.log('Unsplash connection test: SUCCESS')
        return {
          success: true,
          message: 'Connection successful - Unsplash API is reachable',
        }
      }

      if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid access key',
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      if (response.status === 403) {
        // Check if rate limited
        const remaining = response.headers.get('X-Ratelimit-Remaining')
        if (remaining === '0') {
          return {
            success: false,
            message: 'Rate limit exceeded - try again later',
            error: 'Rate limit reached',
          }
        }
        return {
          success: false,
          message: 'Access forbidden - check API key permissions',
          error: `HTTP ${response.status}`,
        }
      }

      return {
        success: false,
        message: `API returned error: ${response.statusText}`,
        error: `HTTP ${response.status}`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Unsplash connection test failed: ${message}`)
      return {
        success: false,
        message: `Connection failed: ${message}`,
        error: message,
      }
    }
  }

  /**
   * Test Amadeus API connection via OAuth2 token acquisition
   *
   * Attempts to acquire an access token using client credentials flow.
   * This verifies the clientId and clientSecret are valid.
   */
  private async testAmadeusConnection(
    clientId: string,
    clientSecret: string
  ): Promise<ConnectionTestResult> {
    // Use test environment by default, production if explicitly configured
    const baseUrl = process.env.AMADEUS_API_URL || 'https://test.api.amadeus.com'

    try {
      const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as { access_token?: string; expires_in?: number }
        if (data.access_token) {
          this.logger.log('Amadeus connection test: SUCCESS - OAuth2 token acquired')
          return {
            success: true,
            message: `Connection successful - OAuth2 token acquired (expires in ${data.expires_in}s)`,
          }
        }
      }

      // Handle specific error codes
      if (response.status === 401) {
        const errorData = (await response.json().catch(() => ({}))) as { error_description?: string }
        const errorMsg = errorData?.error_description || 'Invalid client credentials'
        return {
          success: false,
          message: `Authentication failed: ${errorMsg}`,
          error: `HTTP ${response.status}: ${errorMsg}`,
        }
      }

      if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit exceeded - try again later',
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: false,
        message: `API returned error: ${response.statusText}`,
        error: `HTTP ${response.status}`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Amadeus connection test failed: ${message}`)
      return {
        success: false,
        message: `Connection failed: ${message}`,
        error: message,
      }
    }
  }

  /**
   * Test Google Places API connection
   *
   * Makes a minimal text search request to verify API key validity.
   * Uses a simple query with minimal field mask to minimize cost.
   */
  private async testGooglePlacesConnection(apiKey: string): Promise<ConnectionTestResult> {
    const baseUrl = 'https://places.googleapis.com/v1'

    try {
      // Use text search with minimal request - just verify auth works
      const response = await fetch(`${baseUrl}/places:searchText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName',
        },
        body: JSON.stringify({
          textQuery: 'hotel',
          maxResultCount: 1,
        }),
      })

      if (response.ok) {
        this.logger.log('Google Places connection test: SUCCESS')
        return {
          success: true,
          message: 'Connection successful - Google Places API is reachable',
        }
      }

      // Handle specific error codes
      if (response.status === 400) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
        const errorMsg = errorData?.error?.message || 'Bad request'
        // Check if it's an API key issue vs. a request issue
        if (errorMsg.toLowerCase().includes('api key')) {
          return {
            success: false,
            message: `Invalid API key: ${errorMsg}`,
            error: `HTTP ${response.status}: ${errorMsg}`,
          }
        }
        return {
          success: false,
          message: `Request error: ${errorMsg}`,
          error: `HTTP ${response.status}: ${errorMsg}`,
        }
      }

      if (response.status === 401 || response.status === 403) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
        const errorMsg = errorData?.error?.message || 'Authentication failed'
        return {
          success: false,
          message: `Authentication failed: ${errorMsg}`,
          error: `HTTP ${response.status}: ${errorMsg}`,
        }
      }

      if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit exceeded - try again later',
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: false,
        message: `API returned error: ${response.statusText}`,
        error: `HTTP ${response.status}`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Google Places connection test failed: ${message}`)
      return {
        success: false,
        message: `Connection failed: ${message}`,
        error: message,
      }
    }
  }

  /**
   * Test Booking.com API connection via RapidAPI DataCrawler
   *
   * Makes a minimal destination search request to verify API key validity.
   */
  private async testBookingComConnection(rapidApiKey: string): Promise<ConnectionTestResult> {
    const baseUrl = 'https://booking-com15.p.rapidapi.com'
    const rapidApiHost = 'booking-com15.p.rapidapi.com'

    try {
      // Use searchDestination with a simple query - minimal cost
      const response = await fetch(
        `${baseUrl}/api/v1/hotels/searchDestination?query=Paris`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': rapidApiHost,
          },
        }
      )

      if (response.ok) {
        const data = (await response.json()) as { status?: boolean; data?: unknown[] }
        if (data?.status === true || Array.isArray(data?.data)) {
          this.logger.log('Booking.com connection test: SUCCESS')
          return {
            success: true,
            message: 'Connection successful - Booking.com API is reachable',
          }
        }
      }

      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Invalid RapidAPI key or unauthorized access',
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit exceeded - try again later',
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: false,
        message: `API returned error: ${response.statusText}`,
        error: `HTTP ${response.status}`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Booking.com connection test failed: ${message}`)
      return {
        success: false,
        message: `Connection failed: ${message}`,
        error: message,
      }
    }
  }
}
