/**
 * Tour Inclusions Schema
 *
 * Included features, excluded items, and highlights for tours.
 */

import { uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { tours } from './tours.schema'

export const tourInclusions = catalogSchema.table('tour_inclusions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Tour reference
  tourId: uuid('tour_id')
    .notNull()
    .references(() => tours.id, { onDelete: 'cascade' }),

  // Inclusion details
  inclusionType: varchar('inclusion_type', { length: 50 }).notNull(), // 'included' | 'excluded' | 'highlight'
  category: varchar('category', { length: 100 }),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').default(0),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// TypeScript types
export type TourInclusion = typeof tourInclusions.$inferSelect
export type NewTourInclusion = typeof tourInclusions.$inferInsert
