/**
 * Cruise Regions Schema
 *
 * Reference table for cruise sailing regions.
 * Provider-agnostic design with external ID mapping.
 */

import { uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'

export type CruiseRegionMetadata = {
  description?: string
  popular_ports?: string[]
  [key: string]: unknown
}

export const cruiseRegions = catalogSchema.table('cruise_regions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),

  // Provider mapping
  provider: varchar('provider', { length: 100 }).notNull().default('traveltek'),
  providerIdentifier: varchar('provider_identifier', { length: 100 }).notNull(),

  // Extensible metadata
  metadata: jsonb('metadata').$type<CruiseRegionMetadata>().default({}),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// TypeScript types
export type CruiseRegion = typeof cruiseRegions.$inferSelect
export type NewCruiseRegion = typeof cruiseRegions.$inferInsert
