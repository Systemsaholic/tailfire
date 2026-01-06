/**
 * Cruise FTP File Sync Schema
 *
 * Tracks last sync state for each FTP file to enable delta sync.
 * Files are skipped if their modifiedAt + size match the tracked state.
 */

import {
  varchar,
  integer,
  timestamp,
  text,
  index,
} from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'

export const cruiseFtpFileSync = catalogSchema.table(
  'cruise_ftp_file_sync',
  {
    // FTP path (unique key)
    filePath: varchar('file_path', { length: 500 }).primaryKey(),

    // File size in bytes
    fileSize: integer('file_size').notNull(),

    // FTP file modification time
    ftpModifiedAt: timestamp('ftp_modified_at', { withTimezone: true }),

    // MD5 hash of content (for audit/debugging)
    contentHash: varchar('content_hash', { length: 32 }),

    // When this file was last successfully synced
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).notNull().defaultNow(),

    // Sync status: 'success' or 'failed'
    syncStatus: varchar('sync_status', { length: 20 }).notNull().default('success'),

    // Error message if sync failed
    lastError: text('last_error'),
  },
  (table) => ({
    modifiedIdx: index('idx_ftp_file_sync_modified').on(table.ftpModifiedAt),
    statusIdx: index('idx_ftp_file_sync_status').on(table.syncStatus),
  })
)

// TypeScript types
export type CruiseFtpFileSync = typeof cruiseFtpFileSync.$inferSelect
export type NewCruiseFtpFileSync = typeof cruiseFtpFileSync.$inferInsert
