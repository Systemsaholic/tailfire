/**
 * Activity Documents Schema
 *
 * Documents associated with activities (PDFs, confirmations, vouchers, etc.)
 */

import { pgTable, uuid, varchar, text, integer, timestamp, index, check } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'

// Valid document types
export const VALID_DOCUMENT_TYPES = [
  'confirmation',
  'voucher',
  'invoice',
  'itinerary',
  'receipt',
  'contract',
  'ticket',
  'passport',
  'visa',
  'cabin_image',
  'media_image',
  'other',
] as const

export type DocumentType = (typeof VALID_DOCUMENT_TYPES)[number]

export const activityDocuments = pgTable(
  'activity_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => itineraryActivities.id, { onDelete: 'cascade' }),

    documentType: varchar('document_type', { length: 100 }), // e.g., 'confirmation', 'voucher', 'invoice'
    fileUrl: text('file_url').notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size'), // Size in bytes

    // Audit fields
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    uploadedBy: uuid('uploaded_by'), // FK to users table (when implemented)
  },
  (table) => ({
    // Indexes
    activityIdIdx: index('idx_activity_documents_activity_id').on(table.activityId),
    documentTypeIdx: index('idx_activity_documents_document_type').on(table.documentType),
    // CHECK constraint for document type
    documentTypeCheck: check(
      'activity_documents_type_check',
      sql`${table.documentType} IS NULL OR ${table.documentType} IN ('confirmation', 'voucher', 'invoice', 'itinerary', 'receipt', 'contract', 'ticket', 'passport', 'visa', 'cabin_image', 'media_image', 'other')`
    ),
  })
)

// Relations
export const activityDocumentsRelations = relations(activityDocuments, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [activityDocuments.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type ActivityDocument = typeof activityDocuments.$inferSelect
export type NewActivityDocument = typeof activityDocuments.$inferInsert

// Legacy type aliases for backwards compatibility during migration
export type ComponentDocument = ActivityDocument
export type NewComponentDocument = NewActivityDocument
