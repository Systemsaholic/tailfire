import { describe, it, expect } from 'vitest'
import {
  searchAirlines,
  getAirlineByCode,
  formatAirlineDisplay,
  AIRLINES,
} from './airlines-data'

describe('airlines-data', () => {
  describe('AIRLINES', () => {
    it('contains expected airlines', () => {
      expect(AIRLINES.length).toBeGreaterThan(80)

      // Check some known airlines exist
      const codes = AIRLINES.map(a => a.code)
      expect(codes).toContain('AC') // Air Canada
      expect(codes).toContain('AA') // American Airlines
      expect(codes).toContain('PD') // Porter Airlines
      expect(codes).toContain('UA') // United Airlines
    })

    it('is sorted alphabetically by name', () => {
      const names = AIRLINES.map(a => a.name)
      const sorted = [...names].sort((a, b) => a.localeCompare(b))
      expect(names).toEqual(sorted)
    })
  })

  describe('searchAirlines', () => {
    it('returns all airlines when query is empty', () => {
      const results = searchAirlines('', 10)
      expect(results.length).toBe(10)
    })

    it('prioritizes exact code match', () => {
      const results = searchAirlines('AC', 5)
      expect(results[0]?.code).toBe('AC')
      expect(results[0]?.name).toBe('Air Canada')
    })

    it('finds by airline code (case insensitive)', () => {
      const upper = searchAirlines('PD', 5)
      const lower = searchAirlines('pd', 5)

      expect(upper[0]?.code).toBe('PD')
      expect(lower[0]?.code).toBe('PD')
    })

    it('finds by airline name', () => {
      const results = searchAirlines('Porter', 5)
      expect(results[0]?.code).toBe('PD')
      expect(results[0]?.name).toBe('Porter Airlines')
    })

    it('prioritizes startsWith over contains', () => {
      // "Air" should match "Air Canada", "Air France", etc. before "Ryanair"
      const results = searchAirlines('Air', 10)

      // All startsWith matches should come before contains matches
      const startsWithAir = results.filter(a =>
        a.name.toLowerCase().startsWith('air')
      )
      expect(startsWithAir.length).toBeGreaterThan(0)

      // First results should start with "Air"
      expect(results[0]?.name.toLowerCase().startsWith('air')).toBe(true)
    })

    it('respects limit parameter', () => {
      const results = searchAirlines('', 3)
      expect(results.length).toBe(3)
    })

    it('returns empty array for no matches', () => {
      const results = searchAirlines('ZZZZZZZ', 10)
      expect(results).toEqual([])
    })

    it('handles partial name matches', () => {
      const results = searchAirlines('Canada', 5)
      const names = results.map(a => a.name)
      expect(names.some(n => n.includes('Canada'))).toBe(true)
    })
  })

  describe('getAirlineByCode', () => {
    it('returns airline for valid code', () => {
      const airline = getAirlineByCode('AC')
      expect(airline).toBeDefined()
      expect(airline?.code).toBe('AC')
      expect(airline?.name).toBe('Air Canada')
    })

    it('is case insensitive', () => {
      const upper = getAirlineByCode('AC')
      const lower = getAirlineByCode('ac')
      expect(upper).toEqual(lower)
    })

    it('returns undefined for unknown code', () => {
      const airline = getAirlineByCode('ZZ')
      expect(airline).toBeUndefined()
    })
  })

  describe('formatAirlineDisplay', () => {
    it('formats airline as "CODE - Name"', () => {
      const result = formatAirlineDisplay({ code: 'AC', name: 'Air Canada' })
      expect(result).toBe('AC - Air Canada')
    })

    it('works with country field present', () => {
      const result = formatAirlineDisplay({
        code: 'AC',
        name: 'Air Canada',
        country: 'Canada'
      })
      expect(result).toBe('AC - Air Canada')
    })
  })
})
