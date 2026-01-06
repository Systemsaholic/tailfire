/**
 * Cruise Ship Decks Schema
 *
 * Normalized storage for cruise ship deck information.
 * One ship can have multiple decks with deck plans.
 */

import { uuid, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseShips } from './cruise-ships.schema'

/**
 * Metadata type for deck including cabin locations for interactive deck plans
 */
export type DeckMetadata = {
  cabin_locations?: Array<{
    cabin_id: string
    x1: number
    y1: number
    x2: number
    y2: number
  }>
  [key: string]: unknown
}

export const cruiseShipDecks = catalogSchema.table('cruise_ship_decks', {
  id: uuid('id').primaryKey().defaultRandom(),

  // FK to cruise ship
  shipId: uuid('ship_id')
    .notNull()
    .references(() => cruiseShips.id, { onDelete: 'cascade' }),

  // Deck details
  name: varchar('name', { length: 100 }).notNull(),
  deckNumber: integer('deck_number'),

  // Deck plan image
  deckPlanUrl: text('deck_plan_url'),

  // Description of deck amenities/features
  description: text('description'),

  // Display ordering
  displayOrder: integer('display_order').notNull().default(0),

  // Extensible metadata (includes cabin_locations for interactive deck plans)
  metadata: jsonb('metadata').$type<DeckMetadata>().default({}),

  // Soft delete / active flag
  isActive: boolean('is_active').notNull().default(true),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// TypeScript types
export type CruiseShipDeck = typeof cruiseShipDecks.$inferSelect
export type NewCruiseShipDeck = typeof cruiseShipDecks.$inferInsert
