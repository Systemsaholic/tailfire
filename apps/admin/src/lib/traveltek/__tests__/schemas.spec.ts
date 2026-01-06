/**
 * Tests for Traveltek JSON Schema Validation
 *
 * Tests Zod schemas with type coercion for Traveltek cruise data.
 */

import {
  TraveltekCruiseSchema,
  TraveltekItineraryPortSchema,
  TraveltekLineContentSchema,
  TraveltekShipContentSchema,
  parseTraveltekCruise,
  safeParseTraveltekCruise,
} from '../schemas'

describe('Traveltek Schemas', () => {
  describe('TraveltekItineraryPortSchema', () => {
    it('should coerce string numbers to integers', () => {
      const input = {
        id: 1,
        day: '3', // string
        orderid: '5', // string
        portid: 123,
        name: 'Miami',
        itineraryname: 'Miami, Florida',
        arrivedate: '2024-01-15',
        departdate: '2024-01-15',
        arrivetime: '08:00',
        departtime: '17:00',
        latitude: '25.7617',
        longitude: '-80.1918',
      }

      const result = TraveltekItineraryPortSchema.parse(input)

      expect(result.day).toBe(3)
      expect(typeof result.day).toBe('number')
      expect(result.orderid).toBe(5)
      expect(typeof result.orderid).toBe('number')
    })

    it('should accept numeric values directly', () => {
      const input = {
        id: 1,
        day: 3,
        orderid: 5,
        portid: 123,
        name: 'Miami',
        itineraryname: 'Miami, Florida',
        arrivedate: '2024-01-15',
        departdate: '2024-01-15',
        arrivetime: '08:00',
        departtime: '17:00',
        latitude: '25.7617',
        longitude: '-80.1918',
      }

      const result = TraveltekItineraryPortSchema.parse(input)

      expect(result.day).toBe(3)
      expect(result.orderid).toBe(5)
    })

    it('should preserve nullable description', () => {
      const input = {
        id: 1,
        day: 1,
        orderid: 1,
        portid: 123,
        name: 'Port',
        itineraryname: 'Port Name',
        arrivedate: '2024-01-15',
        departdate: '2024-01-15',
        arrivetime: '08:00',
        departtime: '17:00',
        description: 'A lovely port',
        latitude: null,
        longitude: null,
      }

      const result = TraveltekItineraryPortSchema.parse(input)

      expect(result.description).toBe('A lovely port')
    })
  })

  describe('TraveltekLineContentSchema', () => {
    it('should transform empty string code to null', () => {
      const input = {
        id: 1,
        name: 'Royal Caribbean',
        code: '', // empty string
      }

      const result = TraveltekLineContentSchema.parse(input)

      expect(result.code).toBeNull()
    })

    it('should preserve non-empty code', () => {
      const input = {
        id: 1,
        name: 'Royal Caribbean',
        code: 'RCL',
      }

      const result = TraveltekLineContentSchema.parse(input)

      expect(result.code).toBe('RCL')
    })

    it('should accept null description', () => {
      const input = {
        id: 1,
        name: 'Royal Caribbean',
        code: 'RCL',
        description: null,
      }

      const result = TraveltekLineContentSchema.parse(input)

      expect(result.description).toBeNull()
    })
  })

  describe('TraveltekShipContentSchema', () => {
    it('should accept nullable shipclass', () => {
      const input = {
        id: 1,
        name: 'Wonder of the Seas',
        shipclass: null,
      }

      const result = TraveltekShipContentSchema.parse(input)

      expect(result.shipclass).toBeNull()
    })

    it('should preserve shipclass when provided', () => {
      const input = {
        id: 1,
        name: 'Wonder of the Seas',
        shipclass: 'Oasis',
      }

      const result = TraveltekShipContentSchema.parse(input)

      expect(result.shipclass).toBe('Oasis')
    })
  })

  describe('TraveltekCruiseSchema', () => {
    const minimalCruise = {
      cruiseid: 2085237,
      voyagecode: 'SY25S09',
      name: 'Caribbean Explorer',
      linecontent: {
        id: 1,
        name: 'Royal Caribbean',
        code: 'RCL',
      },
      shipid: 100,
      shipcontent: {
        id: 100,
        name: 'Symphony of the Seas',
        shipclass: 'Oasis',
      },
      nights: 7,
      startdate: '2024-01-15',
      enddate: '2024-01-22',
      startportid: '378', // string
      startportname: 'Miami',
      endportid: '378', // string
      endportname: 'Miami',
      itinerary: [],
      regions: { '1': 'Caribbean' },
      ports: { '378': 'Miami' },
    }

    it('should coerce string port IDs to numbers', () => {
      const result = TraveltekCruiseSchema.parse(minimalCruise)

      expect(result.startportid).toBe(378)
      expect(typeof result.startportid).toBe('number')
      expect(result.endportid).toBe(378)
      expect(typeof result.endportid).toBe('number')
    })

    it('should clamp negative nights to 0', () => {
      const input = {
        ...minimalCruise,
        nights: -5,
      }

      const result = TraveltekCruiseSchema.parse(input)

      expect(result.nights).toBe(0)
    })

    it('should preserve valid nights', () => {
      const result = TraveltekCruiseSchema.parse(minimalCruise)

      expect(result.nights).toBe(7)
    })

    it('should accept null enddate', () => {
      const input = {
        ...minimalCruise,
        enddate: null,
      }

      const result = TraveltekCruiseSchema.parse(input)

      expect(result.enddate).toBeNull()
    })

    it('should accept null shipcontent', () => {
      const input = {
        ...minimalCruise,
        shipcontent: null,
      }

      const result = TraveltekCruiseSchema.parse(input)

      expect(result.shipcontent).toBeNull()
    })

    it('should accept undefined shipcontent', () => {
      const { shipcontent: _shipcontent, ...rest } = minimalCruise

      const result = TraveltekCruiseSchema.parse(rest)

      expect(result.shipcontent).toBeUndefined()
    })
  })

  describe('parseTraveltekCruise', () => {
    const validCruise = {
      cruiseid: 2085237,
      voyagecode: 'SY25S09',
      name: 'Caribbean Explorer',
      linecontent: {
        id: 1,
        name: 'Royal Caribbean',
        code: 'RCL',
      },
      shipid: 100,
      shipcontent: null,
      nights: 7,
      startdate: '2024-01-15',
      enddate: '2024-01-22',
      startportid: 378,
      startportname: 'Miami',
      endportid: 378,
      endportname: 'Miami',
      itinerary: [],
      regions: {},
      ports: {},
    }

    it('should parse valid cruise data', () => {
      const result = parseTraveltekCruise(validCruise)

      expect(result.cruiseid).toBe(2085237)
      expect(result.voyagecode).toBe('SY25S09')
    })

    it('should throw on invalid data', () => {
      const invalid = { ...validCruise, cruiseid: 'not-a-number' }

      expect(() => parseTraveltekCruise(invalid)).toThrow()
    })
  })

  describe('safeParseTraveltekCruise', () => {
    const validCruise = {
      cruiseid: 2085237,
      voyagecode: 'SY25S09',
      name: 'Caribbean Explorer',
      linecontent: {
        id: 1,
        name: 'Royal Caribbean',
        code: 'RCL',
      },
      shipid: 100,
      shipcontent: null,
      nights: 7,
      startdate: '2024-01-15',
      enddate: '2024-01-22',
      startportid: 378,
      startportname: 'Miami',
      endportid: 378,
      endportname: 'Miami',
      itinerary: [],
      regions: {},
      ports: {},
    }

    it('should return success for valid data', () => {
      const result = safeParseTraveltekCruise(validCruise)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cruiseid).toBe(2085237)
      }
    })

    it('should return failure for invalid data', () => {
      const invalid = { ...validCruise, cruiseid: 'not-a-number' }

      const result = safeParseTraveltekCruise(invalid)

      expect(result.success).toBe(false)
    })

    it('should return failure for missing required fields', () => {
      const invalid = { cruiseid: 123 }

      const result = safeParseTraveltekCruise(invalid)

      expect(result.success).toBe(false)
    })
  })
})
