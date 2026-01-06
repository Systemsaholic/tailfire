/**
 * Cruise Alternate Sailings Schema
 *
 * Links sailings to their alternate departure dates.
 * Enables "Similar Sailings" feature and FK resolution when alternates are imported.
 */

import { uuid, varchar, date, integer, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseSailings } from './cruise-sailings.schema'

export const cruiseAlternateSailings = catalogSchema.table(
  'cruise_alternate_sailings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Source sailing that has this alternate
    sailingId: uuid('sailing_id')
      .notNull()
      .references(() => cruiseSailings.id, { onDelete: 'cascade' }),

    // FK to the alternate sailing (resolved later via backfill)
    alternateSailingId: uuid('alternate_sailing_id').references(() => cruiseSailings.id, {
      onDelete: 'set null',
    }),

    // Provider mapping for FK resolution
    provider: varchar('provider', { length: 100 }).notNull().default('traveltek'),
    alternateProviderIdentifier: varchar('alternate_provider_identifier', { length: 100 }).notNull(),

    // Denormalized data for display when FK is not resolved
    alternateSailDate: date('alternate_sail_date', { mode: 'string' }),
    alternateNights: integer('alternate_nights'),
    alternateLeadPriceCents: integer('alternate_lead_price_cents'),

    // Audit field
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint on sailing + alternate provider ID
    sailingAlternateUnique: unique('cruise_alternate_sailings_unique').on(
      table.sailingId,
      table.alternateProviderIdentifier
    ),
    // Index for lookups by sailing
    sailingIdx: index('idx_alternate_sailings_sailing').on(table.sailingId),
    // Index for FK backfill query
    providerIdx: index('idx_alternate_sailings_provider').on(
      table.provider,
      table.alternateProviderIdentifier
    ),
  })
)

// TypeScript types
export type CruiseAlternateSailing = typeof cruiseAlternateSailings.$inferSelect
export type NewCruiseAlternateSailing = typeof cruiseAlternateSailings.$inferInsert
