/**
 * Cruise Cabin Images Schema
 *
 * Normalized storage for cabin gallery images.
 * Links to cabin types for image galleries per cabin category.
 */

import { uuid, varchar, text, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseShipCabinTypes } from './cruise-ship-cabin-types.schema'

export const cruiseCabinImages = catalogSchema.table(
  'cruise_cabin_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK to cabin type
    cabinTypeId: uuid('cabin_type_id')
      .notNull()
      .references(() => cruiseShipCabinTypes.id, { onDelete: 'cascade' }),

    // Image URLs at different resolutions
    imageUrl: text('image_url').notNull(),
    imageUrlHd: text('image_url_hd'),
    imageUrl2k: text('image_url_2k'),

    // Image metadata
    caption: varchar('caption', { length: 500 }),

    // Display ordering (from array index during import)
    displayOrder: integer('display_order').notNull().default(0),

    // Is this the default/hero image for the cabin type
    isDefault: boolean('is_default').notNull().default(false),

    // Audit field
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Prevent duplicate images when reprocessing same sailing
    cabinImageUnique: unique('idx_cabin_images_unique').on(table.cabinTypeId, table.imageUrl),
  })
)

// TypeScript types
export type CruiseCabinImage = typeof cruiseCabinImages.$inferSelect
export type NewCruiseCabinImage = typeof cruiseCabinImages.$inferInsert
