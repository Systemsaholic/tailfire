/**
 * Amadeus Fallback Integration Tests
 *
 * Tests for the fallback behavior between Aerodatabox and Amadeus providers.
 * Covers:
 * - Automatic fallback when Aerodatabox returns empty results
 * - Provider override via query parameter
 * - Error handling when all providers fail
 */

import { Test, TestingModule } from '@nestjs/testing'
import { HttpService } from '@nestjs/axios'
import { of, throwError } from 'rxjs'
import { AerodataboxFlightsProvider } from '../providers/aerodatabox/aerodatabox-flights.provider'
import { AmadeusFlightsProvider } from '../providers/amadeus/amadeus-flights.provider'
import { ExternalApiRegistryService } from '../core/services/external-api-registry.service'
import { RateLimiterService } from '../core/services/rate-limiter.service'
import { MetricsService } from '../core/services/metrics.service'
import { ApiCredentialsService } from '../../api-credentials/api-credentials.service'
import { ApiCategory } from '../core/interfaces'
import type { AerodataboxFlightResponse } from '../providers/aerodatabox/aerodatabox.types'
import type { AmadeusFlightResponse } from '../providers/amadeus/amadeus.types'
import type { IExternalApiProvider, ExternalApiResponse } from '../core/interfaces'
import type { NormalizedFlightStatus } from '../providers/aerodatabox/aerodatabox.types'

/**
 * Helper to create an AxiosResponse-like mock
 */
function mockAxiosResponse<T>(data: T, status = 200, headers: Record<string, string> = {}): any {
  return {
    data,
    status,
    statusText: 'OK',
    headers,
    config: { headers: {} },
  }
}

/**
 * Sample Aerodatabox flight response
 */
const AERODATABOX_FLIGHT: AerodataboxFlightResponse = {
  number: 'AC123',
  status: 'Expected',
  departure: {
    airport: {
      icao: 'CYOW',
      iata: 'YOW',
      name: 'Ottawa International Airport',
      timezone: 'America/Toronto',
    },
    terminal: '1',
    scheduledTime: { local: '2025-01-15T10:30:00-05:00', utc: '2025-01-15T15:30:00Z' },
  },
  arrival: {
    airport: {
      icao: 'CYYZ',
      iata: 'YYZ',
      name: 'Toronto Pearson International Airport',
      timezone: 'America/Toronto',
    },
    terminal: '1',
    scheduledTime: { local: '2025-01-15T11:30:00-05:00', utc: '2025-01-15T16:30:00Z' },
  },
  airline: {
    name: 'Air Canada',
    iata: 'AC',
    icao: 'ACA',
  },
  lastUpdatedUtc: '2025-01-15T12:00:00Z',
}

/**
 * Sample Amadeus flight response (for Caribbean route that Aerodatabox doesn't have)
 */
const AMADEUS_FLIGHT_RESPONSE: AmadeusFlightResponse = {
  data: [
    {
      type: 'DatedFlight',
      scheduledDepartureDate: '2026-02-08',
      flightDesignator: {
        carrierCode: 'WS',
        flightNumber: 2648,
      },
      flightPoints: [
        {
          iataCode: 'YOW',
          departure: {
            timings: [
              { qualifier: 'STD', value: '2026-02-08T08:00' },
            ],
          },
        },
        {
          iataCode: 'MBJ',
          arrival: {
            timings: [
              { qualifier: 'STA', value: '2026-02-08T13:30' },
            ],
          },
        },
      ],
      legs: [
        {
          aircraftEquipment: { aircraftType: '73H' },
          scheduledLegDuration: 'PT5H30M',
        },
      ],
    },
  ],
  dictionaries: {
    carriers: { WS: 'WestJet' },
    aircraft: { '73H': 'Boeing 737-800' },
  },
}

/**
 * Mock Amadeus token response for OAuth2
 */
const AMADEUS_TOKEN_RESPONSE = {
  access_token: 'mock-access-token',
  token_type: 'Bearer',
  expires_in: 1799,
}

describe('Amadeus Fallback Integration', () => {
  let aerodataboxProvider: AerodataboxFlightsProvider
  let amadeusProvider: AmadeusFlightsProvider
  let registry: ExternalApiRegistryService
  let httpService: jest.Mocked<HttpService>
  let credentialsService: jest.Mocked<ApiCredentialsService>

  beforeEach(async () => {
    const mockHttpService = {
      request: jest.fn(),
      post: jest.fn(),
    }

    const mockRateLimiter = {
      canMakeRequest: jest.fn().mockReturnValue(true),
      recordRequest: jest.fn(),
      getRemainingRequests: jest.fn().mockReturnValue(50),
    }

    const mockMetrics = {
      recordRequest: jest.fn(),
      recordLatency: jest.fn(),
      setRateLimitRemaining: jest.fn(),
      setCircuitBreakerState: jest.fn(),
    }

    const mockCredentialsService = {
      getDecryptedCredentials: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalApiRegistryService,
        AerodataboxFlightsProvider,
        AmadeusFlightsProvider,
        { provide: HttpService, useValue: mockHttpService },
        { provide: RateLimiterService, useValue: mockRateLimiter },
        { provide: MetricsService, useValue: mockMetrics },
        { provide: ApiCredentialsService, useValue: mockCredentialsService },
      ],
    }).compile()

    registry = module.get<ExternalApiRegistryService>(ExternalApiRegistryService)
    aerodataboxProvider = module.get<AerodataboxFlightsProvider>(AerodataboxFlightsProvider)
    amadeusProvider = module.get<AmadeusFlightsProvider>(AmadeusFlightsProvider)
    httpService = module.get(HttpService)
    credentialsService = module.get(ApiCredentialsService)

    // Set up credentials for both providers
    credentialsService.getDecryptedCredentials.mockImplementation((provider: string) => {
      if (provider === 'aerodatabox') {
        return Promise.resolve({ rapidApiKey: 'test-aerodatabox-key' })
      }
      if (provider === 'amadeus') {
        return Promise.resolve({ clientId: 'test-client-id', clientSecret: 'test-secret' })
      }
      return Promise.resolve(null)
    })

    // Register providers with priorities
    await registry.registerProvider(aerodataboxProvider, 1) // Primary
    await registry.registerProvider(amadeusProvider, 2) // Fallback
  })

  describe('Fallback Chain', () => {
    it('should have Aerodatabox as primary and Amadeus as fallback', () => {
      const chain = registry.getFallbackChain(ApiCategory.FLIGHTS)
      expect(chain).toEqual(['aerodatabox', 'amadeus'])
    })

    it('should return only providers with credentials', async () => {
      // Remove Amadeus credentials
      credentialsService.getDecryptedCredentials.mockImplementation((provider: string) => {
        if (provider === 'aerodatabox') {
          return Promise.resolve({ rapidApiKey: 'test-key' })
        }
        return Promise.resolve(null) // Amadeus has no credentials
      })

      // Re-register to update active providers
      await registry.refreshCredentials('amadeus')

      const chain = registry.getFallbackChain(ApiCategory.FLIGHTS)
      expect(chain).toEqual(['aerodatabox'])
      expect(chain).not.toContain('amadeus')
    })
  })

  describe('Automatic Fallback', () => {
    it('should fallback to Amadeus when Aerodatabox returns empty', async () => {
      // Mock Aerodatabox to return empty
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse([])))

      // Mock Amadeus token request and flight search
      httpService.post.mockReturnValueOnce(of(mockAxiosResponse(AMADEUS_TOKEN_RESPONSE)))
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse(AMADEUS_FLIGHT_RESPONSE)))

      // Try with fallback using registry
      const operation = async (provider: IExternalApiProvider<any, any>): Promise<ExternalApiResponse<NormalizedFlightStatus[]>> => {
        const result = await provider.search({
          flightNumber: 'WS2648',
          dateLocal: '2026-02-08',
        }) as ExternalApiResponse<NormalizedFlightStatus[]>
        if (!result.success || !result.data?.length) {
          throw new Error(result.error || 'No flights found')
        }
        return result
      }

      const result = await registry.tryWithFallback(ApiCategory.FLIGHTS, operation)

      expect(result).not.toBeNull()
      expect(result?.success).toBe(true)
      expect(result?.data).toHaveLength(1)
      expect(result?.data![0]!.flightNumber).toBe('WS2648')
      expect(result?.data![0]!.departure.airportIata).toBe('YOW')
      expect(result?.data![0]!.arrival.airportIata).toBe('MBJ')
    })

    it('should use Aerodatabox result when available (no fallback needed)', async () => {
      // Mock Aerodatabox to return data
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse([AERODATABOX_FLIGHT])))

      const operation = async (provider: IExternalApiProvider<any, any>): Promise<ExternalApiResponse<NormalizedFlightStatus[]>> => {
        const result = await provider.search({
          flightNumber: 'AC123',
          dateLocal: '2025-01-15',
        }) as ExternalApiResponse<NormalizedFlightStatus[]>
        if (!result.success || !result.data?.length) {
          throw new Error(result.error || 'No flights found')
        }
        return result
      }

      const result = await registry.tryWithFallback(ApiCategory.FLIGHTS, operation)

      expect(result).not.toBeNull()
      expect(result?.success).toBe(true)
      expect(result?.data![0]!.flightNumber).toBe('AC123')
      // Amadeus should NOT have been called
      expect(httpService.post).not.toHaveBeenCalled() // No token request
    })

    it('should return null when all providers fail', async () => {
      // Mock Aerodatabox to return error
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse([])))

      // Mock Amadeus token request but flight search returns empty
      httpService.post.mockReturnValueOnce(of(mockAxiosResponse(AMADEUS_TOKEN_RESPONSE)))
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse({ data: [] })))

      const operation = async (provider: IExternalApiProvider<any, any>): Promise<ExternalApiResponse<NormalizedFlightStatus[]>> => {
        const result = await provider.search({
          flightNumber: 'XX999',
          dateLocal: '2025-01-15',
        }) as ExternalApiResponse<NormalizedFlightStatus[]>
        if (!result.success || !result.data?.length) {
          throw new Error(result.error || 'No flights found')
        }
        return result
      }

      const result = await registry.tryWithFallback(ApiCategory.FLIGHTS, operation)

      expect(result).toBeNull()
    })
  })

  describe('Provider Override', () => {
    it('should return Amadeus data when provider=amadeus override is used', async () => {
      // Mock Amadeus token and flight response
      httpService.post.mockReturnValueOnce(of(mockAxiosResponse(AMADEUS_TOKEN_RESPONSE)))
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse(AMADEUS_FLIGHT_RESPONSE)))

      // Get Amadeus provider directly
      const provider = await registry.getProvider(ApiCategory.FLIGHTS, 'amadeus')
      expect(provider).not.toBeNull()

      const result = await provider!.search({
        flightNumber: 'WS2648',
        dateLocal: '2026-02-08',
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0]!.flightNumber).toBe('WS2648')
      expect(result.data![0]!.departure.airportIata).toBe('YOW')
      expect(result.data![0]!.arrival.airportIata).toBe('MBJ')
      // Verify airline name from dictionaries
      expect(result.data![0]!.airline.name).toBe('WestJet')
    })

    it('should return Aerodatabox data when provider=aerodatabox override is used', async () => {
      // Mock Aerodatabox response
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse([AERODATABOX_FLIGHT])))

      // Get Aerodatabox provider directly
      const provider = await registry.getProvider(ApiCategory.FLIGHTS, 'aerodatabox')
      expect(provider).not.toBeNull()

      const result = await provider!.search({
        flightNumber: 'AC123',
        dateLocal: '2025-01-15',
      })

      expect(result.success).toBe(true)
      expect(result.data![0]!.flightNumber).toBe('AC123')
    })

    it('should return null for unknown provider override', async () => {
      const provider = await registry.getProvider(ApiCategory.FLIGHTS, 'unknown-provider')
      expect(provider).toBeNull()
    })
  })

  describe('Codeshare Fix - More Results Button', () => {
    it('should allow querying Amadeus even when Aerodatabox returns wrong flight', async () => {
      // Aerodatabox returns WRONG codeshare flight (Ottawa→Montreal instead of Ottawa→Punta Cana)
      const wrongCodeshare: AerodataboxFlightResponse = {
        ...AERODATABOX_FLIGHT,
        number: 'AC8006',
        departure: {
          airport: {
            icao: 'CYOW',
            iata: 'YOW',
            name: 'Ottawa International Airport',
            timezone: 'America/Toronto',
          },
          scheduledTime: { local: '2026-02-07T07:00:00-05:00', utc: '2026-02-07T12:00:00Z' },
        },
        arrival: {
          airport: {
            icao: 'CYUL',
            iata: 'YUL', // Montreal - WRONG!
            name: 'Montreal-Trudeau International Airport',
            timezone: 'America/Toronto',
          },
          scheduledTime: { local: '2026-02-07T08:00:00-05:00', utc: '2026-02-07T13:00:00Z' },
        },
      }

      // Amadeus returns CORRECT codeshare flight (Ottawa→Punta Cana)
      const correctCodeshare: AmadeusFlightResponse = {
        data: [
          {
            type: 'DatedFlight',
            scheduledDepartureDate: '2026-02-07',
            flightDesignator: {
              carrierCode: 'AC',
              flightNumber: 8006,
            },
            flightPoints: [
              {
                iataCode: 'YOW',
                departure: {
                  timings: [{ qualifier: 'STD', value: '2026-02-07T10:50' }],
                },
              },
              {
                iataCode: 'PUJ', // Punta Cana - CORRECT!
                arrival: {
                  timings: [{ qualifier: 'STA', value: '2026-02-07T18:40' }],
                },
              },
            ],
            legs: [{ aircraftEquipment: { aircraftType: '321' } }],
          },
        ],
        dictionaries: {
          carriers: { AC: 'Air Canada' },
          aircraft: { '321': 'Airbus A321' },
        },
      }

      // Mock Aerodatabox returning wrong flight
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse([wrongCodeshare])))

      // First, Aerodatabox returns wrong result
      const aerodataboxResult = await aerodataboxProvider.search({
        flightNumber: 'AC8006',
        dateLocal: '2026-02-07',
      })
      expect(aerodataboxResult.success).toBe(true)
      expect(aerodataboxResult.data![0]!.arrival.airportIata).toBe('YUL') // Wrong!

      // User clicks "More Results" button - query Amadeus directly
      httpService.post.mockReturnValueOnce(of(mockAxiosResponse(AMADEUS_TOKEN_RESPONSE)))
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse(correctCodeshare)))

      const amadeusResult = await amadeusProvider.search({
        flightNumber: 'AC8006',
        dateLocal: '2026-02-07',
      })
      expect(amadeusResult.success).toBe(true)
      expect(amadeusResult.data![0]!.arrival.airportIata).toBe('PUJ') // Correct!
      expect(amadeusResult.data![0]!.airline.name).toBe('Air Canada')
    })
  })

  describe('Error Handling', () => {
    it('should handle Aerodatabox API error gracefully', async () => {
      // Mock Aerodatabox throwing error
      httpService.request.mockReturnValueOnce(throwError(() => new Error('Aerodatabox API unavailable')))

      // Test that Aerodatabox handles the error gracefully
      const result = await aerodataboxProvider.search({
        flightNumber: 'WS2648',
        dateLocal: '2026-02-08',
      })

      // Should return error response, not throw
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle Amadeus OAuth2 token failure gracefully', async () => {
      // Mock token request failure
      httpService.post.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 401,
            data: { error: 'invalid_client', error_description: 'Invalid client credentials' },
          },
        }))
      )

      const result = await amadeusProvider.testConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain('OAuth2')
    })

    it('should return proper error when Amadeus has no credentials', async () => {
      // Clear Amadeus credentials
      await amadeusProvider.setCredentials(null as any)

      const result = await amadeusProvider.testConnection()

      expect(result.success).toBe(false)
      expect(result.message).toBe('No credentials configured')
    })
  })

  describe('Response Transformation', () => {
    it('should transform Amadeus response to NormalizedFlightStatus', async () => {
      httpService.post.mockReturnValueOnce(of(mockAxiosResponse(AMADEUS_TOKEN_RESPONSE)))
      httpService.request.mockReturnValueOnce(of(mockAxiosResponse(AMADEUS_FLIGHT_RESPONSE)))

      const result = await amadeusProvider.search({
        flightNumber: 'WS2648',
        dateLocal: '2026-02-08',
      })

      expect(result.success).toBe(true)
      const flight = result.data![0]!

      // Verify flight number
      expect(flight.flightNumber).toBe('WS2648')

      // Verify airline info
      expect(flight.airline.name).toBe('WestJet')
      expect(flight.airline.iataCode).toBe('WS')

      // Verify departure
      expect(flight.departure.airportIata).toBe('YOW')
      // Amadeus returns time as "2026-02-08T08:00", provider adds ":00" for seconds
      expect(flight.departure.scheduledTime?.local).toMatch(/^2026-02-08T08:00/)

      // Verify arrival
      expect(flight.arrival.airportIata).toBe('MBJ')
      expect(flight.arrival.scheduledTime?.local).toMatch(/^2026-02-08T13:30/)

      // Verify aircraft
      expect(flight.aircraft?.model).toBe('Boeing 737-800')

      // Verify status (schedule API returns Expected)
      expect(flight.status).toBe('Expected')
      expect(flight.statusCategory).toBe('scheduled')
    })
  })
})
