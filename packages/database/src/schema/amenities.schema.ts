/**
 * Amenities Schema
 *
 * Dynamic amenities system for lodging, tours, and other activity types.
 * Amenities are auto-created from external APIs (Google Places, Booking.com, Amadeus)
 * and can be manually added by agents.
 */

import { pgTable, pgEnum, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Amenity categories for grouping in UI
 */
export const amenityCategoryEnum = pgEnum('amenity_category', [
  'connectivity',    // WiFi, Internet, TV
  'facilities',      // Pool, Gym, Spa, Business Center
  'dining',          // Restaurant, Bar, Breakfast, Room Service
  'services',        // Concierge, Laundry, Airport Shuttle
  'parking',         // Free Parking, Valet, Garage
  'accessibility',   // Wheelchair, Elevator
  'room_features',   // AC, Balcony, Kitchen, Ocean View
  'family',          // Kids Club, Playground, Family Rooms
  'pets',            // Pet Friendly, Dog Park
  'other',           // Catch-all for uncategorized
])

/**
 * Source of amenity creation
 */
export const amenitySourceEnum = pgEnum('amenity_source', [
  'google_places',
  'booking_com',
  'amadeus',
  'manual',
  'system',  // Pre-seeded amenities
])

// ============================================================================
// TABLE: amenities
// ============================================================================

export const amenities = pgTable('amenities', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Display name (what users see)
  name: varchar('name', { length: 100 }).notNull(),

  // Normalized slug for matching (lowercase, no spaces, no special chars)
  // Used to dedupe: "Free WiFi" and "WiFi" both map to "wifi"
  slug: varchar('slug', { length: 100 }).notNull(),

  // Category for UI grouping
  category: amenityCategoryEnum('category').notNull().default('other'),

  // Optional icon name (for UI, e.g., 'wifi', 'pool', 'parking')
  icon: varchar('icon', { length: 50 }),

  // Description for tooltips
  description: text('description'),

  // Source that first created this amenity
  source: amenitySourceEnum('source').notNull().default('manual'),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Slug must be unique to prevent duplicates
  uniqueSlug: uniqueIndex('amenities_slug_unique').on(table.slug),
}))

// ============================================================================
// TABLE: activity_amenities (Junction table)
// ============================================================================

export const activityAmenities = pgTable('activity_amenities', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Reference to activity (lodging, tour, etc.)
  activityId: uuid('activity_id').notNull(),
  // Note: FK added in migration to avoid circular imports

  // Reference to amenity
  amenityId: uuid('amenity_id')
    .notNull()
    .references(() => amenities.id, { onDelete: 'cascade' }),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Each activity can have each amenity only once
  uniqueActivityAmenity: uniqueIndex('activity_amenities_unique').on(
    table.activityId,
    table.amenityId
  ),
}))

// ============================================================================
// RELATIONS
// ============================================================================

export const amenitiesRelations = relations(amenities, ({ many }) => ({
  activityAmenities: many(activityAmenities),
}))

export const activityAmenitiesRelations = relations(activityAmenities, ({ one }) => ({
  amenity: one(amenities, {
    fields: [activityAmenities.amenityId],
    references: [amenities.id],
  }),
}))

// ============================================================================
// TYPES
// ============================================================================

export type Amenity = typeof amenities.$inferSelect
export type NewAmenity = typeof amenities.$inferInsert
export type AmenityCategory = typeof amenityCategoryEnum.enumValues[number]
export type AmenitySource = typeof amenitySourceEnum.enumValues[number]

export type ActivityAmenity = typeof activityAmenities.$inferSelect
export type NewActivityAmenity = typeof activityAmenities.$inferInsert
