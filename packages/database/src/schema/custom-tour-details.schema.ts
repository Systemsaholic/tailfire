/**
 * Custom Tour Details Schema
 *
 * Extended details for tour bookings from catalog.
 * One-to-one relationship with itinerary_activities.
 */

import { pgTable, uuid, text, date, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'

// Itinerary day structure for JSON storage (snapshot stored in customTourDetails)
export interface TourItineraryDaySnapshot {
  dayNumber: number
  title?: string
  description?: string
  overnightCity?: string
}

// Hotel structure for JSON storage (snapshot stored in customTourDetails)
export interface TourHotelSnapshot {
  dayNumber?: number
  hotelName: string
  city?: string
  description?: string
}

// Inclusion structure for JSON storage (snapshot stored in customTourDetails)
export interface TourInclusionSnapshot {
  inclusionType: 'included' | 'excluded' | 'highlight'
  category?: string
  description: string
}

export const customTourDetails = pgTable(
  'custom_tour_details',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => itineraryActivities.id, { onDelete: 'cascade' })
      .unique(), // One-to-one relationship

    // Catalog linkage
    tourId: uuid('tour_id'),
    operatorCode: text('operator_code'),
    provider: text('provider').default('globus'),
    providerIdentifier: text('provider_identifier'),

    // Departure selection
    departureId: uuid('departure_id'),
    departureCode: text('departure_code'),
    departureStartDate: date('departure_start_date'),
    departureEndDate: date('departure_end_date'),
    currency: text('currency').default('CAD'),
    basePriceCents: integer('base_price_cents'),

    // Snapshot/metadata (denormalized for display without joins)
    tourName: text('tour_name'),
    days: integer('days'),
    nights: integer('nights'),
    startCity: text('start_city'),
    endCity: text('end_city'),

    // JSON data for extended info
    itineraryJson: jsonb('itinerary_json').default([]),
    inclusionsJson: jsonb('inclusions_json').default([]),
    hotelsJson: jsonb('hotels_json').default([]),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    activityIdIdx: index('idx_custom_tour_details_activity_id').on(table.activityId),
    tourIdIdx: index('idx_custom_tour_details_tour_id').on(table.tourId),
    departureIdIdx: index('idx_custom_tour_details_departure_id').on(table.departureId),
  })
)

// Relations
export const customTourDetailsRelations = relations(customTourDetails, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [customTourDetails.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type CustomTourDetails = typeof customTourDetails.$inferSelect
export type NewCustomTourDetails = typeof customTourDetails.$inferInsert
