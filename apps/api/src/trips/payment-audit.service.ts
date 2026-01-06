/**
 * Payment Audit Service
 *
 * Append-only audit logging for payment schedule operations.
 * This service enforces TICO compliance by maintaining an immutable record
 * of all payment schedule changes.
 *
 * CRITICAL: This service only supports INSERT operations.
 * The audit log table has database-level protections against UPDATE/DELETE.
 *
 * @see beta/docs/design/payment-schedule/PAYMENT_SCHEDULE_TEMPLATES.md
 */

import { Injectable, Logger } from '@nestjs/common'
import { and, eq, desc, gte, lte } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type {
  PaymentAuditAction,
  PaymentScheduleAuditLogDto,
  AuditLogQueryDto,
} from '@tailfire/shared-types'

/**
 * Entity types that can be audited
 */
export type AuditEntityType = 'template' | 'config' | 'item' | 'transaction'

/**
 * Audit log entry input (for creating new entries)
 */
export interface CreateAuditLogEntry {
  entityType: AuditEntityType
  entityId: string
  agencyId: string
  action: PaymentAuditAction
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  performedBy: string
  ipAddress?: string | null
  userAgent?: string | null
}

@Injectable()
export class PaymentAuditService {
  private readonly logger = new Logger(PaymentAuditService.name)

  constructor(private readonly db: DatabaseService) {}

  /**
   * Log a payment schedule audit entry.
   * This is the ONLY method that writes to the audit log.
   *
   * Note: The audit log table has database-level protections:
   * - REVOKE UPDATE, DELETE on the table (if api_user role exists)
   * - Trigger that raises exception on UPDATE/DELETE attempts
   */
  async log(entry: CreateAuditLogEntry): Promise<void> {
    try {
      await this.db.client
        .insert(this.db.schema.paymentScheduleAuditLog)
        .values({
          entityType: entry.entityType,
          entityId: entry.entityId,
          agencyId: entry.agencyId,
          action: entry.action,
          oldValues: entry.oldValues ?? null,
          newValues: entry.newValues ?? null,
          performedBy: entry.performedBy,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
        })

      this.logger.debug(
        `Audit log: ${entry.action} on ${entry.entityType}:${entry.entityId} by ${entry.performedBy}`
      )
    } catch (error) {
      // Log the error but don't fail the operation
      // Audit logging should not block business operations
      this.logger.error(
        `Failed to write audit log entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      )
    }
  }

  /**
   * Log a 'created' action
   */
  async logCreated(
    entityType: AuditEntityType,
    entityId: string,
    agencyId: string,
    performedBy: string,
    newValues: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      agencyId,
      action: 'created',
      oldValues: null,
      newValues,
      performedBy,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    })
  }

  /**
   * Log an 'updated' action
   */
  async logUpdated(
    entityType: AuditEntityType,
    entityId: string,
    agencyId: string,
    performedBy: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      agencyId,
      action: 'updated',
      oldValues,
      newValues,
      performedBy,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    })
  }

  /**
   * Log a 'deleted' action
   */
  async logDeleted(
    entityType: AuditEntityType,
    entityId: string,
    agencyId: string,
    performedBy: string,
    oldValues: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      agencyId,
      action: 'deleted',
      oldValues,
      newValues: null,
      performedBy,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    })
  }

  /**
   * Log a 'status_changed' action (specific for payment items)
   */
  async logStatusChanged(
    entityType: AuditEntityType,
    entityId: string,
    agencyId: string,
    performedBy: string,
    oldStatus: string,
    newStatus: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      agencyId,
      action: 'status_changed',
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      performedBy,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    })
  }

  /**
   * Log a 'locked' action (item locked after payment)
   */
  async logLocked(
    entityId: string,
    agencyId: string,
    performedBy: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      entityType: 'item',
      entityId,
      agencyId,
      action: 'locked',
      oldValues: { isLocked: false },
      newValues: { isLocked: true, lockedAt: new Date().toISOString(), lockedBy: performedBy },
      performedBy,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    })
  }

  /**
   * Log an 'unlocked' action (admin unlock with reason)
   */
  async logUnlocked(
    entityId: string,
    agencyId: string,
    performedBy: string,
    reason: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      entityType: 'item',
      entityId,
      agencyId,
      action: 'unlocked',
      oldValues: { isLocked: true },
      newValues: { isLocked: false, unlockReason: reason },
      performedBy,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    })
  }

  /**
   * Log a 'template_applied' action
   */
  async logTemplateApplied(
    configId: string,
    agencyId: string,
    performedBy: string,
    templateId: string,
    templateVersion: number,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      entityType: 'config',
      entityId: configId,
      agencyId,
      action: 'template_applied',
      oldValues: null,
      newValues: { templateId, templateVersion },
      performedBy,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    })
  }

  /**
   * Query audit log entries (read-only).
   * Filtered by agency for multi-tenant isolation.
   */
  async getAuditLog(
    agencyId: string,
    query?: AuditLogQueryDto
  ): Promise<PaymentScheduleAuditLogDto[]> {
    const conditions = [eq(this.db.schema.paymentScheduleAuditLog.agencyId, agencyId)]

    if (query?.entityType) {
      conditions.push(eq(this.db.schema.paymentScheduleAuditLog.entityType, query.entityType))
    }

    if (query?.entityId) {
      conditions.push(eq(this.db.schema.paymentScheduleAuditLog.entityId, query.entityId))
    }

    if (query?.action) {
      conditions.push(eq(this.db.schema.paymentScheduleAuditLog.action, query.action))
    }

    if (query?.from) {
      conditions.push(gte(this.db.schema.paymentScheduleAuditLog.performedAt, new Date(query.from)))
    }

    if (query?.to) {
      conditions.push(lte(this.db.schema.paymentScheduleAuditLog.performedAt, new Date(query.to)))
    }

    const limit = query?.limit ?? 50
    const offset = query?.offset ?? 0

    const results = await this.db.client
      .select()
      .from(this.db.schema.paymentScheduleAuditLog)
      .where(and(...conditions))
      .orderBy(desc(this.db.schema.paymentScheduleAuditLog.performedAt))
      .limit(limit)
      .offset(offset)

    return results.map((row) => this.formatAuditLogEntry(row))
  }

  /**
   * Get audit log for a specific entity
   */
  async getEntityAuditLog(
    entityType: AuditEntityType,
    entityId: string,
    agencyId: string
  ): Promise<PaymentScheduleAuditLogDto[]> {
    return this.getAuditLog(agencyId, { entityType, entityId })
  }

  /**
   * Format a raw audit log row to DTO
   */
  private formatAuditLogEntry(row: {
    id: string
    entityType: string
    entityId: string
    agencyId: string
    action: string
    oldValues: unknown
    newValues: unknown
    performedBy: string
    performedAt: Date
    ipAddress: string | null
    userAgent: string | null
  }): PaymentScheduleAuditLogDto {
    return {
      id: row.id,
      entityType: row.entityType as 'template' | 'config' | 'item' | 'transaction',
      entityId: row.entityId,
      agencyId: row.agencyId,
      action: row.action as PaymentAuditAction,
      oldValues: row.oldValues as Record<string, unknown> | null,
      newValues: row.newValues as Record<string, unknown> | null,
      performedBy: row.performedBy,
      performedAt: row.performedAt.toISOString(),
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
    }
  }
}
