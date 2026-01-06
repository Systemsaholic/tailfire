/**
 * Cruise Sailing Regions Schema (Junction Table)
 *
 * Many-to-many relationship between sailings and regions.
 * A sailing can visit multiple regions.
 */

import { uuid, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseSailings } from './cruise-sailings.schema'
import { cruiseRegions } from './cruise-regions.schema'

export const cruiseSailingRegions = catalogSchema.table(
  'cruise_sailing_regions',
  {
    // Composite primary key columns
    sailingId: uuid('sailing_id')
      .notNull()
      .references(() => cruiseSailings.id, { onDelete: 'cascade' }),
    regionId: uuid('region_id')
      .notNull()
      .references(() => cruiseRegions.id, { onDelete: 'cascade' }),

    // Is this the primary/featured region for this sailing?
    isPrimary: boolean('is_primary').notNull().default(false),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sailingId, table.regionId] }),
  })
)

// TypeScript types
export type CruiseSailingRegion = typeof cruiseSailingRegions.$inferSelect
export type NewCruiseSailingRegion = typeof cruiseSailingRegions.$inferInsert
