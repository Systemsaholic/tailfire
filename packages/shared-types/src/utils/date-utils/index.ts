/**
 * Date/Time Utilities
 *
 * Shared date/time utilities for the Tailfire platform.
 *
 * Key Principles:
 * - Store all timestamps in UTC (using PostgreSQL TIMESTAMPTZ)
 * - Store calendar dates without time-of-day as DATE type (YYYY-MM-DD strings)
 * - Return ISO 8601 strings with 'Z' suffix from API
 * - Perform timezone conversion ONLY on the client-side
 * - Use IANA timezone identifiers (e.g., 'America/Toronto')
 *
 * This package provides timezone-agnostic parsing, formatting, and validation.
 * For timezone-aware display, use client-side utilities with the browser's Intl API.
 */

// Constants
export * from './constants'

// Parsers (timezone-agnostic)
export * from './parsers'

// Formatters (timezone-agnostic)
export * from './formatters'

// Validators
export * from './validators'
