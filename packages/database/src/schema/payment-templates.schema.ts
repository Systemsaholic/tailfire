/**
 * Payment Schedule Templates Schema
 *
 * Agency-scoped reusable payment schedule patterns and audit logging.
 * Templates define payment milestones that can be applied to activities.
 *
 * @see beta/docs/design/payment-schedule/PAYMENT_SCHEDULE_TEMPLATES.md
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  unique,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { scheduleTypeEnum } from './activity-pricing.schema'

// Audit action enum for payment schedule audit log
export const paymentAuditActionEnum = pgEnum('payment_audit_action', [
  'created',
  'updated',
  'deleted',
  'status_changed',
  'locked',
  'unlocked',
  'template_applied',
])

// Payment Schedule Templates - Agency-scoped reusable patterns
export const paymentScheduleTemplates = pgTable(
  'payment_schedule_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agencyId: uuid('agency_id').notNull(), // FK to agencies table (future)
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    scheduleType: scheduleTypeEnum('schedule_type').notNull(),
    isDefault: boolean('is_default').default(false),
    isActive: boolean('is_active').default(true),
    version: integer('version').default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
  },
  (table) => ({
    uniqueNameVersion: unique('uq_templates_agency_name_version').on(
      table.agencyId,
      table.name,
      table.version
    ),
    idxAgencyActive: index('idx_templates_agency_active').on(table.agencyId, table.isActive),
  })
)

// Template Items - Define payment milestones within a template
export const paymentScheduleTemplateItems = pgTable(
  'payment_schedule_template_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => paymentScheduleTemplates.id, { onDelete: 'cascade' }),
    sequenceOrder: integer('sequence_order').notNull(),
    paymentName: varchar('payment_name', { length: 100 }).notNull(),
    // Amount: percentage OR fixed (one must be set) - enforced via CHECK constraint in migration
    percentage: decimal('percentage', { precision: 5, scale: 2 }),
    fixedAmountCents: integer('fixed_amount_cents'),
    // Timing: EXACTLY ONE must be set - enforced via CHECK constraint in migration
    daysFromBooking: integer('days_from_booking'),
    daysBeforeDeparture: integer('days_before_departure'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxTemplateSequence: index('idx_template_items_template_seq').on(
      table.templateId,
      table.sequenceOrder
    ),
  })
)

// Audit Log - IMMUTABLE append-only record (TICO compliance)
// NO UPDATE/DELETE allowed - enforced via service layer and DB trigger
export const paymentScheduleAuditLog = pgTable(
  'payment_schedule_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: varchar('entity_type', { length: 50 }).notNull(), // 'template', 'config', 'item', 'transaction'
    entityId: uuid('entity_id').notNull(),
    agencyId: uuid('agency_id').notNull(), // For filtering audit logs by agency
    action: paymentAuditActionEnum('action').notNull(),
    oldValues: jsonb('old_values'), // JSONB for proper querying
    newValues: jsonb('new_values'), // JSONB for proper querying
    performedBy: uuid('performed_by').notNull(),
    performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length
    userAgent: text('user_agent'),
  },
  (table) => ({
    idxAuditEntityTime: index('idx_audit_log_entity_time').on(
      table.entityType,
      table.entityId,
      table.performedAt
    ),
    idxAuditAgencyTime: index('idx_audit_log_agency_time').on(table.agencyId, table.performedAt),
  })
)

// Relations
export const paymentScheduleTemplatesRelations = relations(paymentScheduleTemplates, ({ many }) => ({
  items: many(paymentScheduleTemplateItems),
}))

export const paymentScheduleTemplateItemsRelations = relations(
  paymentScheduleTemplateItems,
  ({ one }) => ({
    template: one(paymentScheduleTemplates, {
      fields: [paymentScheduleTemplateItems.templateId],
      references: [paymentScheduleTemplates.id],
    }),
  })
)

// TypeScript types
export type PaymentScheduleTemplate = typeof paymentScheduleTemplates.$inferSelect
export type NewPaymentScheduleTemplate = typeof paymentScheduleTemplates.$inferInsert

export type PaymentScheduleTemplateItem = typeof paymentScheduleTemplateItems.$inferSelect
export type NewPaymentScheduleTemplateItem = typeof paymentScheduleTemplateItems.$inferInsert

export type PaymentScheduleAuditLogEntry = typeof paymentScheduleAuditLog.$inferSelect
export type NewPaymentScheduleAuditLogEntry = typeof paymentScheduleAuditLog.$inferInsert

export type PaymentAuditAction = (typeof paymentAuditActionEnum.enumValues)[number]
