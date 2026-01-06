/**
 * Activity Media Schema
 *
 * Images, videos, and other media associated with activities.
 * Supports polymorphic attachment to multiple entity types (activities, accommodations, flights, etc.)
 */

import { pgTable, pgEnum, uuid, varchar, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video', 'document'])

// Entity type enum for polymorphic media attachments
// Maps to activity types in the application layer
export const componentEntityTypeEnum = pgEnum('component_entity_type', [
  'activity',
  'accommodation',
  'flight',
  'transfer',
  'dining',
  'cruise',
  'port_info',
  'option',
])

export const activityMedia = pgTable('activity_media', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Polymorphic reference - activity_id is the ID of the entity
  // entity_type specifies which type of entity it references
  activityId: uuid('activity_id').notNull(),
  entityType: componentEntityTypeEnum('entity_type').notNull().default('activity'),

  mediaType: mediaTypeEnum('media_type').notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'), // Size in bytes
  caption: text('caption'),
  orderIndex: integer('order_index').notNull().default(0),
  attribution: jsonb('attribution'), // Unsplash or other source attribution data

  // Audit fields
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  uploadedBy: uuid('uploaded_by'), // FK to users table (when implemented)
})

// Note: Relations removed as this is now a polymorphic table without FK constraints
// The entityType field determines which table the activityId references

// TypeScript types
export type ActivityMedia = typeof activityMedia.$inferSelect
export type NewActivityMedia = typeof activityMedia.$inferInsert
export type MediaType = typeof mediaTypeEnum.enumValues[number]
export type ComponentEntityType = typeof componentEntityTypeEnum.enumValues[number]

// Legacy type aliases for backwards compatibility during migration
export type ComponentMedia = ActivityMedia
export type NewComponentMedia = NewActivityMedia
