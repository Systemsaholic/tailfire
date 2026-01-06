/**
 * Tests for Date Utilities (Shared Package)
 *
 * Tests the shared date utilities used across the platform.
 */

import { describe, it, expect } from 'vitest'
import { dateUtils } from '../date-utils'

describe('dateUtils', () => {
  describe('isValidTimezone', () => {
    it('should return true for valid IANA timezones', () => {
      expect(dateUtils.isValidTimezone('America/Toronto')).toBe(true)
      expect(dateUtils.isValidTimezone('Europe/London')).toBe(true)
      expect(dateUtils.isValidTimezone('Asia/Tokyo')).toBe(true)
      expect(dateUtils.isValidTimezone('UTC')).toBe(true)
    })

    it('should return false for invalid timezones', () => {
      expect(dateUtils.isValidTimezone('Invalid/Timezone')).toBe(false)
      expect(dateUtils.isValidTimezone('EST')).toBe(false) // Abbreviations not allowed
      expect(dateUtils.isValidTimezone('')).toBe(false)
      expect(dateUtils.isValidTimezone('America/Invalid')).toBe(false)
    })

    it('should be case-sensitive', () => {
      expect(dateUtils.isValidTimezone('america/toronto')).toBe(false)
      expect(dateUtils.isValidTimezone('AMERICA/TORONTO')).toBe(false)
    })
  })

  describe('getAllTimezones', () => {
    it('should return an array of valid timezones', () => {
      const timezones = dateUtils.getAllTimezones()

      expect(Array.isArray(timezones)).toBe(true)
      expect(timezones.length).toBeGreaterThan(0)

      // Verify all returned timezones are valid
      timezones.forEach((tz) => {
        expect(dateUtils.isValidTimezone(tz)).toBe(true)
      })
    })

    it('should include common timezones', () => {
      const timezones = dateUtils.getAllTimezones()

      expect(timezones).toContain('America/New_York')
      expect(timezones).toContain('America/Toronto')
      expect(timezones).toContain('Europe/London')
      expect(timezones).toContain('Asia/Tokyo')
      expect(timezones).toContain('UTC')
    })
  })

  describe('getTimezoneOffset', () => {
    it('should return offset in minutes for a timezone', () => {
      // UTC should have offset of 0
      expect(dateUtils.getTimezoneOffset('UTC')).toBe(0)

      // New York is UTC-5 (EST) or UTC-4 (EDT)
      const nyOffset = dateUtils.getTimezoneOffset('America/New_York')
      expect(nyOffset).toBeGreaterThanOrEqual(-300) // -5 hours = -300 minutes
      expect(nyOffset).toBeLessThanOrEqual(-240) // -4 hours = -240 minutes
    })

    it('should handle invalid timezones gracefully', () => {
      // Should return 0 or throw - implementation dependent
      const result = dateUtils.getTimezoneOffset('Invalid/Timezone')
      expect(typeof result).toBe('number')
    })
  })

  describe('formatTimezoneOffset', () => {
    it('should format positive offsets correctly', () => {
      expect(dateUtils.formatTimezoneOffset(330)).toBe('+05:30') // India
      expect(dateUtils.formatTimezoneOffset(60)).toBe('+01:00')
    })

    it('should format negative offsets correctly', () => {
      expect(dateUtils.formatTimezoneOffset(-300)).toBe('-05:00') // EST
      expect(dateUtils.formatTimezoneOffset(-240)).toBe('-04:00') // EDT
    })

    it('should format zero offset correctly', () => {
      expect(dateUtils.formatTimezoneOffset(0)).toBe('+00:00') // UTC
    })

    it('should handle non-hour offsets', () => {
      expect(dateUtils.formatTimezoneOffset(345)).toBe('+05:45') // Nepal
      expect(dateUtils.formatTimezoneOffset(-570)).toBe('-09:30') // Marquesas Islands
    })
  })
})
