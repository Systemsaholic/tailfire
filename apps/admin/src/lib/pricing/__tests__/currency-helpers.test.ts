/**
 * Currency Helpers Parity Tests
 *
 * These tests use SHARED test vectors to ensure client-side currency utilities
 * match server-side behavior exactly. The same vectors should be used in:
 * - apps/api/src/common/utils/__tests__/currency.spec.ts
 *
 * If any test fails, it indicates a parity issue between client and server.
 */

import { dollarsToCents, centsToDollars, formatCurrency } from '../currency-helpers'

// Shared test vectors - exact expected values
// MUST match server-side test file exactly
const DOLLARS_TO_CENTS_VECTORS = [
  { input: 19.995, expected: 2000 }, // rounds up (half-up)
  { input: 19.994, expected: 1999 }, // rounds down
  { input: 0.005, expected: 1 }, // half-cent rounds up
  { input: 100.0, expected: 10000 }, // exact
  { input: 0, expected: 0 }, // zero
  { input: null, expected: 0 }, // null -> 0
  { input: undefined, expected: 0 }, // undefined -> 0
  { input: '', expected: 0 }, // empty string -> 0
  { input: NaN, expected: 0 }, // NaN -> 0
  { input: '19.99', expected: 1999 }, // string input
  { input: '0', expected: 0 }, // string zero
  { input: 1.115, expected: 112 }, // edge case rounding
  { input: 1.114, expected: 111 }, // edge case rounding
]

const CENTS_TO_DOLLARS_VECTORS = [
  { cents: 1999, expected: '19.99' },
  { cents: 2000, expected: '20.00' },
  { cents: 0, expected: '0.00' },
  { cents: 1, expected: '0.01' },
  { cents: 100, expected: '1.00' },
  { cents: null, expected: '0.00' },
  { cents: undefined, expected: '0.00' },
  { cents: NaN, expected: '0.00' },
]

const FORMAT_CURRENCY_VECTORS = [
  { cents: 1999, currency: 'USD', expected: '$19.99' },
  { cents: 1999, currency: 'CAD', expected: '$19.99' },
  { cents: 1999, currency: 'EUR', expected: '€19.99' },
  { cents: 1999, currency: 'GBP', expected: '£19.99' },
  { cents: 0, currency: 'CAD', expected: '$0.00' },
  { cents: null, expected: '$0.00' },
  { cents: undefined, expected: '$0.00' },
  { cents: 10000, currency: 'JPY', expected: 'JPY 100.00' }, // unknown currency
]

describe('Currency parity with server', () => {
  describe('dollarsToCents', () => {
    DOLLARS_TO_CENTS_VECTORS.forEach(({ input, expected }) => {
      it(`dollarsToCents(${JSON.stringify(input)}) -> ${expected}`, () => {
        expect(dollarsToCents(input as any)).toBe(expected)
      })
    })
  })

  describe('centsToDollars', () => {
    CENTS_TO_DOLLARS_VECTORS.forEach(({ cents, expected }) => {
      it(`centsToDollars(${JSON.stringify(cents)}) -> '${expected}'`, () => {
        expect(centsToDollars(cents as any)).toBe(expected)
      })
    })
  })

  describe('formatCurrency', () => {
    FORMAT_CURRENCY_VECTORS.forEach(({ cents, currency, expected }) => {
      it(`formatCurrency(${JSON.stringify(cents)}, '${currency || 'CAD'}') -> '${expected}'`, () => {
        expect(formatCurrency(cents as any, currency)).toBe(expected)
      })
    })

    it('uses CAD as default currency', () => {
      expect(formatCurrency(1999)).toBe('$19.99')
    })
  })
})

describe('Floating point precision', () => {
  it('handles floating point edge cases correctly', () => {
    // Classic floating point issue: 0.1 + 0.2 !== 0.3
    // Our implementation should handle this
    expect(dollarsToCents(0.1 + 0.2)).toBe(30)

    // Multiple operations should not accumulate errors
    const cents = dollarsToCents(19.99)
    const dollars = centsToDollars(cents)
    expect(dollars).toBe('19.99')
  })
})
