/**
 * Cruise Lines Schema
 *
 * Reference table for cruise line companies.
 * Supports provider-agnostic design with external ID mapping.
 */

import { uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'

export type CruiseLineMetadata = {
  logo_url?: string
  website?: string
  description?: string
  [key: string]: unknown
}

export const cruiseLines = catalogSchema.table('cruise_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),

  // Provider mapping for external system references
  provider: varchar('provider', { length: 100 }).notNull().default('traveltek'),
  providerIdentifier: varchar('provider_identifier', { length: 100 }).notNull(),

  // Optional supplier FK for vendor management (FK constraint added when suppliers table exists)
  supplierId: uuid('supplier_id'),

  // Extensible metadata for future enrichment
  metadata: jsonb('metadata').$type<CruiseLineMetadata>().default({}),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// TypeScript types
export type CruiseLine = typeof cruiseLines.$inferSelect
export type NewCruiseLine = typeof cruiseLines.$inferInsert
