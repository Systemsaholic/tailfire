/**
 * Tour Media Schema
 *
 * Images, brochures, videos, and maps for tours.
 */

import { uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { tours } from './tours.schema'

export const tourMedia = catalogSchema.table('tour_media', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Tour reference
  tourId: uuid('tour_id')
    .notNull()
    .references(() => tours.id, { onDelete: 'cascade' }),

  // Media details
  mediaType: varchar('media_type', { length: 50 }).notNull(), // 'image' | 'brochure' | 'video' | 'map'
  url: text('url').notNull(),
  caption: varchar('caption', { length: 500 }),
  sortOrder: integer('sort_order').default(0),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// TypeScript types
export type TourMedia = typeof tourMedia.$inferSelect
export type NewTourMedia = typeof tourMedia.$inferInsert
