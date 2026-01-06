/**
 * @tailfire/shared-types
 *
 * Shared TypeScript types for Tailfire Beta monorepo
 *
 * Exports:
 * - REST API request/response types (from ./api)
 * - Zod schemas for validation (from ./schemas)
 * - Database entity types (from ./database, inferred from Drizzle schema)
 * - Date/time utilities (from ./utils/date-utils)
 */

// Export all API types directly (not namespaced)
// Note: API types now re-export core types from schemas
export * from './api/index'

// Export Zod schemas for validation use
// Schemas are the source of truth for core types (ActivityType, CreateActivityDto, etc.)
export * from './schemas'

// Export database types under namespace to avoid conflicts
export * as database from './database/index'

// Export date utilities under namespace
export * as dateUtils from './utils/date-utils'
