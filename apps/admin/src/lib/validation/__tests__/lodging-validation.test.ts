/**
 * Lodging Validation Schema Tests
 *
 * Tests for lodging form Zod schema and default value hydration.
 * All dates use UTC to avoid timezone-related test flakes.
 */

import { describe, it, expect } from 'vitest'
import { lodgingFormSchema, toLodgingDefaults } from '../lodging-validation'

describe('lodgingFormSchema', () => {
  // ============================================================================
  // Valid Data Tests
  // ============================================================================

  it('parses valid data correctly', () => {
    const validData = {
      itineraryDayId: 'day-123',
      componentType: 'lodging' as const,
      name: 'Grand Hotel',
      description: 'A lovely hotel',
      status: 'confirmed' as const,
      lodgingDetails: {
        propertyName: 'Grand Hotel Paris',
        address: '123 Main St',
        phone: '+1-555-0100',
        website: 'https://hotel.com',
        checkInDate: new Date('2025-01-15T00:00:00Z'),
        checkInTime: '15:00',
        checkOutDate: new Date('2025-01-18T00:00:00Z'),
        checkOutTime: '11:00',
        timezone: 'Europe/Paris',
        roomType: 'deluxe',
        roomCount: 2,
        amenities: ['WiFi', 'Pool'],
        specialRequests: 'Early check-in',
      },
      totalPriceCents: 50000,
      taxesAndFeesCents: 5000,
      currency: 'EUR',
      pricingType: 'per_room' as const,
      confirmationNumber: 'ABC123',
      commissionTotalCents: 0,
      commissionSplitPercentage: 0,
      commissionExpectedDate: null,
      termsAndConditions: '',
      cancellationPolicy: '',
      supplier: '',
    }

    const result = lodgingFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.lodgingDetails.propertyName).toBe('Grand Hotel Paris')
      expect(result.data.lodgingDetails.checkInDate).toBeInstanceOf(Date)
    }
  })

  // ============================================================================
  // Required Fields Tests
  // ============================================================================

  it('rejects missing required fields', () => {
    const result = lodgingFormSchema.safeParse({})

    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldPaths = result.error.issues.map((i) => i.path.join('.'))
      expect(fieldPaths).toContain('itineraryDayId')
      // Zod reports nested object as invalid first before drilling into propertyName
      expect(fieldPaths).toContain('lodgingDetails')
    }
  })

  it('rejects missing required fields in lodgingDetails', () => {
    const result = lodgingFormSchema.safeParse({
      itineraryDayId: 'day-123',
      lodgingDetails: {
        // Missing propertyName, checkInDate, checkOutDate
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldPaths = result.error.issues.map((i) => i.path.join('.'))
      expect(fieldPaths).toContain('lodgingDetails.propertyName')
      expect(fieldPaths).toContain('lodgingDetails.checkInDate')
      expect(fieldPaths).toContain('lodgingDetails.checkOutDate')
    }
  })

  it('rejects empty property name', () => {
    const result = lodgingFormSchema.safeParse({
      itineraryDayId: 'day-123',
      lodgingDetails: {
        propertyName: '',
        checkInDate: new Date('2025-01-15T00:00:00Z'),
        checkOutDate: new Date('2025-01-18T00:00:00Z'),
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const propertyNameError = result.error.issues.find(
        (i) => i.path.join('.') === 'lodgingDetails.propertyName'
      )
      expect(propertyNameError).toBeDefined()
      expect(propertyNameError?.message).toBe('Property name is required')
    }
  })

  // ============================================================================
  // Date Validation Tests
  // ============================================================================

  it('rejects checkout before checkin', () => {
    const result = lodgingFormSchema.safeParse({
      itineraryDayId: 'day-123',
      lodgingDetails: {
        propertyName: 'Test Hotel',
        checkInDate: new Date('2025-01-18T00:00:00Z'),
        checkOutDate: new Date('2025-01-15T00:00:00Z'), // Before check-in!
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const checkoutError = result.error.issues.find(
        (i) => i.path.join('.') === 'lodgingDetails.checkOutDate'
      )
      expect(checkoutError).toBeDefined()
      expect(checkoutError?.message).toBe('Check-out date must be after check-in date')
    }
  })

  it('rejects invalid date strings', () => {
    const result = lodgingFormSchema.safeParse({
      itineraryDayId: 'day-123',
      lodgingDetails: {
        propertyName: 'Test Hotel',
        checkInDate: 'not-a-date',
        checkOutDate: '2025-01-18',
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const dateError = result.error.issues.find(
        (i) => i.path.join('.') === 'lodgingDetails.checkInDate'
      )
      expect(dateError).toBeDefined()
    }
  })

  it('handles date coercion from strings', () => {
    const result = lodgingFormSchema.safeParse({
      itineraryDayId: 'day-123',
      lodgingDetails: {
        propertyName: 'Test Hotel',
        checkInDate: '2025-01-15T00:00:00Z',
        checkOutDate: '2025-01-18T00:00:00Z',
      },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.lodgingDetails.checkInDate).toBeInstanceOf(Date)
      expect(result.data.lodgingDetails.checkOutDate).toBeInstanceOf(Date)
    }
  })

  // ============================================================================
  // Number Coercion Tests
  // ============================================================================

  it('coerces string numbers to number for pricing fields', () => {
    const result = lodgingFormSchema.safeParse({
      itineraryDayId: 'day-123',
      lodgingDetails: {
        propertyName: 'Test Hotel',
        checkInDate: new Date('2025-01-15T00:00:00Z'),
        checkOutDate: new Date('2025-01-18T00:00:00Z'),
      },
      totalPriceCents: '10000', // String instead of number
      taxesAndFeesCents: '500',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.totalPriceCents).toBe(10000)
      expect(result.data.taxesAndFeesCents).toBe(500)
    }
  })

  it('rejects NaN number inputs', () => {
    const result = lodgingFormSchema.safeParse({
      itineraryDayId: 'day-123',
      lodgingDetails: {
        propertyName: 'Test Hotel',
        checkInDate: new Date('2025-01-15T00:00:00Z'),
        checkOutDate: new Date('2025-01-18T00:00:00Z'),
      },
      totalPriceCents: 'abc', // Invalid number
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const priceError = result.error.issues.find(
        (i) => i.path.includes('totalPriceCents')
      )
      expect(priceError).toBeDefined()
    }
  })

  it('rejects negative prices', () => {
    const result = lodgingFormSchema.safeParse({
      itineraryDayId: 'day-123',
      lodgingDetails: {
        propertyName: 'Test Hotel',
        checkInDate: new Date('2025-01-15T00:00:00Z'),
        checkOutDate: new Date('2025-01-18T00:00:00Z'),
      },
      totalPriceCents: -100,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const priceError = result.error.issues.find(
        (i) => i.path.includes('totalPriceCents')
      )
      expect(priceError).toBeDefined()
      expect(priceError?.message).toBe('Price cannot be negative')
    }
  })
})

describe('toLodgingDefaults', () => {
  // ============================================================================
  // Default Hydration Tests
  // ============================================================================

  it('creates valid defaults with no server data', () => {
    const defaults = toLodgingDefaults(null)

    expect(defaults.itineraryDayId).toBe('')
    expect(defaults.componentType).toBe('lodging')
    expect(defaults.lodgingDetails.propertyName).toBe('')
    expect(defaults.lodgingDetails.checkInDate).toBeInstanceOf(Date)
    expect(defaults.lodgingDetails.checkOutDate).toBeInstanceOf(Date)

    // Checkout should be after checkin
    expect(defaults.lodgingDetails.checkOutDate.getTime()).toBeGreaterThan(
      defaults.lodgingDetails.checkInDate.getTime()
    )
  })

  it('defaults checkout to day after checkin', () => {
    const defaults = toLodgingDefaults(null)

    const checkInTime = defaults.lodgingDetails.checkInDate.getTime()
    const checkOutTime = defaults.lodgingDetails.checkOutDate.getTime()
    const oneDayMs = 24 * 60 * 60 * 1000

    // Checkout should be approximately 1 day after checkin
    expect(checkOutTime - checkInTime).toBeGreaterThanOrEqual(oneDayMs - 1000)
    expect(checkOutTime - checkInTime).toBeLessThanOrEqual(oneDayMs + 1000)
  })

  it('respects dayDate parameter for checkin', () => {
    const dayDate = '2025-06-15'
    const defaults = toLodgingDefaults(null, dayDate)

    expect(defaults.lodgingDetails.checkInDate.toISOString()).toContain('2025-06-15')
  })

  it('handles undefined server payload', () => {
    const defaults = toLodgingDefaults(undefined)

    expect(defaults.itineraryDayId).toBe('')
    expect(defaults.lodgingDetails.propertyName).toBe('')
  })

  it('hydrates from server data correctly', () => {
    const serverData = {
      itineraryDayId: 'day-456',
      name: 'Loaded Hotel',
      description: 'From server',
      status: 'confirmed' as const,
      lodgingDetails: {
        propertyName: 'Server Hotel',
        address: 'Server Address',
        checkInDate: new Date('2025-03-10T00:00:00Z'),
        checkOutDate: new Date('2025-03-15T00:00:00Z'),
      },
      totalPriceCents: 25000,
      currency: 'EUR',
    }

    const defaults = toLodgingDefaults(serverData as any)

    expect(defaults.itineraryDayId).toBe('day-456')
    expect(defaults.lodgingDetails.propertyName).toBe('Server Hotel')
    expect(defaults.lodgingDetails.address).toBe('Server Address')
    expect(defaults.totalPriceCents).toBe(25000)
    expect(defaults.currency).toBe('EUR')
  })

  it('handles invalid server date strings with fallback', () => {
    const serverData = {
      itineraryDayId: 'day-789',
      lodgingDetails: {
        propertyName: 'Test Hotel',
        checkInDate: 'bad-date-string', // Invalid
        checkOutDate: '2025-01-18',
      },
    }

    const defaults = toLodgingDefaults(serverData as any)

    // Should fallback to today for invalid date
    expect(defaults.lodgingDetails.checkInDate).toBeInstanceOf(Date)
    expect(Number.isNaN(defaults.lodgingDetails.checkInDate.getTime())).toBe(false)

    // Checkout should still be after checkin
    expect(defaults.lodgingDetails.checkOutDate.getTime()).toBeGreaterThan(
      defaults.lodgingDetails.checkInDate.getTime()
    )
  })

  it('fixes invalid checkout (before checkin) from server', () => {
    const serverData = {
      itineraryDayId: 'day-fix',
      lodgingDetails: {
        propertyName: 'Fix Hotel',
        checkInDate: new Date('2025-01-20T00:00:00Z'),
        checkOutDate: new Date('2025-01-15T00:00:00Z'), // Before check-in!
      },
    }

    const defaults = toLodgingDefaults(serverData as any)

    // Should fix checkout to be after checkin
    expect(defaults.lodgingDetails.checkOutDate.getTime()).toBeGreaterThan(
      defaults.lodgingDetails.checkInDate.getTime()
    )
  })

  it('validates against schema after hydration', () => {
    const defaults = toLodgingDefaults(null)

    // The defaults alone won't be valid (empty propertyName, itineraryDayId)
    // but they should at least pass date validation
    const partialResult = lodgingFormSchema.safeParse({
      ...defaults,
      itineraryDayId: 'day-test',
      lodgingDetails: {
        ...defaults.lodgingDetails,
        propertyName: 'Test Hotel',
      },
    })

    expect(partialResult.success).toBe(true)
  })

  // ============================================================================
  // Commission Expected Date Hydration Tests
  // ============================================================================

  it('parses commissionExpectedDate string to Date', () => {
    const serverData = {
      itineraryDayId: 'day-commission',
      lodgingDetails: {
        propertyName: 'Commission Hotel',
        checkInDate: new Date('2025-03-01T00:00:00Z'),
        checkOutDate: new Date('2025-03-05T00:00:00Z'),
      },
      commissionExpectedDate: '2025-04-15', // String from server
    }

    const defaults = toLodgingDefaults(serverData as any)

    expect(defaults.commissionExpectedDate).toBeInstanceOf(Date)
    expect(defaults.commissionExpectedDate?.toISOString()).toContain('2025-04-15')
  })

  it('handles null commissionExpectedDate', () => {
    const serverData = {
      itineraryDayId: 'day-null-commission',
      lodgingDetails: {
        propertyName: 'Null Commission Hotel',
        checkInDate: new Date('2025-03-01T00:00:00Z'),
        checkOutDate: new Date('2025-03-05T00:00:00Z'),
      },
      commissionExpectedDate: null,
    }

    const defaults = toLodgingDefaults(serverData as any)

    expect(defaults.commissionExpectedDate).toBeNull()
  })

  it('handles undefined commissionExpectedDate', () => {
    const serverData = {
      itineraryDayId: 'day-undef-commission',
      lodgingDetails: {
        propertyName: 'Undefined Commission Hotel',
        checkInDate: new Date('2025-03-01T00:00:00Z'),
        checkOutDate: new Date('2025-03-05T00:00:00Z'),
      },
      // commissionExpectedDate not provided
    }

    const defaults = toLodgingDefaults(serverData as any)

    expect(defaults.commissionExpectedDate).toBeNull()
  })

  it('handles invalid commissionExpectedDate string with fallback', () => {
    const serverData = {
      itineraryDayId: 'day-invalid-commission',
      lodgingDetails: {
        propertyName: 'Invalid Commission Hotel',
        checkInDate: new Date('2025-03-01T00:00:00Z'),
        checkOutDate: new Date('2025-03-05T00:00:00Z'),
      },
      commissionExpectedDate: 'not-a-date', // Invalid string
    }

    const defaults = toLodgingDefaults(serverData as any)

    // Should fallback to current date (not NaN)
    expect(defaults.commissionExpectedDate).toBeInstanceOf(Date)
    expect(Number.isNaN(defaults.commissionExpectedDate?.getTime())).toBe(false)
  })
})
