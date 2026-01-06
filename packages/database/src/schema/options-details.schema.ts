/**
 * Options Details Schema
 *
 * Extended details for upsell options (upgrades, tours, excursions, insurance, meal plans).
 * One-to-one relationship with itinerary_activities.
 */

import { pgTable, uuid, varchar, text, date, time, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'

// Option category enum values (validated by CHECK constraint in migration)
export const OPTION_CATEGORIES = [
  'upgrade',
  'add_on',
  'tour',
  'excursion',
  'insurance',
  'meal_plan',
  'other',
] as const

export type OptionCategory = (typeof OPTION_CATEGORIES)[number]

export const optionsDetails = pgTable('options_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' })
    .unique(), // One-to-one relationship

  // Option Classification
  optionCategory: varchar('option_category', { length: 50 }), // CHECK constraint in migration

  // Selection & Availability
  isSelected: boolean('is_selected').default(false),
  availabilityStartDate: date('availability_start_date'),
  availabilityEndDate: date('availability_end_date'),
  bookingDeadline: date('booking_deadline'),

  // Capacity (CHECK constraints in migration: >= 0, max >= min)
  minParticipants: integer('min_participants'),
  maxParticipants: integer('max_participants'),
  spotsAvailable: integer('spots_available'),

  // Duration (CHECK constraint in migration: >= 0)
  durationMinutes: integer('duration_minutes'),
  meetingPoint: varchar('meeting_point', { length: 255 }),
  meetingTime: time('meeting_time'),

  // Provider/Vendor information
  providerName: varchar('provider_name', { length: 255 }),
  providerPhone: varchar('provider_phone', { length: 50 }),
  providerEmail: varchar('provider_email', { length: 255 }),
  providerWebsite: varchar('provider_website', { length: 500 }),

  // Details (text[] arrays - service returns [] not null)
  inclusions: text('inclusions').array(),
  exclusions: text('exclusions').array(),
  requirements: text('requirements').array(),
  whatToBring: text('what_to_bring').array(),

  // Display
  displayOrder: integer('display_order'), // nullable - null means unordered
  highlightText: varchar('highlight_text', { length: 100 }), // e.g., "Popular!", "Best Value!"
  instructionsText: text('instructions_text'),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const optionsDetailsRelations = relations(optionsDetails, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [optionsDetails.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type OptionsDetails = typeof optionsDetails.$inferSelect
export type NewOptionsDetails = typeof optionsDetails.$inferInsert
