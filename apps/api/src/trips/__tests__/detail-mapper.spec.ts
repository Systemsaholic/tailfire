/**
 * Unit Tests: Detail Mapper Utilities
 *
 * Tests coercion helpers and build functions used by detail services.
 * Ensures correct behavior for create vs update semantics.
 */

import {
  coerce,
  buildCreateValues,
  buildUpdateSet,
  formatFields,
} from '../detail-mapper'

describe('Detail Mapper Utilities', () => {
  // ============================================================================
  // Coercion Helpers
  // ============================================================================

  describe('coerce.toNullable', () => {
    it('converts empty string to null', () => {
      expect(coerce.toNullable('')).toBeNull()
    })

    it('converts 0 to null', () => {
      expect(coerce.toNullable(0)).toBeNull()
    })

    it('converts false to null', () => {
      expect(coerce.toNullable(false)).toBeNull()
    })

    it('converts null to null', () => {
      expect(coerce.toNullable(null)).toBeNull()
    })

    it('converts undefined to null', () => {
      expect(coerce.toNullable(undefined)).toBeNull()
    })

    it('keeps truthy string values', () => {
      expect(coerce.toNullable('abc')).toBe('abc')
    })

    it('keeps truthy number values', () => {
      expect(coerce.toNullable(42)).toBe(42)
    })

    it('keeps true', () => {
      expect(coerce.toNullable(true)).toBe(true)
    })
  })

  describe('coerce.toNullableStrict', () => {
    it('preserves empty string', () => {
      expect(coerce.toNullableStrict('')).toBe('')
    })

    it('preserves 0', () => {
      expect(coerce.toNullableStrict(0)).toBe(0)
    })

    it('preserves false', () => {
      expect(coerce.toNullableStrict(false)).toBe(false)
    })

    it('converts null to null', () => {
      expect(coerce.toNullableStrict(null)).toBeNull()
    })

    it('converts undefined to null', () => {
      expect(coerce.toNullableStrict(undefined)).toBeNull()
    })

    it('keeps truthy values', () => {
      expect(coerce.toNullableStrict('abc')).toBe('abc')
    })
  })

  describe('coerce.toArray', () => {
    it('converts null to empty array', () => {
      expect(coerce.toArray(null)).toEqual([])
    })

    it('converts undefined to empty array', () => {
      expect(coerce.toArray(undefined)).toEqual([])
    })

    it('keeps existing array', () => {
      expect(coerce.toArray([1, 2])).toEqual([1, 2])
    })

    it('keeps empty array', () => {
      expect(coerce.toArray([])).toEqual([])
    })
  })

  describe('coerce.toBoolInt', () => {
    it('converts true to 1', () => {
      expect(coerce.toBoolInt(true)).toBe(1)
    })

    it('converts false to 0', () => {
      expect(coerce.toBoolInt(false)).toBe(0)
    })

    it('converts null to 0', () => {
      expect(coerce.toBoolInt(null)).toBe(0)
    })

    it('converts undefined to 0', () => {
      expect(coerce.toBoolInt(undefined)).toBe(0)
    })
  })

  describe('coerce.fromBoolInt', () => {
    it('converts 1 to true', () => {
      expect(coerce.fromBoolInt(1)).toBe(true)
    })

    it('converts 0 to false', () => {
      expect(coerce.fromBoolInt(0)).toBe(false)
    })

    it('converts null to false', () => {
      expect(coerce.fromBoolInt(null)).toBe(false)
    })

    it('converts undefined to false', () => {
      expect(coerce.fromBoolInt(undefined)).toBe(false)
    })

    it('converts non-1 numbers to false', () => {
      expect(coerce.fromBoolInt(2)).toBe(false)
      expect(coerce.fromBoolInt(-1)).toBe(false)
    })
  })

  describe('coerce.identity', () => {
    it('passes through empty string', () => {
      expect(coerce.identity('')).toBe('')
    })

    it('passes through 0', () => {
      expect(coerce.identity(0)).toBe(0)
    })

    it('passes through null', () => {
      expect(coerce.identity(null)).toBeNull()
    })

    it('passes through undefined', () => {
      expect(coerce.identity(undefined)).toBeUndefined()
    })

    it('passes through truthy values', () => {
      expect(coerce.identity('abc')).toBe('abc')
      expect(coerce.identity(42)).toBe(42)
    })
  })

  // ============================================================================
  // Build Helpers
  // ============================================================================

  describe('buildCreateValues', () => {
    const fieldMap = {
      name: coerce.toNullable,
      features: coerce.toArray,
      isActive: coerce.toBoolInt,
    }

    it('applies transforms to all fields', () => {
      const data = { name: 'Test', features: ['a', 'b'], isActive: true }
      const result = buildCreateValues(data, fieldMap)

      expect(result).toEqual({
        name: 'Test',
        features: ['a', 'b'],
        isActive: 1,
      })
    })

    it('applies transforms even when data has undefined values', () => {
      const data = { name: undefined, features: undefined, isActive: undefined }
      const result = buildCreateValues(data, fieldMap)

      expect(result).toEqual({
        name: null,
        features: [],
        isActive: 0,
      })
    })

    it('converts empty string to null via toNullable', () => {
      const data = { name: '', features: [], isActive: false }
      const result = buildCreateValues(data, fieldMap)

      expect(result).toEqual({
        name: null,
        features: [],
        isActive: 0,
      })
    })

    it('does NOT add updatedAt', () => {
      const data = { name: 'Test', features: [], isActive: true }
      const result = buildCreateValues(data, fieldMap)

      expect(result).not.toHaveProperty('updatedAt')
    })
  })

  describe('buildUpdateSet', () => {
    const fieldMap = {
      name: coerce.identity,
      features: coerce.identity,
      isRoundTrip: coerce.toBoolInt, // Always converts even on update
    }

    it('only includes defined keys', () => {
      const data = { name: 'Updated' } as Record<string, unknown>
      const result = buildUpdateSet(data, fieldMap)

      expect(result).toHaveProperty('name', 'Updated')
      expect(result).not.toHaveProperty('features')
      expect(result).not.toHaveProperty('isRoundTrip')
    })

    it('preserves empty string with identity transform', () => {
      const data = { name: '' }
      const result = buildUpdateSet(data, fieldMap)

      expect(result.name).toBe('')
    })

    it('preserves 0 with identity transform', () => {
      const data = { features: 0 } as unknown as Record<string, unknown>
      const result = buildUpdateSet(data, fieldMap)

      expect(result.features).toBe(0)
    })

    it('adds updatedAt by default', () => {
      const data = { name: 'Test' }
      const result = buildUpdateSet(data, fieldMap)

      expect(result).toHaveProperty('updatedAt')
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('omits updatedAt when includeUpdatedAt is false', () => {
      const data = { name: 'Test' }
      const result = buildUpdateSet(data, fieldMap, { includeUpdatedAt: false })

      expect(result).not.toHaveProperty('updatedAt')
    })

    it('applies transform for fields that need it (isRoundTrip)', () => {
      const data = { isRoundTrip: true }
      const result = buildUpdateSet(data, fieldMap)

      expect(result.isRoundTrip).toBe(1)
    })

    it('produces sparse update with only provided fields', () => {
      const data = { name: 'AA' }
      const result = buildUpdateSet(data, fieldMap)

      // Should only have name and updatedAt
      const keys = Object.keys(result)
      expect(keys).toHaveLength(2)
      expect(keys).toContain('name')
      expect(keys).toContain('updatedAt')
    })

    it('excludes undefined fields even if explicitly set', () => {
      const data = { name: 'Test', features: undefined }
      const result = buildUpdateSet(data, fieldMap)

      expect(result).toHaveProperty('name')
      expect(result).not.toHaveProperty('features')
    })
  })

  describe('formatFields', () => {
    const fieldMap = {
      name: coerce.toNullable,
      features: coerce.toArray,
      isRoundTrip: coerce.fromBoolInt,
    }

    it('applies transforms to all fields', () => {
      const data = { name: 'Test', features: ['a'], isRoundTrip: 1 }
      const result = formatFields(data, fieldMap)

      expect(result).toEqual({
        name: 'Test',
        features: ['a'],
        isRoundTrip: true,
      })
    })

    it('handles missing keys by passing undefined to transform', () => {
      const data = {} as Record<string, unknown>
      const result = formatFields(data, fieldMap)

      expect(result).toEqual({
        name: null, // toNullable(undefined) → null
        features: [], // toArray(undefined) → []
        isRoundTrip: false, // fromBoolInt(undefined) → false
      })
    })

    it('converts database integers to booleans', () => {
      const data = { name: 'Test', features: [], isRoundTrip: 0 }
      const result = formatFields(data, fieldMap)

      expect(result.isRoundTrip).toBe(false)
    })

    it('applies toNullable to falsy values from DB', () => {
      const data = { name: '', features: null, isRoundTrip: 1 }
      const result = formatFields(data, fieldMap)

      expect(result.name).toBeNull()
      expect(result.features).toEqual([])
    })
  })
})
