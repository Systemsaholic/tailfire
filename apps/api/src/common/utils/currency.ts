/**
 * Server-side Currency Utilities
 *
 * MUST match client-side behavior in apps/admin/src/lib/pricing/currency-helpers.ts
 * for consistency across API and frontend.
 *
 * Rounding behavior: Math.round (standard rounding, 0.5 rounds up)
 */

/**
 * Convert dollars (string or number) to cents (integer)
 * Handles empty strings, null, undefined gracefully by returning 0
 */
export function dollarsToCents(value: string | number | null | undefined): number {
  if (value === '' || value === null || value === undefined) {
    return 0
  }

  const dollars = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(dollars)) {
    return 0
  }

  return Math.round(dollars * 100)
}

/**
 * Convert cents (integer) to dollars (number, NOT string)
 * Different from client-side which returns formatted string
 */
export function centsToDollarsNumber(cents: number | null | undefined): number {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return 0
  }

  return cents / 100
}

/**
 * Convert cents (integer) to dollars (formatted string with 2 decimals)
 * Matches client-side centsToDollars behavior exactly
 */
export function centsToDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return '0.00'
  }

  return (cents / 100).toFixed(2)
}

/**
 * Format cents as currency with symbol
 * Matches client-side formatCurrency behavior exactly
 */
export function formatCurrency(
  cents: number | null | undefined,
  currency: string = 'CAD',
): string {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return `${getCurrencySymbol(currency)}0.00`
  }

  const dollars = (cents / 100).toFixed(2)
  return `${getCurrencySymbol(currency)}${dollars}`
}

/**
 * Get currency symbol for a given currency code
 */
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    CAD: '$',
    EUR: '€',
    GBP: '£',
  }

  return symbols[currency] || currency + ' '
}
