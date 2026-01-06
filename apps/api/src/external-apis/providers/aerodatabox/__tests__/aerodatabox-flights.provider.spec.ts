/**
 * Aerodatabox Flights Provider Unit Tests
 *
 * Tests for flight status lookup, parameter validation, and response transformation.
 */

import { Test, TestingModule } from '@nestjs/testing'
import { HttpService } from '@nestjs/axios'
import { of, throwError } from 'rxjs'
import { AerodataboxFlightsProvider } from '../aerodatabox-flights.provider'
import { RateLimiterService } from '../../../core/services/rate-limiter.service'
import { MetricsService } from '../../../core/services/metrics.service'
import { ExternalApiRegistryService } from '../../../core/services/external-api-registry.service'
import { AerodataboxFlightResponse } from '../aerodatabox.types'

/**
 * Helper to create an AxiosResponse-like mock
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

/**
 * Sample Aerodatabox API response - single flight
 */
const SAMPLE_FLIGHT: AerodataboxFlightResponse = {
    number: 'AA123',
    callSign: 'AAL123',
    status: 'EnRoute',
    departure: {
      airport: {
        icao: 'KJFK',
        iata: 'JFK',
        name: 'John F. Kennedy International Airport',
        timezone: 'America/New_York',
      },
      terminal: '1',
      gate: 'B22',
      scheduledTime: { scheduled: '2025-01-15T14:30:00Z' },
      revisedTime: { revised: '2025-01-15T14:45:00Z' },
    },
    arrival: {
      airport: {
        icao: 'KLAX',
        iata: 'LAX',
        name: 'Los Angeles International Airport',
        timezone: 'America/Los_Angeles',
      },
      terminal: '4',
      scheduledTime: { scheduled: '2025-01-15T17:30:00Z' },
      revisedTime: { revised: '2025-01-15T17:45:00Z' },
    },
    airline: {
      name: 'American Airlines',
      iata: 'AA',
      icao: 'AAL',
    },
    aircraft: {
      reg: 'N123AA',
      model: 'Boeing 777-200',
    },
    greatCircleDistance: {
      meter: 3983000,
      km: 3983,
      mile: 2475,
      nm: 2151,
      feet: 13068241,
    },
    lastUpdatedUtc: '2025-01-15T15:00:00Z',
}

/**
 * Sample API response array
 */
const SAMPLE_FLIGHT_RESPONSE: AerodataboxFlightResponse[] = [SAMPLE_FLIGHT]

describe('AerodataboxFlightsProvider', () => {
  let provider: AerodataboxFlightsProvider
  let httpService: jest.Mocked<HttpService>
  let rateLimiter: jest.Mocked<RateLimiterService>
  let metrics: jest.Mocked<MetricsService>
  let registry: jest.Mocked<ExternalApiRegistryService>

  beforeEach(async () => {
    const mockHttpService = {
      request: jest.fn(),
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

    const mockRegistry = {
      registerProvider: jest.fn().mockResolvedValue(undefined),
      getProvider: jest.fn(),
      getFallbackChain: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AerodataboxFlightsProvider,
        { provide: HttpService, useValue: mockHttpService },
        { provide: RateLimiterService, useValue: mockRateLimiter },
        { provide: MetricsService, useValue: mockMetrics },
        { provide: ExternalApiRegistryService, useValue: mockRegistry },
      ],
    }).compile()

    provider = module.get<AerodataboxFlightsProvider>(AerodataboxFlightsProvider)
    httpService = module.get(HttpService)
    rateLimiter = module.get(RateLimiterService)
    metrics = module.get(MetricsService)
    registry = module.get(ExternalApiRegistryService)

    // Set credentials
    await provider.setCredentials({ rapidApiKey: 'test-key' })
  })

  describe('onModuleInit', () => {
    it('should register provider with registry', async () => {
      await provider.onModuleInit()
      expect(registry.registerProvider).toHaveBeenCalledWith(provider, 1)
    })
  })

  describe('validateParams', () => {
    it('should accept valid flight number', () => {
      const result = provider.validateParams({ flightNumber: 'AA123' })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty flight number', () => {
      const result = provider.validateParams({ flightNumber: '' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Flight number is required')
    })

    it('should reject flight number that is too short', () => {
      const result = provider.validateParams({ flightNumber: 'A' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Flight number must be between 2 and 10 characters')
    })

    it('should reject flight number that is too long', () => {
      const result = provider.validateParams({ flightNumber: 'ABCDEFGHIJK' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Flight number must be between 2 and 10 characters')
    })

    it('should accept valid date format', () => {
      const result = provider.validateParams({
        flightNumber: 'AA123',
        dateLocal: '2025-01-15',
      })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid date format', () => {
      const result = provider.validateParams({
        flightNumber: 'AA123',
        dateLocal: '01-15-2025',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Date must be in YYYY-MM-DD format')
    })

    it('should accept valid searchBy values', () => {
      const validTypes = ['number', 'callsign', 'reg', 'icao24'] as const
      for (const searchBy of validTypes) {
        const result = provider.validateParams({ flightNumber: 'AA123', searchBy })
        expect(result.valid).toBe(true)
      }
    })

    it('should reject invalid searchBy value', () => {
      const result = provider.validateParams({
        flightNumber: 'AA123',
        searchBy: 'invalid' as any,
      })
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('searchBy must be one of')
    })
  })

  describe('search', () => {
    it('should return flight data on successful API call', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse(SAMPLE_FLIGHT_RESPONSE)))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0]!.flightNumber).toBe('AA123')
      expect(result.data![0]!.status).toBe('EnRoute')
      expect(result.data![0]!.statusCategory).toBe('active')
    })

    it('should transform departure info correctly with timezone', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse(SAMPLE_FLIGHT_RESPONSE)))

      const result = await provider.search({ flightNumber: 'AA123' })
      const departure = result.data![0]!.departure

      expect(departure.airportIata).toBe('JFK')
      expect(departure.airportIcao).toBe('KJFK')
      expect(departure.airportName).toBe('John F. Kennedy International Airport')
      expect(departure.timezone).toBe('America/New_York')
      expect(departure.terminal).toBe('1')
      expect(departure.gate).toBe('B22')
      // Times are now NormalizedTime objects with local and utc
      expect(departure.scheduledTime?.local).toBe('2025-01-15T14:30:00Z')
      expect(departure.scheduledTime?.utc).toBe('2025-01-15T14:30:00Z')
      expect(departure.estimatedTime?.local).toBe('2025-01-15T14:45:00Z')
    })

    it('should transform airline info correctly', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse(SAMPLE_FLIGHT_RESPONSE)))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.data![0]!.airline).toEqual({
        name: 'American Airlines',
        iataCode: 'AA',
        icaoCode: 'AAL',
      })
    })

    it('should include aircraft info when available', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse(SAMPLE_FLIGHT_RESPONSE)))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.data![0]!.aircraft).toEqual({
        registration: 'N123AA',
        model: 'Boeing 777-200',
        modeS: undefined,
      })
    })

    it('should return validation error for invalid params', async () => {
      const result = await provider.search({ flightNumber: '' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Flight number is required')
      expect(httpService.request).not.toHaveBeenCalled()
    })

    it('should handle API error gracefully', async () => {
      httpService.request.mockReturnValue(throwError(() => new Error('API unavailable')))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should include date in URL when provided', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse(SAMPLE_FLIGHT_RESPONSE)))

      await provider.search({ flightNumber: 'AA123', dateLocal: '2025-01-15' })

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/2025-01-15'),
        })
      )
    })
  })

  describe('getDetails', () => {
    it('should return single flight on success', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse(SAMPLE_FLIGHT_RESPONSE)))

      const result = await provider.getDetails('AA123')

      expect(result.success).toBe(true)
      expect(result.data?.flightNumber).toBe('AA123')
    })

    it('should return error when flight not found', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse([])))

      const result = await provider.getDetails('XX999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Flight not found')
    })
  })

  describe('transformResponse - status categorization', () => {
    it('should categorize scheduled statuses correctly', () => {
      const scheduledStatuses = ['Unknown', 'Expected']
      for (const status of scheduledStatuses) {
        const result = provider.transformResponse({
          ...SAMPLE_FLIGHT,
          status: status as any,
        })
        expect(result.statusCategory).toBe('scheduled')
      }
    })

    it('should categorize active statuses correctly', () => {
      const activeStatuses = ['CheckIn', 'Boarding', 'GateClosed', 'Departed', 'EnRoute', 'Approaching']
      for (const status of activeStatuses) {
        const result = provider.transformResponse({
          ...SAMPLE_FLIGHT,
          status: status as any,
        })
        expect(result.statusCategory).toBe('active')
      }
    })

    it('should categorize completed status correctly', () => {
      const result = provider.transformResponse({
        ...SAMPLE_FLIGHT,
        status: 'Arrived',
      })
      expect(result.statusCategory).toBe('completed')
    })

    it('should categorize disrupted statuses correctly', () => {
      const disruptedStatuses = ['Delayed', 'Canceled', 'Diverted', 'CanceledUncertain']
      for (const status of disruptedStatuses) {
        const result = provider.transformResponse({
          ...SAMPLE_FLIGHT,
          status: status as any,
        })
        expect(result.statusCategory).toBe('disrupted')
      }
    })
  })

  describe('testConnection', () => {
    it('should return failure when no credentials', async () => {
      const providerNoCreds = new AerodataboxFlightsProvider(
        httpService as any,
        rateLimiter as any,
        metrics as any,
        registry as any
      )

      const result = await providerNoCreds.testConnection()

      expect(result.success).toBe(false)
      expect(result.message).toBe('No credentials configured')
    })

    it('should return success on valid health check', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse({ status: 'healthy' })))

      const result = await provider.testConnection()

      expect(result.success).toBe(true)
      expect(result.message).toBe('Connection successful')
    })
  })

  describe('timezone conversion', () => {
    it('should pass through UTC times unchanged', async () => {
      const flightWithUtc: AerodataboxFlightResponse = {
        ...SAMPLE_FLIGHT,
        departure: {
          ...SAMPLE_FLIGHT.departure,
          scheduledTime: { scheduled: '2025-01-15T19:30:00Z' },
        },
      }
      httpService.request.mockReturnValue(of(mockAxiosResponse([flightWithUtc])))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.data![0]!.departure.scheduledTime?.utc).toBe('2025-01-15T19:30:00Z')
      expect(result.data![0]!.departure.scheduledTime?.local).toBe('2025-01-15T19:30:00Z')
    })

    it('should convert time with offset to UTC', async () => {
      const flightWithOffset: AerodataboxFlightResponse = {
        ...SAMPLE_FLIGHT,
        departure: {
          ...SAMPLE_FLIGHT.departure,
          // 14:30 EST = 19:30 UTC
          scheduledTime: { scheduled: '2025-01-15T14:30:00-05:00' },
        },
      }
      httpService.request.mockReturnValue(of(mockAxiosResponse([flightWithOffset])))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.data![0]!.departure.scheduledTime?.local).toBe('2025-01-15T14:30:00-05:00')
      expect(result.data![0]!.departure.scheduledTime?.utc).toBe('2025-01-15T19:30:00.000Z')
    })

    it('should convert naive local time using airport timezone (winter/EST)', async () => {
      // January is winter in New York, so EST (GMT-5) applies
      const flightWithNaive: AerodataboxFlightResponse = {
        ...SAMPLE_FLIGHT,
        departure: {
          airport: {
            icao: 'KJFK',
            iata: 'JFK',
            name: 'John F. Kennedy International Airport',
            timezone: 'America/New_York', // Important: provides TZ context
          },
          terminal: '1',
          // Naive time - no offset, needs airport TZ to convert
          scheduledTime: { scheduled: '2025-01-15T14:30:00' },
        },
      }
      httpService.request.mockReturnValue(of(mockAxiosResponse([flightWithNaive])))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.data![0]!.departure.scheduledTime?.local).toBe('2025-01-15T14:30:00')
      // 14:30 EST (GMT-5) = 19:30 UTC
      expect(result.data![0]!.departure.scheduledTime?.utc).toBe('2025-01-15T19:30:00.000Z')
    })

    it('should convert naive local time using airport timezone (summer/EDT)', async () => {
      // July is summer in New York, so EDT (GMT-4) applies
      const flightWithNaive: AerodataboxFlightResponse = {
        ...SAMPLE_FLIGHT,
        departure: {
          airport: {
            icao: 'KJFK',
            iata: 'JFK',
            name: 'John F. Kennedy International Airport',
            timezone: 'America/New_York',
          },
          terminal: '1',
          scheduledTime: { scheduled: '2025-07-15T14:30:00' },
        },
      }
      httpService.request.mockReturnValue(of(mockAxiosResponse([flightWithNaive])))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.data![0]!.departure.scheduledTime?.local).toBe('2025-07-15T14:30:00')
      // 14:30 EDT (GMT-4) = 18:30 UTC - DST correctly applied
      expect(result.data![0]!.departure.scheduledTime?.utc).toBe('2025-07-15T18:30:00.000Z')
    })

    it('should handle India timezone (GMT+5:30)', async () => {
      const flightInIndia: AerodataboxFlightResponse = {
        ...SAMPLE_FLIGHT,
        departure: {
          airport: {
            icao: 'VIDP',
            iata: 'DEL',
            name: 'Indira Gandhi International Airport',
            timezone: 'Asia/Kolkata',
          },
          terminal: '3',
          scheduledTime: { scheduled: '2025-01-15T14:30:00' },
        },
      }
      httpService.request.mockReturnValue(of(mockAxiosResponse([flightInIndia])))

      const result = await provider.search({ flightNumber: 'AA123' })

      expect(result.data![0]!.departure.scheduledTime?.local).toBe('2025-01-15T14:30:00')
      // 14:30 IST (GMT+5:30) = 09:00 UTC
      expect(result.data![0]!.departure.scheduledTime?.utc).toBe('2025-01-15T09:00:00.000Z')
    })

    it('should handle naive time without timezone gracefully', async () => {
      const flightNoTz: AerodataboxFlightResponse = {
        ...SAMPLE_FLIGHT,
        departure: {
          airport: {
            icao: 'KJFK',
            iata: 'JFK',
            name: 'John F. Kennedy International Airport',
            // No timezone provided
          },
          terminal: '1',
          scheduledTime: { scheduled: '2025-01-15T14:30:00' },
        },
      }
      httpService.request.mockReturnValue(of(mockAxiosResponse([flightNoTz])))

      const result = await provider.search({ flightNumber: 'AA123' })

      // Should still have local time, UTC may be undefined
      expect(result.data![0]!.departure.scheduledTime?.local).toBe('2025-01-15T14:30:00')
    })
  })
})
