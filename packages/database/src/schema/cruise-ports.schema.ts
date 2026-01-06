/**
 * Cruise Ports Schema
 *
 * Reference table for cruise embarkation/disembarkation ports.
 * Provider-agnostic design with external ID mapping.
 */

import { uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'

export type CruisePortMetadata = {
  country?: string
  country_code?: string
  latitude?: number
  longitude?: number
  timezone?: string
  description?: string
  [key: string]: unknown
}

export const cruisePorts = catalogSchema.table('cruise_ports', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),

  // Provider mapping
  provider: varchar('provider', { length: 100 }).notNull().default('traveltek'),
  providerIdentifier: varchar('provider_identifier', { length: 100 }).notNull(),

  // Extensible metadata (includes country, coordinates, etc.)
  metadata: jsonb('metadata').$type<CruisePortMetadata>().default({}),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// TypeScript types
export type CruisePort = typeof cruisePorts.$inferSelect
export type NewCruisePort = typeof cruisePorts.$inferInsert
