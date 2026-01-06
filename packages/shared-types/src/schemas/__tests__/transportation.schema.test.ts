import { transportationDetailsDtoSchema } from '../transportation.schema'
import { transportationSubtypeSchema } from '../enums.schema'

describe('transportationSubtypeSchema', () => {
  it('should accept valid transportation subtypes', () => {
    expect(transportationSubtypeSchema.safeParse('transfer').success).toBe(true)
    expect(transportationSubtypeSchema.safeParse('car_rental').success).toBe(true)
    expect(transportationSubtypeSchema.safeParse('private_car').success).toBe(true)
    expect(transportationSubtypeSchema.safeParse('taxi').success).toBe(true)
    expect(transportationSubtypeSchema.safeParse('shuttle').success).toBe(true)
    expect(transportationSubtypeSchema.safeParse('train').success).toBe(true)
    expect(transportationSubtypeSchema.safeParse('ferry').success).toBe(true)
    expect(transportationSubtypeSchema.safeParse('bus').success).toBe(true)
    expect(transportationSubtypeSchema.safeParse('limousine').success).toBe(true)
  })

  it('should reject invalid transportation subtypes', () => {
    const result = transportationSubtypeSchema.safeParse('airplane')
    expect(result.success).toBe(false)
  })
})

describe('transportationDetailsDtoSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = transportationDetailsDtoSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should accept full valid payload', () => {
    const payload = {
      subtype: 'transfer',
      providerName: 'Airport Shuttle Co',
      providerPhone: '+1-555-123-4567',
      providerEmail: 'shuttle@example.com',
      vehicleType: 'Van',
      vehicleModel: 'Mercedes Sprinter',
      vehicleCapacity: 8,
      licensePlate: 'ABC123',
      pickupDate: '2024-06-15',
      pickupTime: '09:00',
      pickupTimezone: 'America/New_York',
      pickupAddress: '123 Airport Rd',
      pickupNotes: 'Wait at arrivals',
      dropoffDate: '2024-06-15',
      dropoffTime: '10:30',
      dropoffTimezone: 'America/New_York',
      dropoffAddress: '456 Hotel St',
      dropoffNotes: 'Main entrance',
      driverName: 'John Driver',
      driverPhone: '+1-555-987-6543',
      features: ['wifi', 'luggage', 'air_conditioning'],
      specialRequests: 'Child seat needed',
      flightNumber: 'AA123',
      isRoundTrip: true,
    }
    const result = transportationDetailsDtoSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should accept null values for nullable fields', () => {
    const payload = {
      subtype: null,
      providerName: null,
      providerPhone: null,
      providerEmail: null,
      vehicleType: null,
      vehicleModel: null,
      vehicleCapacity: null,
      licensePlate: null,
      pickupDate: null,
      pickupTime: null,
      pickupTimezone: null,
      pickupAddress: null,
      pickupNotes: null,
      dropoffDate: null,
      dropoffTime: null,
      dropoffTimezone: null,
      dropoffAddress: null,
      dropoffNotes: null,
      driverName: null,
      driverPhone: null,
      features: null,
      specialRequests: null,
      flightNumber: null,
      isRoundTrip: null,
    }
    const result = transportationDetailsDtoSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should reject invalid subtype', () => {
    const result = transportationDetailsDtoSchema.safeParse({ subtype: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('should accept car rental specific fields', () => {
    const payload = {
      subtype: 'car_rental',
      rentalPickupLocation: 'Airport Terminal A',
      rentalDropoffLocation: 'Downtown Office',
      rentalInsuranceType: 'Full Coverage',
      rentalMileageLimit: 'Unlimited',
    }
    const result = transportationDetailsDtoSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should accept null for car rental fields', () => {
    const payload = {
      subtype: 'car_rental',
      rentalPickupLocation: null,
      rentalDropoffLocation: null,
      rentalInsuranceType: null,
      rentalMileageLimit: null,
    }
    const result = transportationDetailsDtoSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('should accept empty features array', () => {
    const result = transportationDetailsDtoSchema.safeParse({ features: [] })
    expect(result.success).toBe(true)
  })

  it('should reject non-array features', () => {
    const result = transportationDetailsDtoSchema.safeParse({ features: 'wifi' })
    expect(result.success).toBe(false)
  })

  it('should accept boolean isRoundTrip', () => {
    expect(transportationDetailsDtoSchema.safeParse({ isRoundTrip: true }).success).toBe(true)
    expect(transportationDetailsDtoSchema.safeParse({ isRoundTrip: false }).success).toBe(true)
  })

  it('should reject non-boolean isRoundTrip', () => {
    const result = transportationDetailsDtoSchema.safeParse({ isRoundTrip: 1 })
    expect(result.success).toBe(false)
  })

  it('should reject non-integer vehicleCapacity', () => {
    const result = transportationDetailsDtoSchema.safeParse({ vehicleCapacity: 8.5 })
    expect(result.success).toBe(false)
  })

  it('should accept integer vehicleCapacity', () => {
    const result = transportationDetailsDtoSchema.safeParse({ vehicleCapacity: 8 })
    expect(result.success).toBe(true)
  })

  it('should accept zero vehicleCapacity (no positive constraint)', () => {
    // Note: vehicleCapacity intentionally has no positive() constraint to match existing DTO
    const result = transportationDetailsDtoSchema.safeParse({ vehicleCapacity: 0 })
    expect(result.success).toBe(true)
  })
})
