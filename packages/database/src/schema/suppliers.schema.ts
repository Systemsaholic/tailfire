/**
 * Suppliers Schema
 *
 * Normalized supplier data for bookings (hotels, airlines, tour operators, etc.)
 */

import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core'

export type SupplierContactInfo = {
  email?: string
  phone?: string
  website?: string
  address?: string
}

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  supplierType: varchar('supplier_type', { length: 100 }), // e.g., 'hotel', 'airline', 'tour_operator'
  contactInfo: jsonb('contact_info').$type<SupplierContactInfo>(),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// TypeScript types
export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
