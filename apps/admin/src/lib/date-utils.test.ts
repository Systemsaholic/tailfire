import { describe, it, expect } from 'vitest'
import {
  isDateOutOfTripRange,
  parseISODate,
  formatISODate,
  getDefaultMonthHint,
  findDayForDate,
  normalizeToDateString,
  type DayInfo,
} from './date-utils'

describe('isDateOutOfTripRange', () => {
  const tripStart = '2025-01-01'
  const tripEnd = '2025-01-10'

  describe('within range', () => {
    it('returns false when date is within range', () => {
      expect(isDateOutOfTripRange('2025-01-05', tripStart, tripEnd)).toBe(false)
    })

    it('returns false for start boundary date (inclusive)', () => {
      expect(isDateOutOfTripRange('2025-01-01', tripStart, tripEnd)).toBe(false)
    })

    it('returns false for end boundary date (inclusive)', () => {
      expect(isDateOutOfTripRange('2025-01-10', tripStart, tripEnd)).toBe(false)
    })
  })

  describe('outside range', () => {
    it('returns true when date is before trip start', () => {
      expect(isDateOutOfTripRange('2024-12-31', tripStart, tripEnd)).toBe(true)
    })

    it('returns true when date is after trip end', () => {
      expect(isDateOutOfTripRange('2025-01-11', tripStart, tripEnd)).toBe(true)
    })
  })

  describe('invalid inputs (no warning)', () => {
    it('returns false when date is null', () => {
      expect(isDateOutOfTripRange(null, tripStart, tripEnd)).toBe(false)
    })

    it('returns false when date is undefined', () => {
      expect(isDateOutOfTripRange(undefined, tripStart, tripEnd)).toBe(false)
    })

    it('returns false when date is empty string', () => {
      expect(isDateOutOfTripRange('', tripStart, tripEnd)).toBe(false)
    })

    it('returns false when date is whitespace only', () => {
      expect(isDateOutOfTripRange('   ', tripStart, tripEnd)).toBe(false)
    })

    it('returns false when tripStartDate is missing', () => {
      expect(isDateOutOfTripRange('2025-01-05', null, tripEnd)).toBe(false)
    })

    it('returns false when tripEndDate is missing', () => {
      expect(isDateOutOfTripRange('2025-01-05', tripStart, null)).toBe(false)
    })

    it('returns false when both trip dates are missing', () => {
      expect(isDateOutOfTripRange('2025-01-05', null, null)).toBe(false)
    })

    it('returns false when trip dates are inverted', () => {
      // End before start = invalid range, don't show warning
      expect(isDateOutOfTripRange('2025-01-05', '2025-01-10', '2025-01-01')).toBe(false)
    })
  })

  describe('ISO datetime handling', () => {
    it('handles ISO datetime strings within range', () => {
      expect(isDateOutOfTripRange('2025-01-05T14:30:00Z', tripStart, tripEnd)).toBe(false)
    })

    it('handles ISO datetime strings before range', () => {
      expect(isDateOutOfTripRange('2024-12-31T23:59:59Z', tripStart, tripEnd)).toBe(true)
    })

    it('handles ISO datetime strings after range', () => {
      expect(isDateOutOfTripRange('2025-01-11T00:00:01Z', tripStart, tripEnd)).toBe(true)
    })

    it('handles datetime-local format', () => {
      expect(isDateOutOfTripRange('2025-01-05T14:30', tripStart, tripEnd)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles single-day trip (start equals end)', () => {
      expect(isDateOutOfTripRange('2025-01-01', '2025-01-01', '2025-01-01')).toBe(false)
      expect(isDateOutOfTripRange('2025-01-02', '2025-01-01', '2025-01-01')).toBe(true)
    })

    it('handles trip dates as ISO datetimes', () => {
      // Trip dates can also be normalized
      expect(
        isDateOutOfTripRange('2025-01-05', '2025-01-01T00:00:00Z', '2025-01-10T23:59:59Z')
      ).toBe(false)
    })
  })
})

describe('parseISODate', () => {
  describe('date-only strings (YYYY-MM-DD) → local dates', () => {
    // These tests use string round-trips to be timezone-independent in CI
    it('round-trips correctly: formatISODate(parseISODate(x)) === x', () => {
      expect(formatISODate(parseISODate('2024-02-06'))).toBe('2024-02-06')
      expect(formatISODate(parseISODate('2024-01-01'))).toBe('2024-01-01')
      expect(formatISODate(parseISODate('2024-12-31'))).toBe('2024-12-31')
    })

    it('round-trips year boundaries', () => {
      expect(formatISODate(parseISODate('2023-12-31'))).toBe('2023-12-31')
      expect(formatISODate(parseISODate('2024-01-01'))).toBe('2024-01-01')
    })

    it('round-trips DST boundary dates (local midnight)', () => {
      // March 10, 2024 is DST transition in US
      // Note: This asserts local midnight semantics
      expect(formatISODate(parseISODate('2024-03-10'))).toBe('2024-03-10')
      expect(formatISODate(parseISODate('2024-11-03'))).toBe('2024-11-03') // Fall back
    })
  })

  describe('datetime strings → UTC semantics', () => {
    it('parses ISO datetime with Z as UTC', () => {
      const parsed = parseISODate('2024-02-06T12:00:00Z')
      expect(parsed).not.toBeNull()
      expect(parsed?.toISOString()).toBe('2024-02-06T12:00:00.000Z')
    })

    it('parses ISO datetime with offset correctly', () => {
      const parsed = parseISODate('2024-02-06T12:00:00-05:00')
      expect(parsed).not.toBeNull()
      // Should be 17:00 UTC
      expect(parsed?.getUTCHours()).toBe(17)
    })
  })

  describe('invalid/missing input', () => {
    it('returns null for null', () => {
      expect(parseISODate(null)).toBeNull()
    })

    it('returns null for undefined', () => {
      expect(parseISODate(undefined)).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(parseISODate('')).toBeNull()
    })

    it('returns null for whitespace', () => {
      expect(parseISODate('   ')).toBeNull()
    })

    it('returns null for non-zero-padded dates (rejected by regex)', () => {
      expect(parseISODate('2024-2-6')).toBeNull()
      expect(parseISODate('2024-02-6')).toBeNull()
      expect(parseISODate('2024-2-06')).toBeNull()
    })

    it('returns null for wrong format', () => {
      expect(parseISODate('02/06/2024')).toBeNull()
      expect(parseISODate('Feb 6, 2024')).toBeNull()
    })

    it('returns null for invalid date values', () => {
      expect(parseISODate('2024-02-30')).toBeNull() // Feb 30 doesn't exist
      expect(parseISODate('2024-13-01')).toBeNull() // Month 13
      expect(parseISODate('2024-00-15')).toBeNull() // Month 0
    })

    it('returns null for overflow dates (no silent rollover)', () => {
      // These would silently roll over without the overflow guard
      expect(parseISODate('2024-02-31')).toBeNull() // Would become Mar 2
      expect(parseISODate('2024-04-31')).toBeNull() // Would become May 1
      expect(parseISODate('2024-06-31')).toBeNull() // Would become Jul 1
      expect(parseISODate('2023-02-29')).toBeNull() // 2023 not a leap year
    })

    it('accepts valid leap year date', () => {
      expect(parseISODate('2024-02-29')).not.toBeNull() // 2024 is a leap year
      expect(formatISODate(parseISODate('2024-02-29'))).toBe('2024-02-29')
    })
  })
})

describe('getDefaultMonthHint', () => {
  it('returns Date for valid ISO string', () => {
    const result = getDefaultMonthHint('2025-06-15')
    expect(result).toBeInstanceOf(Date)
    expect(formatISODate(result!)).toBe('2025-06-15')
  })

  it('returns undefined for null', () => {
    expect(getDefaultMonthHint(null)).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(getDefaultMonthHint(undefined)).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(getDefaultMonthHint('')).toBeUndefined()
  })

  it('returns undefined for invalid date', () => {
    expect(getDefaultMonthHint('not-a-date')).toBeUndefined()
  })

  it('returns undefined for invalid ISO date (Feb 30)', () => {
    expect(getDefaultMonthHint('2025-02-30')).toBeUndefined()
  })

  it('handles ISO datetime strings', () => {
    const result = getDefaultMonthHint('2025-06-15T14:30:00Z')
    expect(result).toBeInstanceOf(Date)
  })
})

describe('normalizeToDateString', () => {
  it('returns YYYY-MM-DD for date-only string', () => {
    expect(normalizeToDateString('2025-02-06')).toBe('2025-02-06')
  })

  it('extracts date from ISO datetime string', () => {
    expect(normalizeToDateString('2025-02-06T14:30:00Z')).toBe('2025-02-06')
  })

  it('handles datetime with timezone offset', () => {
    // Note: This may shift date depending on offset and time
    expect(normalizeToDateString('2025-02-06T00:00:00-05:00', 'UTC')).toBe('2025-02-06')
  })

  it('returns empty string for null', () => {
    expect(normalizeToDateString(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(normalizeToDateString(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(normalizeToDateString('')).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(normalizeToDateString('not-a-date')).toBe('')
  })

  it('returns empty string for overflow date', () => {
    expect(normalizeToDateString('2025-02-30')).toBe('')
  })
})

describe('findDayForDate', () => {
  const days: DayInfo[] = [
    { id: 'day-1', date: '2025-02-05', dayNumber: 1 },
    { id: 'day-2', date: '2025-02-06', dayNumber: 2 },
    { id: 'day-3', date: '2025-02-07', dayNumber: 3 },
    { id: 'day-4', date: null, dayNumber: 4 }, // Day without date
  ]

  describe('matching dates', () => {
    it('finds day for exact date match', () => {
      const result = findDayForDate('2025-02-06', days)
      expect(result).toEqual({ dayId: 'day-2', dayNumber: 2 })
    })

    it('finds first day in list', () => {
      const result = findDayForDate('2025-02-05', days)
      expect(result).toEqual({ dayId: 'day-1', dayNumber: 1 })
    })

    it('finds last day with date', () => {
      const result = findDayForDate('2025-02-07', days)
      expect(result).toEqual({ dayId: 'day-3', dayNumber: 3 })
    })
  })

  describe('ISO datetime handling', () => {
    it('matches ISO datetime to date-only day', () => {
      const result = findDayForDate('2025-02-06T14:30:00Z', days)
      expect(result).toEqual({ dayId: 'day-2', dayNumber: 2 })
    })

    it('matches datetime with timezone offset', () => {
      const result = findDayForDate('2025-02-06T10:00:00-05:00', days)
      expect(result).toEqual({ dayId: 'day-2', dayNumber: 2 })
    })
  })

  describe('non-matching dates', () => {
    it('returns null when date does not match any day', () => {
      expect(findDayForDate('2025-02-10', days)).toBeNull()
    })

    it('returns null for date before first day', () => {
      expect(findDayForDate('2025-02-04', days)).toBeNull()
    })

    it('returns null for date after last day', () => {
      expect(findDayForDate('2025-02-08', days)).toBeNull()
    })
  })

  describe('invalid inputs', () => {
    it('returns null for null date', () => {
      expect(findDayForDate(null, days)).toBeNull()
    })

    it('returns null for undefined date', () => {
      expect(findDayForDate(undefined, days)).toBeNull()
    })

    it('returns null for empty string date', () => {
      expect(findDayForDate('', days)).toBeNull()
    })

    it('returns null for null days array', () => {
      expect(findDayForDate('2025-02-06', null)).toBeNull()
    })

    it('returns null for undefined days array', () => {
      expect(findDayForDate('2025-02-06', undefined)).toBeNull()
    })

    it('returns null for empty days array', () => {
      expect(findDayForDate('2025-02-06', [])).toBeNull()
    })

    it('returns null for invalid date string', () => {
      expect(findDayForDate('not-a-date', days)).toBeNull()
    })

    it('returns null for overflow date', () => {
      expect(findDayForDate('2025-02-30', days)).toBeNull()
    })
  })

  describe('days with mixed date formats', () => {
    const mixedDays: DayInfo[] = [
      { id: 'day-1', date: '2025-02-05T00:00:00Z', dayNumber: 1 },
      { id: 'day-2', date: '2025-02-06', dayNumber: 2 },
    ]

    it('matches date-only string to ISO datetime day', () => {
      const result = findDayForDate('2025-02-05', mixedDays)
      expect(result).toEqual({ dayId: 'day-1', dayNumber: 1 })
    })

    it('matches ISO datetime to date-only day', () => {
      const result = findDayForDate('2025-02-06T12:00:00Z', mixedDays)
      expect(result).toEqual({ dayId: 'day-2', dayNumber: 2 })
    })
  })
})
