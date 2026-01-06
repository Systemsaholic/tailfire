/**
 * Trip Media Schema
 *
 * Images, videos, and documents associated with trips.
 * Separate from activity_media which is tied to itinerary activities.
 */

import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { trips } from './trips.schema'
import { mediaTypeEnum } from './activity-media.schema'

export const tripMedia = pgTable('trip_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),

  mediaType: mediaTypeEnum('media_type').notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'), // Size in bytes
  caption: text('caption'),

  // Cover photo designation (only one per trip)
  isCoverPhoto: boolean('is_cover_photo').default(false).notNull(),

  // Ordering for gallery display
  orderIndex: integer('order_index').notNull().default(0),

  // Attribution data for stock photos (Unsplash, etc.)
  // Structure: { source, photographerName, photographerUrl, photoUrl, license }
  attribution: jsonb('attribution'),

  // Audit fields
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  uploadedBy: uuid('uploaded_by'), // FK to users table (when implemented)
})

// Relations
export const tripMediaRelations = relations(tripMedia, ({ one }) => ({
  trip: one(trips, {
    fields: [tripMedia.tripId],
    references: [trips.id],
  }),
}))

// TypeScript types
export type TripMedia = typeof tripMedia.$inferSelect
export type NewTripMedia = typeof tripMedia.$inferInsert
