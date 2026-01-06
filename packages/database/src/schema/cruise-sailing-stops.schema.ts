/**
 * Cruise Sailing Stops Schema
 *
 * Itinerary stops for each sailing.
 * Supports both port calls and sea days (port_id is NULL for sea days).
 */

import {
  uuid,
  varchar,
  integer,
  time,
  boolean,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseSailings } from './cruise-sailings.schema'
import { cruisePorts } from './cruise-ports.schema'

export const cruiseSailingStops = catalogSchema.table(
  'cruise_sailing_stops',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK to sailing
    sailingId: uuid('sailing_id')
      .notNull()
      .references(() => cruiseSailings.id, { onDelete: 'cascade' }),

    // FK to port (NULL for sea days)
    portId: uuid('port_id').references(() => cruisePorts.id, { onDelete: 'set null' }),

    // Port name (required - "At Sea" for sea days, port name for port calls)
    portName: varchar('port_name', { length: 255 }).notNull(),

    // Sea day flag
    isSeaDay: boolean('is_sea_day').notNull().default(false),

    // Day number in the cruise (1-based)
    dayNumber: integer('day_number').notNull(),

    // Sequence order within a day (for multiple stops on same day)
    sequenceOrder: integer('sequence_order').notNull().default(0),

    // Arrival and departure times (local port time)
    arrivalTime: time('arrival_time'),
    departureTime: time('departure_time'),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Uniqueness: one stop per sailing+day+sequence
    sailingDaySequenceUnique: unique('cruise_sailing_stops_unique').on(
      table.sailingId,
      table.dayNumber,
      table.sequenceOrder
    ),
  })
)

// TypeScript types
export type CruiseSailingStop = typeof cruiseSailingStops.$inferSelect
export type NewCruiseSailingStop = typeof cruiseSailingStops.$inferInsert
