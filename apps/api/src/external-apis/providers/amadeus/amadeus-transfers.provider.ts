/**
 * Amadeus Transfers Provider
 *
 * External API provider for transfer search via Amadeus Transfer Offers API.
 *
 * @see https://developers.amadeus.com/self-service/category/cars-and-transfers/api-doc/transfer-search
 */

import { Injectable, OnModuleInit } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { BaseExternalApi } from '../../core/base/base-external-api'
import { RateLimiterService } from '../../core/services/rate-limiter.service'
import { MetricsService } from '../../core/services/metrics.service'
import { ExternalApiRegistryService } from '../../core/services/external-api-registry.service'
import {
  ExternalApiConfig,
  ExternalApiResponse,
  ConnectionTestResult,
  ApiCategory,
} from '../../core/interfaces'
import {
  TransferSearchParams,
  NormalizedTransferResult,
} from '@tailfire/shared-types'
import {
  AmadeusTransferOffersResponse,
  AmadeusTransferOfferRaw,
} from './amadeus.types'
import { AmadeusAuthService } from './amadeus-auth.service'

function buildConfig(): ExternalApiConfig {
  return {
    provider: 'amadeus_transfers',
    category: ApiCategory.TRANSFERS,
    baseUrl: process.env.AMADEUS_API_URL || 'https://test.api.amadeus.com',
    rateLimit: {
      requestsPerMinute: parseInt(process.env.AMADEUS_RATE_LIMIT_PER_MINUTE || '60', 10),
      requestsPerHour: parseInt(process.env.AMADEUS_RATE_LIMIT_PER_HOUR || '100', 10),
    },
    authentication: { type: 'bearer' },
  }
}

const PROVIDER_PRIORITY = 1

@Injectable()
export class AmadeusTransfersProvider
  extends BaseExternalApi<TransferSearchParams, NormalizedTransferResult>
  implements OnModuleInit
{
  constructor(
    httpService: HttpService,
    rateLimiter: RateLimiterService,
    metrics: MetricsService,
    private readonly registry: ExternalApiRegistryService,
    private readonly authService: AmadeusAuthService
  ) {
    super(buildConfig(), httpService, rateLimiter, metrics)
  }

  async onModuleInit(): Promise<void> {
    await this.registry.registerProvider(this, PROVIDER_PRIORITY)
  }

  private async getAccessToken(): Promise<string> {
    if (!this.credentials) {
      throw new Error('No credentials configured for Amadeus Transfers')
    }
    const { clientId, clientSecret } = this.credentials as { clientId: string; clientSecret: string }
    return this.authService.getAccessToken(this.config.baseUrl, { clientId, clientSecret })
  }

  private async makeAuthenticatedPost<T>(
    endpoint: string,
    body: any
  ): Promise<ExternalApiResponse<T>> {
    const requestId = `amadeus_transfers_${Date.now()}`
    const startTime = Date.now()

    if (!this.canMakeRequest()) {
      return {
        success: false,
        error: this.getCircuitBreakerState() === 'open'
          ? 'Service temporarily unavailable (circuit open)'
          : 'Rate limit exceeded',
        metadata: { provider: this.config.provider, timestamp: new Date().toISOString(), requestId },
      }
    }

    try {
      const accessToken = await this.getAccessToken()
      const response = await firstValueFrom(
        this.httpService.post<T>(endpoint, body, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: this.resilience.timeoutMs,
        })
      )

      this.logger.log('Amadeus Transfers response', { requestId, latencyMs: Date.now() - startTime })

      return {
        success: true,
        data: response.data,
        metadata: { provider: this.config.provider, timestamp: new Date().toISOString(), requestId },
      }
    } catch (error: any) {
      this.logger.error('Amadeus Transfers API error', {
        requestId,
        latencyMs: Date.now() - startTime,
        error: error.message,
        status: error.response?.status,
      })

      const errorDetail = error.response?.data?.errors?.[0]
      const errorMessage = errorDetail
        ? `${errorDetail.title}: ${errorDetail.detail || ''}`
        : error.message

      return {
        success: false,
        error: errorMessage,
        metadata: { provider: this.config.provider, timestamp: new Date().toISOString(), requestId },
      }
    }
  }

  async search(
    params: TransferSearchParams
  ): Promise<ExternalApiResponse<NormalizedTransferResult[]>> {
    const validation = this.validateParams(params)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        metadata: { provider: this.config.provider, timestamp: new Date().toISOString() },
      }
    }

    // Build Amadeus transfer search request body
    const body: any = {
      startDateTime: `${params.date}T${params.time}:00`,
      passengers: params.passengers,
    }

    // Start location
    if (params.pickupCode) {
      body.startLocationCode = params.pickupCode
    } else if (params.pickupLat !== undefined && params.pickupLng !== undefined) {
      body.startGeoCode = `${params.pickupLat},${params.pickupLng}`
    } else if (params.pickupAddress) {
      body.startAddressLine = params.pickupAddress
    }

    // End location
    if (params.dropoffCode) {
      body.endLocationCode = params.dropoffCode
    } else if (params.dropoffLat !== undefined && params.dropoffLng !== undefined) {
      body.endGeoCode = `${params.dropoffLat},${params.dropoffLng}`
    } else if (params.dropoffAddress) {
      body.endAddressLine = params.dropoffAddress
    }

    if (params.pickupType === 'airport') body.startType = 'AIRPORT'
    if (params.dropoffType === 'airport') body.endType = 'AIRPORT'

    const endpoint = `${this.config.baseUrl}/v1/shopping/transfer-offers`
    const response = await this.makeAuthenticatedPost<AmadeusTransferOffersResponse>(endpoint, body)

    if (!response.success || !response.data) {
      return { success: false, error: response.error || 'No transfers found', metadata: response.metadata }
    }

    const offers = response.data.data || []
    if (offers.length === 0) {
      return { success: false, error: 'No transfer offers found', metadata: response.metadata }
    }

    const normalized = offers.map(offer => this.transformResponse(offer))

    return { success: true, data: normalized, metadata: response.metadata }
  }

  async getDetails(
    _offerId: string
  ): Promise<ExternalApiResponse<NormalizedTransferResult>> {
    return {
      success: false,
      error: 'Transfer offer details not supported — use search instead',
      metadata: { provider: this.config.provider, timestamp: new Date().toISOString() },
    }
  }

  validateParams(params: TransferSearchParams): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Pickup: need at least one of code, coords, or address
    const hasPickup = params.pickupCode || (params.pickupLat !== undefined && params.pickupLng !== undefined) || params.pickupAddress
    if (!hasPickup) errors.push('Pickup location required (code, coordinates, or address)')

    // Dropoff: same
    const hasDropoff = params.dropoffCode || (params.dropoffLat !== undefined && params.dropoffLng !== undefined) || params.dropoffAddress
    if (!hasDropoff) errors.push('Dropoff location required (code, coordinates, or address)')

    if (!params.date || !/^\d{4}-\d{2}-\d{2}$/.test(params.date)) errors.push('Date required (YYYY-MM-DD)')
    if (!params.time || !/^\d{2}:\d{2}$/.test(params.time)) errors.push('Time required (HH:mm)')
    if (!params.passengers || params.passengers < 1) errors.push('At least 1 passenger required')

    return { valid: errors.length === 0, errors }
  }

  transformResponse(offer: AmadeusTransferOfferRaw): NormalizedTransferResult {
    const vehicle = offer.vehicle
    const maxPassengers = vehicle?.seats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0
    const maxBags = vehicle?.baggages?.reduce((sum, b) => sum + (b.count || 0), 0) || undefined

    const cancellationRule = offer.cancellationRules?.[0]

    return {
      id: offer.id,
      transferType: offer.transferType,
      provider: offer.serviceProvider?.name || 'amadeus',
      vehicle: {
        type: vehicle?.category || vehicle?.code || 'Unknown',
        description: vehicle?.description || '',
        maxPassengers,
        maxBags,
      },
      price: {
        currency: offer.quotation.currencyCode,
        total: offer.quotation.monetaryAmount,
        base: offer.quotation.base?.monetaryAmount,
      },
      duration: offer.duration,
      pickupLocation: {
        address: offer.start?.address?.line || offer.start?.locationCode || '',
        lat: offer.start?.latiLong?.latitude,
        lng: offer.start?.latiLong?.longitude,
      },
      dropoffLocation: {
        address: offer.end?.address?.line || offer.end?.locationCode || '',
        lat: offer.end?.latiLong?.latitude,
        lng: offer.end?.latiLong?.longitude,
      },
      cancellationPolicy: cancellationRule
        ? {
            refundable: cancellationRule.freeRefund ?? false,
            description: cancellationRule.ruleDescription,
          }
        : undefined,
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.credentials) {
      return { success: false, message: 'No credentials configured' }
    }
    try {
      await this.getAccessToken()
      return { success: true, message: 'OAuth2 authentication successful' }
    } catch (error: any) {
      return { success: false, message: error.message || 'OAuth2 authentication failed' }
    }
  }

  protected canMakeRequest(): boolean {
    return super['canMakeRequest']?.() ?? true
  }
}
