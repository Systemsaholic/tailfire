/**
 * Activity Suppliers Schema
 *
 * Many-to-many relationship between activities and suppliers
 */

import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'
import { suppliers } from './suppliers.schema'

export const activitySuppliers = pgTable('activity_suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'cascade' }),

  primarySupplier: boolean('primary_supplier').notNull().default(true),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const activitySuppliersRelations = relations(activitySuppliers, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [activitySuppliers.activityId],
    references: [itineraryActivities.id],
  }),
  supplier: one(suppliers, {
    fields: [activitySuppliers.supplierId],
    references: [suppliers.id],
  }),
}))

// TypeScript types
export type ActivitySupplier = typeof activitySuppliers.$inferSelect
export type NewActivitySupplier = typeof activitySuppliers.$inferInsert

// Legacy type aliases for backwards compatibility during migration
export type ComponentSupplier = ActivitySupplier
export type NewComponentSupplier = NewActivitySupplier
