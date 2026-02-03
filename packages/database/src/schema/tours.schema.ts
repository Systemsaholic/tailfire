/**
 * Tours Schema
 *
 * Core table for tour catalog data.
 * Operator-agnostic with provider column for multi-operator support.
 */

import { uuid, varchar, integer, text, boolean, timestamp, unique, numeric } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { tourOperators } from './tour-operators.schema'

export const tours = catalogSchema.table(
  'tours',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Provider mapping for external system references
    provider: varchar('provider', { length: 100 }).notNull(),
    providerIdentifier: varchar('provider_identifier', { length: 100 }).notNull(),

    // Operator reference
    operatorId: uuid('operator_id').references(() => tourOperators.id),
    operatorCode: varchar('operator_code', { length: 50 }).notNull(),

    // Tour details
    name: varchar('name', { length: 500 }).notNull(),
    season: varchar('season', { length: 20 }),
    days: integer('days'),
    nights: integer('nights'),
    description: text('description'),

    // Start/End city geocoding
    startCity: text('start_city'),
    startCityLat: numeric('start_city_lat', { precision: 10, scale: 7 }),
    startCityLng: numeric('start_city_lng', { precision: 10, scale: 7 }),
    endCity: text('end_city'),
    endCityLat: numeric('end_city_lat', { precision: 10, scale: 7 }),
    endCityLng: numeric('end_city_lng', { precision: 10, scale: 7 }),

    // Soft delete / active flag
    isActive: boolean('is_active').default(true),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Provider uniqueness (one tour per provider+identifier+season)
    providerIdentifierSeasonUnique: unique('tours_provider_identifier_season_unique').on(
      table.provider,
      table.providerIdentifier,
      table.season
    ),
  })
)

// TypeScript types
export type Tour = typeof tours.$inferSelect
export type NewTour = typeof tours.$inferInsert
