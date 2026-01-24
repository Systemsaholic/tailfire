/**
 * Traveltek Auth Service
 *
 * Manages OAuth 2.0 token lifecycle for FusionAPI.
 * Implements token caching with automatic refresh.
 *
 * Token flow:
 * 1. Client credentials grant with Basic auth
 * 2. Cache token using `expires_in` from response
 * 3. Refresh 60s before expiry
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: string // Returned as string from API
  scope: string
}

interface CachedToken {
  token: string
  expiresAt: Date
}

@Injectable()
export class TraveltekAuthService implements OnModuleInit {
  private readonly logger = new Logger(TraveltekAuthService.name)
  private cachedToken: CachedToken | null = null
  private tokenRefreshPromise: Promise<string> | null = null

  private readonly apiUrl: string
  private readonly username: string
  private readonly password: string
  private readonly sid: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('TRAVELTEK_API_URL') || ''
    this.username = this.configService.get<string>('TRAVELTEK_USERNAME') || ''
    this.password = this.configService.get<string>('TRAVELTEK_PASSWORD') || ''
    this.sid = this.configService.get<string>('TRAVELTEK_SID') || ''
  }

  async onModuleInit() {
    // Validate required configuration
    if (!this.apiUrl || !this.username || !this.password || !this.sid) {
      this.logger.warn(
        'Traveltek FusionAPI credentials not configured. ' +
        'Set TRAVELTEK_API_URL, TRAVELTEK_USERNAME, TRAVELTEK_PASSWORD, and TRAVELTEK_SID.'
      )
    } else {
      this.logger.log('Traveltek FusionAPI credentials configured')
    }
  }

  /**
   * Get a valid access token, refreshing if necessary.
   * Thread-safe - concurrent calls will share the same refresh promise.
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.cachedToken && this.cachedToken.expiresAt > new Date()) {
      return this.cachedToken.token
    }

    // If a refresh is already in progress, wait for it
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise
    }

    // Start a new refresh
    this.tokenRefreshPromise = this.refreshToken()

    try {
      const token = await this.tokenRefreshPromise
      return token
    } finally {
      this.tokenRefreshPromise = null
    }
  }

  /**
   * Get the SID (session ID) for API requests
   */
  getSid(): string {
    return this.sid
  }

  /**
   * Get the base API URL
   */
  getApiUrl(): string {
    return this.apiUrl
  }

  /**
   * Check if credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.apiUrl && this.username && this.password && this.sid)
  }

  /**
   * Force refresh the token (for testing or after errors)
   */
  async forceRefresh(): Promise<string> {
    this.cachedToken = null
    return this.getAccessToken()
  }

  /**
   * Refresh the OAuth token
   */
  private async refreshToken(): Promise<string> {
    this.logger.debug('Refreshing Traveltek OAuth token')

    if (!this.isConfigured()) {
      throw new Error(
        'Traveltek FusionAPI credentials not configured. ' +
        'Set TRAVELTEK_API_URL, TRAVELTEK_USERNAME, TRAVELTEK_PASSWORD, and TRAVELTEK_SID.'
      )
    }

    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64')

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          `${this.apiUrl}/token.pl`,
          'grant_type=client_credentials&scope=portal',
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
      )

      // Parse expires_in (returned as string)
      const expiresIn = parseInt(data.expires_in, 10)

      if (isNaN(expiresIn) || expiresIn <= 0) {
        throw new Error(`Invalid expires_in value: ${data.expires_in}`)
      }

      // Cache with 60s buffer before actual expiry
      const bufferSeconds = 60
      const expiresAt = new Date(Date.now() + (expiresIn - bufferSeconds) * 1000)

      this.cachedToken = {
        token: data.access_token,
        expiresAt,
      }

      this.logger.log(
        `Traveltek OAuth token refreshed, expires in ${expiresIn}s ` +
        `(cached until ${expiresAt.toISOString()})`
      )

      return data.access_token
    } catch (error) {
      this.logger.error('Failed to refresh Traveltek OAuth token', error)

      // Clear any stale cache
      this.cachedToken = null

      throw error
    }
  }
}
