/**
 * Itinerary Templates Schema
 *
 * Agency-scoped reusable itinerary structure templates.
 * Templates store day/activity configurations as JSON payloads that can be
 * applied to create new itineraries.
 *
 * @see /Users/alguertin/.claude/plans/mellow-leaping-candy.md
 */

import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

/**
 * Template Activity - Represents a single activity within a template
 * Times are stored as HH:MM format (dates stripped)
 */
export interface TemplateActivity {
  componentType: string
  activityType: string
  name: string
  sequenceOrder: number

  // Time handling (dates stripped, times preserved)
  startTime?: string | null // HH:MM format only (e.g., "09:30")
  endTime?: string | null // HH:MM format only (e.g., "17:00")
  timezone?: string | null // IANA timezone (e.g., "America/New_York")

  location?: string | null
  address?: string | null
  coordinates?: { lat: number; lng: number } | null
  notes?: string | null
  confirmationNumber?: string | null

  // Pricing (amounts preserved)
  pricing?: {
    totalPriceCents?: number | null
    currency?: string | null
    taxesCents?: number | null
    commissionAmountCents?: number | null
    commissionSplitPercent?: number | null
  }

  // Payment schedule (relative timing)
  paymentSchedule?: {
    scheduleType: string
    items: Array<{
      paymentName: string
      percentage?: number | null
      fixedAmountCents?: number | null
      daysFromBooking?: number | null
      daysBeforeDeparture?: number | null
    }>
  }

  // Media references (URLs preserved)
  media?: Array<{
    fileUrl: string
    fileName: string
    caption?: string | null
    orderIndex: number
  }>

  // Type-specific details (full payload from *_details tables)
  details?: Record<string, unknown>
}

/**
 * Itinerary Template Payload - Stored as JSONB
 */
export interface ItineraryTemplatePayload {
  dayOffsets: Array<{
    dayIndex: number // 0-based offset from anchor
    activities: TemplateActivity[]
  }>
}

// Itinerary Templates Table
export const itineraryTemplates = pgTable(
  'itinerary_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agencyId: uuid('agency_id').notNull(), // No FK (agencies table doesn't exist yet)
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    payload: jsonb('payload').$type<ItineraryTemplatePayload>().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by'), // No FK (users table doesn't exist yet)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxAgency: index('idx_itinerary_templates_agency').on(table.agencyId),
    idxAgencyActive: index('idx_itinerary_templates_agency_active').on(table.agencyId, table.isActive),
  })
)

// TypeScript types
export type ItineraryTemplate = typeof itineraryTemplates.$inferSelect
export type NewItineraryTemplate = typeof itineraryTemplates.$inferInsert
