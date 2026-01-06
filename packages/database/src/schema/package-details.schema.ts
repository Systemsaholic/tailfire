/**
 * Package Details Schema
 *
 * Package-specific details for activities with activityType='package'.
 * One-to-one relationship with itinerary_activities.
 * Replaces the separate packages table with a details extension pattern.
 */

import { pgTable, pgEnum, uuid, varchar, text, date, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'
import { suppliers } from './suppliers.schema'
import { trips } from './trips.schema'

// Enums (kept from former packages.schema.ts - these already exist in DB as booking_* types)
export const packagePaymentStatusEnum = pgEnum('booking_payment_status', [
  'unpaid',
  'deposit_paid',
  'paid',
  'refunded',
  'partially_refunded',
])

export const packagePricingTypeEnum = pgEnum('booking_pricing_type', ['flat_rate', 'per_person'])

export const packageDetails = pgTable('package_details', {
  id: uuid('id').primaryKey().defaultRandom(),

  // One-to-one with activity
  activityId: uuid('activity_id')
    .notNull()
    .unique()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' }),

  // RLS denormalization: trip_id for agency-scoped access
  // Auto-populated by trigger on INSERT
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id),

  // Supplier info
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  supplierName: varchar('supplier_name', { length: 255 }),

  // Payment status tracking
  paymentStatus: packagePaymentStatusEnum('payment_status').default('unpaid'),

  // Pricing type
  pricingType: packagePricingTypeEnum('pricing_type').default('flat_rate'),

  // Cancellation and terms
  cancellationPolicy: text('cancellation_policy'),
  cancellationDeadline: date('cancellation_deadline'),
  termsAndConditions: text('terms_and_conditions'),

  // Group booking reference
  groupBookingNumber: varchar('group_booking_number', { length: 255 }),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const packageDetailsRelations = relations(packageDetails, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [packageDetails.activityId],
    references: [itineraryActivities.id],
  }),
  supplier: one(suppliers, {
    fields: [packageDetails.supplierId],
    references: [suppliers.id],
  }),
  trip: one(trips, {
    fields: [packageDetails.tripId],
    references: [trips.id],
  }),
}))

// TypeScript types
export type PackageDetails = typeof packageDetails.$inferSelect
export type NewPackageDetails = typeof packageDetails.$inferInsert
export type PackagePaymentStatus = (typeof packagePaymentStatusEnum.enumValues)[number]
export type PackagePricingType = (typeof packagePricingTypeEnum.enumValues)[number]
