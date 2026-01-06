/**
 * @tailfire/database
 *
 * Shared database layer for Tailfire Beta monorepo
 *
 * Exports:
 * - createDbClient: Factory function for Drizzle database client
 * - runMigrations: Migration runner (apps/api only)
 * - resetDatabase: Database reset utility (development only)
 * - seedDatabase: Database seeding utility (development/testing only)
 * - schema: Full database schema (re-exported for convenience)
 */

export { createDbClient } from './client'
export { runMigrations } from './migrate'
export { resetDatabase } from './reset'
export { seedDatabase } from './seed'
export * as schema from './schema'
export type { Database } from './client'

// Direct exports for commonly used constants
export { VALID_DOCUMENT_TYPES, type DocumentType } from './schema/activity-documents.schema'
export { mediaTypeEnum, componentEntityTypeEnum, type MediaType, type ComponentEntityType } from './schema/activity-media.schema'

// Cruise schema exports
export { type DeckMetadata } from './schema/cruise-ship-decks.schema'
export { cruiseFtpFileSync, type CruiseFtpFileSync, type NewCruiseFtpFileSync } from './schema/cruise-ftp-file-sync.schema'
export {
  cruiseSyncHistory,
  type CruiseSyncHistory,
  type NewCruiseSyncHistory,
  type SyncHistoryStatus,
  type SyncHistoryError,
  type SyncHistoryMetrics,
} from './schema/cruise-sync-history.schema'
