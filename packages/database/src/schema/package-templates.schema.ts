/**
 * Package Templates Schema
 *
 * Agency-scoped reusable package structure templates.
 * Templates store package metadata and activity configurations as JSON payloads
 * that can be applied to insert activities into existing itineraries.
 *
 * @see /Users/alguertin/.claude/plans/mellow-leaping-candy.md
 */

import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import type { TemplateActivity } from './itinerary-templates.schema'

/**
 * Package Template Payload - Stored as JSONB
 */
export interface PackageTemplatePayload {
  packageMetadata: {
    name: string
    description?: string | null
    pricingType: 'flat_rate' | 'per_person'
    totalPriceCents?: number | null
    currency?: string | null
  }
  dayOffsets: Array<{
    dayIndex: number // 0-based offset from anchor
    activities: TemplateActivity[]
  }>
}

// Package Templates Table
export const packageTemplates = pgTable(
  'package_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agencyId: uuid('agency_id').notNull(), // No FK (agencies table doesn't exist yet)
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    payload: jsonb('payload').$type<PackageTemplatePayload>().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by'), // No FK (users table doesn't exist yet)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxAgency: index('idx_package_templates_agency').on(table.agencyId),
    idxAgencyActive: index('idx_package_templates_agency_active').on(table.agencyId, table.isActive),
  })
)

// TypeScript types
export type PackageTemplate = typeof packageTemplates.$inferSelect
export type NewPackageTemplate = typeof packageTemplates.$inferInsert
