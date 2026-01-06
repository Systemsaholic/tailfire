/**
 * Cruise Sync Raw Schema
 *
 * Raw JSON storage for debugging and audit purposes.
 * 30-day TTL with size limit of 500KB.
 * Stores the original Traveltek JSON for each sailing.
 */

import {
  varchar,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { catalogSchema } from './catalog.schema'

export const cruiseSyncRaw = catalogSchema.table('cruise_sync_raw', {
  // Provider sailing ID (unique key)
  providerSailingId: varchar('provider_sailing_id', { length: 100 }).primaryKey(),

  // Raw JSON data from Traveltek
  rawData: jsonb('raw_data').notNull(),

  // Sync metadata
  syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),

  // TTL: expires 30 days after sync
  expiresAt: timestamp('expires_at', { withTimezone: true })
    .notNull()
    .default(sql`NOW() + INTERVAL '30 days'`),
})

// TypeScript types
export type CruiseSyncRaw = typeof cruiseSyncRaw.$inferSelect
export type NewCruiseSyncRaw = typeof cruiseSyncRaw.$inferInsert
