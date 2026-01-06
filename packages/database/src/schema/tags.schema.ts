/**
 * Tags Schema
 *
 * Central tagging system for organizing trips, contacts, and other entities.
 * Tags can be shared across multiple entities and support categorization.
 */

import { pgTable, uuid, varchar, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { trips } from './trips.schema'
import { contacts } from './contacts.schema'

/**
 * Tags Table
 * Central repository of all tags used across the system
 */
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }), // e.g., 'trip-type', 'client-status', 'custom'
  color: varchar('color', { length: 7 }), // Hex color like #8B5CF6
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_tags_name').on(table.name),
}))

/**
 * Trip Tags Junction Table
 * Many-to-many relationship between trips and tags
 */
export const tripTags = pgTable('trip_tags', {
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.tripId, table.tagId] }),
  tripIdIdx: index('idx_trip_tags_trip_id').on(table.tripId),
  tagIdIdx: index('idx_trip_tags_tag_id').on(table.tagId),
}))

/**
 * Contact Tags Junction Table
 * Many-to-many relationship between contacts and tags
 */
export const contactTags = pgTable('contact_tags', {
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.contactId, table.tagId] }),
  contactIdIdx: index('idx_contact_tags_contact_id').on(table.contactId),
  tagIdIdx: index('idx_contact_tags_tag_id').on(table.tagId),
}))
