/**
 * Payment Templates Service
 *
 * Manages agency-scoped payment schedule templates.
 * Templates define reusable payment patterns (deposit schedules, installment plans)
 * that can be applied to activities.
 *
 * @see beta/docs/design/payment-schedule/PAYMENT_SCHEDULE_TEMPLATES.md
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { and, eq, desc } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import { PaymentAuditService } from './payment-audit.service'
import type {
  PaymentScheduleTemplateDto,
  CreatePaymentScheduleTemplateDto,
  UpdatePaymentScheduleTemplateDto,
  PaymentScheduleTemplateItemDto,
  CreatePaymentScheduleTemplateItemDto,
} from '@tailfire/shared-types'

@Injectable()
export class PaymentTemplatesService {
  private readonly logger = new Logger(PaymentTemplatesService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: PaymentAuditService
  ) {}

  // ============================================================================
  // Template CRUD Operations
  // ============================================================================

  /**
   * List all active templates for an agency
   */
  async findAllByAgency(
    agencyId: string,
    options?: { includeInactive?: boolean }
  ): Promise<PaymentScheduleTemplateDto[]> {
    const conditions = [eq(this.db.schema.paymentScheduleTemplates.agencyId, agencyId)]

    if (!options?.includeInactive) {
      conditions.push(eq(this.db.schema.paymentScheduleTemplates.isActive, true))
    }

    const templates = await this.db.client
      .select()
      .from(this.db.schema.paymentScheduleTemplates)
      .where(and(...conditions))
      .orderBy(
        desc(this.db.schema.paymentScheduleTemplates.isDefault),
        desc(this.db.schema.paymentScheduleTemplates.updatedAt)
      )

    // Load items for each template
    const results: PaymentScheduleTemplateDto[] = []
    for (const template of templates) {
      const items = await this.findTemplateItems(template.id)
      results.push(this.formatTemplate(template, items))
    }

    return results
  }

  /**
   * Get a template by ID with agency validation
   */
  async findById(
    templateId: string,
    agencyId: string
  ): Promise<PaymentScheduleTemplateDto | null> {
    const [template] = await this.db.client
      .select()
      .from(this.db.schema.paymentScheduleTemplates)
      .where(
        and(
          eq(this.db.schema.paymentScheduleTemplates.id, templateId),
          eq(this.db.schema.paymentScheduleTemplates.agencyId, agencyId)
        )
      )
      .limit(1)

    if (!template) {
      return null
    }

    const items = await this.findTemplateItems(template.id)
    return this.formatTemplate(template, items)
  }

  /**
   * Get a template by ID (throws if not found or wrong agency)
   */
  async findByIdOrThrow(
    templateId: string,
    agencyId: string
  ): Promise<PaymentScheduleTemplateDto> {
    const template = await this.findById(templateId, agencyId)
    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`)
    }
    return template
  }

  /**
   * Get the default template for an agency (if any)
   */
  async findDefault(agencyId: string): Promise<PaymentScheduleTemplateDto | null> {
    const [template] = await this.db.client
      .select()
      .from(this.db.schema.paymentScheduleTemplates)
      .where(
        and(
          eq(this.db.schema.paymentScheduleTemplates.agencyId, agencyId),
          eq(this.db.schema.paymentScheduleTemplates.isDefault, true),
          eq(this.db.schema.paymentScheduleTemplates.isActive, true)
        )
      )
      .limit(1)

    if (!template) {
      return null
    }

    const items = await this.findTemplateItems(template.id)
    return this.formatTemplate(template, items)
  }

  /**
   * Create a new payment schedule template
   */
  async create(
    agencyId: string,
    userId: string,
    data: CreatePaymentScheduleTemplateDto
  ): Promise<PaymentScheduleTemplateDto> {
    // Validate items
    this.validateTemplateItems(data.items)

    return this.db.client.transaction(async (tx) => {
      // If setting as default, unset other defaults first
      if (data.isDefault) {
        await tx
          .update(this.db.schema.paymentScheduleTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(this.db.schema.paymentScheduleTemplates.agencyId, agencyId),
              eq(this.db.schema.paymentScheduleTemplates.isDefault, true)
            )
          )
      }

      // Create template
      const insertedTemplates = await tx
        .insert(this.db.schema.paymentScheduleTemplates)
        .values({
          agencyId,
          name: data.name,
          description: data.description ?? null,
          scheduleType: data.scheduleType,
          isDefault: data.isDefault ?? false,
          isActive: true,
          version: 1,
          createdBy: userId,
        })
        .returning()

      const template = insertedTemplates[0]
      if (!template) {
        throw new Error('Failed to create template')
      }

      // Create items
      const items: PaymentScheduleTemplateItemDto[] = []
      for (const itemData of data.items) {
        const insertedItems = await tx
          .insert(this.db.schema.paymentScheduleTemplateItems)
          .values({
            templateId: template.id,
            sequenceOrder: itemData.sequenceOrder,
            paymentName: itemData.paymentName,
            percentage: itemData.percentage?.toString() ?? null,
            fixedAmountCents: itemData.fixedAmountCents ?? null,
            daysFromBooking: itemData.daysFromBooking ?? null,
            daysBeforeDeparture: itemData.daysBeforeDeparture ?? null,
          })
          .returning()

        const item = insertedItems[0]
        if (!item) {
          throw new Error('Failed to create template item')
        }
        items.push(this.formatTemplateItem(item))
      }

      // Audit log
      await this.auditService.logCreated(
        'template',
        template.id,
        agencyId,
        userId,
        {
          name: template.name,
          scheduleType: template.scheduleType,
          itemCount: items.length,
        }
      )

      this.logger.log(
        `Created payment template "${template.name}" (${template.id}) for agency ${agencyId}`
      )

      return this.formatTemplate(template, items)
    })
  }

  /**
   * Update an existing template.
   * Creates a new version if items are changed (for audit trail).
   */
  async update(
    templateId: string,
    agencyId: string,
    userId: string,
    data: UpdatePaymentScheduleTemplateDto
  ): Promise<PaymentScheduleTemplateDto> {
    const existing = await this.findByIdOrThrow(templateId, agencyId)

    // Validate items if provided
    if (data.items) {
      this.validateTemplateItems(data.items)
    }

    return this.db.client.transaction(async (tx) => {
      const oldValues = { ...existing }

      // If setting as default, unset other defaults first
      if (data.isDefault && !existing.isDefault) {
        await tx
          .update(this.db.schema.paymentScheduleTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(this.db.schema.paymentScheduleTemplates.agencyId, agencyId),
              eq(this.db.schema.paymentScheduleTemplates.isDefault, true)
            )
          )
      }

      // Determine if we need to version (items changed)
      const needsVersion = data.items !== undefined
      const newVersion = needsVersion ? existing.version + 1 : existing.version

      // Update template
      const updatedTemplates = await tx
        .update(this.db.schema.paymentScheduleTemplates)
        .set({
          name: data.name ?? existing.name,
          description: data.description !== undefined ? data.description : existing.description,
          scheduleType: data.scheduleType ?? existing.scheduleType,
          isDefault: data.isDefault ?? existing.isDefault,
          isActive: data.isActive ?? existing.isActive,
          version: newVersion,
          updatedAt: new Date(),
        })
        .where(eq(this.db.schema.paymentScheduleTemplates.id, templateId))
        .returning()

      const updated = updatedTemplates[0]
      if (!updated) {
        throw new Error('Failed to update template')
      }

      let items: PaymentScheduleTemplateItemDto[]

      if (data.items) {
        // Delete existing items
        await tx
          .delete(this.db.schema.paymentScheduleTemplateItems)
          .where(eq(this.db.schema.paymentScheduleTemplateItems.templateId, templateId))

        // Create new items
        items = []
        for (const itemData of data.items) {
          const insertedItems = await tx
            .insert(this.db.schema.paymentScheduleTemplateItems)
            .values({
              templateId: templateId,
              sequenceOrder: itemData.sequenceOrder,
              paymentName: itemData.paymentName,
              percentage: itemData.percentage?.toString() ?? null,
              fixedAmountCents: itemData.fixedAmountCents ?? null,
              daysFromBooking: itemData.daysFromBooking ?? null,
              daysBeforeDeparture: itemData.daysBeforeDeparture ?? null,
            })
            .returning()

          const item = insertedItems[0]
          if (!item) {
            throw new Error('Failed to create template item')
          }
          items.push(this.formatTemplateItem(item))
        }
      } else {
        // Keep existing items
        items = existing.items ?? []
      }

      // Audit log
      await this.auditService.logUpdated(
        'template',
        templateId,
        agencyId,
        userId,
        oldValues,
        {
          name: updated.name,
          scheduleType: updated.scheduleType,
          version: updated.version,
          itemCount: items.length,
        }
      )

      this.logger.log(
        `Updated payment template "${updated.name}" (${templateId}) to version ${updated.version}`
      )

      return this.formatTemplate(updated, items)
    })
  }

  /**
   * Soft delete a template (set isActive = false)
   */
  async delete(
    templateId: string,
    agencyId: string,
    userId: string
  ): Promise<void> {
    const existing = await this.findByIdOrThrow(templateId, agencyId)

    await this.db.client
      .update(this.db.schema.paymentScheduleTemplates)
      .set({
        isActive: false,
        isDefault: false, // Can't be default if inactive
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.paymentScheduleTemplates.id, templateId))

    // Audit log
    await this.auditService.logDeleted(
      'template',
      templateId,
      agencyId,
      userId,
      { name: existing.name, scheduleType: existing.scheduleType }
    )

    this.logger.log(
      `Soft deleted payment template "${existing.name}" (${templateId})`
    )
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Find template items
   */
  private async findTemplateItems(
    templateId: string
  ): Promise<PaymentScheduleTemplateItemDto[]> {
    const items = await this.db.client
      .select()
      .from(this.db.schema.paymentScheduleTemplateItems)
      .where(eq(this.db.schema.paymentScheduleTemplateItems.templateId, templateId))
      .orderBy(this.db.schema.paymentScheduleTemplateItems.sequenceOrder)

    return items.map((item) => this.formatTemplateItem(item))
  }

  /**
   * Validate template items:
   * - At least one item required
   * - Each item must have exactly one amount type (percentage OR fixedAmountCents)
   * - Each item must have exactly one timing type (daysFromBooking OR daysBeforeDeparture)
   * - Percentages must be 0-100
   * - Amounts must be positive
   */
  private validateTemplateItems(items: CreatePaymentScheduleTemplateItemDto[]): void {
    if (!items || items.length === 0) {
      throw new BadRequestException('At least one template item is required')
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item) {
        continue // TypeScript guard - should never happen due to length check
      }
      const prefix = `Item ${i + 1}`

      // Validate amount type (exactly one must be set)
      const hasPercentage = item.percentage !== undefined && item.percentage !== null
      const hasFixed = item.fixedAmountCents !== undefined && item.fixedAmountCents !== null

      if (!hasPercentage && !hasFixed) {
        throw new BadRequestException(
          `${prefix}: Either percentage or fixedAmountCents must be set`
        )
      }

      if (hasPercentage && hasFixed) {
        throw new BadRequestException(
          `${prefix}: Cannot set both percentage and fixedAmountCents`
        )
      }

      // Validate percentage range
      if (hasPercentage && (item.percentage! < 0 || item.percentage! > 100)) {
        throw new BadRequestException(
          `${prefix}: Percentage must be between 0 and 100`
        )
      }

      // Validate fixed amount is positive
      if (hasFixed && item.fixedAmountCents! <= 0) {
        throw new BadRequestException(
          `${prefix}: Fixed amount must be positive`
        )
      }

      // Validate timing type (exactly one must be set)
      const hasDaysFromBooking =
        item.daysFromBooking !== undefined && item.daysFromBooking !== null
      const hasDaysBeforeDeparture =
        item.daysBeforeDeparture !== undefined && item.daysBeforeDeparture !== null

      if (!hasDaysFromBooking && !hasDaysBeforeDeparture) {
        throw new BadRequestException(
          `${prefix}: Either daysFromBooking or daysBeforeDeparture must be set`
        )
      }

      if (hasDaysFromBooking && hasDaysBeforeDeparture) {
        throw new BadRequestException(
          `${prefix}: Cannot set both daysFromBooking and daysBeforeDeparture`
        )
      }

      // Validate days are non-negative
      if (hasDaysFromBooking && item.daysFromBooking! < 0) {
        throw new BadRequestException(
          `${prefix}: daysFromBooking must be non-negative`
        )
      }

      if (hasDaysBeforeDeparture && item.daysBeforeDeparture! < 0) {
        throw new BadRequestException(
          `${prefix}: daysBeforeDeparture must be non-negative`
        )
      }
    }

    // Validate percentages sum to 100 if all items use percentage
    const allPercentage = items.every(
      (item) => item.percentage !== undefined && item.percentage !== null
    )
    if (allPercentage) {
      const sum = items.reduce((acc, item) => acc + (item.percentage ?? 0), 0)
      if (Math.abs(sum - 100) > 0.01) {
        throw new BadRequestException(
          `Template item percentages must sum to 100 (current sum: ${sum})`
        )
      }
    }
  }

  /**
   * Format raw template row to DTO
   */
  private formatTemplate(
    row: {
      id: string
      agencyId: string
      name: string
      description: string | null
      scheduleType: string
      isDefault: boolean | null
      isActive: boolean | null
      version: number | null
      createdAt: Date
      updatedAt: Date
      createdBy: string | null
    },
    items: PaymentScheduleTemplateItemDto[]
  ): PaymentScheduleTemplateDto {
    return {
      id: row.id,
      agencyId: row.agencyId,
      name: row.name,
      description: row.description,
      scheduleType: row.scheduleType as PaymentScheduleTemplateDto['scheduleType'],
      isDefault: row.isDefault ?? false,
      isActive: row.isActive ?? true,
      version: row.version ?? 1,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdBy,
      items,
    }
  }

  /**
   * Format raw template item row to DTO
   */
  private formatTemplateItem(row: {
    id: string
    templateId: string
    sequenceOrder: number
    paymentName: string
    percentage: string | null
    fixedAmountCents: number | null
    daysFromBooking: number | null
    daysBeforeDeparture: number | null
    createdAt: Date
  }): PaymentScheduleTemplateItemDto {
    return {
      id: row.id,
      templateId: row.templateId,
      sequenceOrder: row.sequenceOrder,
      paymentName: row.paymentName,
      percentage: row.percentage,
      fixedAmountCents: row.fixedAmountCents,
      daysFromBooking: row.daysFromBooking,
      daysBeforeDeparture: row.daysBeforeDeparture,
      createdAt: row.createdAt.toISOString(),
    }
  }
}
