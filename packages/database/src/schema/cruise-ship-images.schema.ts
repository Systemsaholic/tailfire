/**
 * Cruise Ship Images Schema
 *
 * Normalized storage for cruise ship images.
 * One ship can have multiple images (hero, gallery, deck plans, etc.)
 */

import { uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseShips } from './cruise-ships.schema'

export const cruiseShipImages = catalogSchema.table('cruise_ship_images', {
  id: uuid('id').primaryKey().defaultRandom(),

  // FK to cruise ship
  shipId: uuid('ship_id')
    .notNull()
    .references(() => cruiseShips.id, { onDelete: 'cascade' }),

  // Image details
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  altText: varchar('alt_text', { length: 500 }),

  // Image type/category
  imageType: varchar('image_type', { length: 50 }).notNull().default('gallery'),

  // Display ordering
  displayOrder: integer('display_order').notNull().default(0),

  // Hero image flag (only one per ship should be true)
  isHero: boolean('is_hero').notNull().default(false),

  // Soft delete / active flag
  isActive: boolean('is_active').notNull().default(true),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// TypeScript types
export type CruiseShipImage = typeof cruiseShipImages.$inferSelect
export type NewCruiseShipImage = typeof cruiseShipImages.$inferInsert
