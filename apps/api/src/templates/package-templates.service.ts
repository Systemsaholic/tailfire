/**
 * Package Templates Service
 *
 * Business logic for package template CRUD operations.
 * Templates store reusable package structures that can be applied to itineraries.
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type {
  CreatePackageTemplateDto,
  UpdatePackageTemplateDto,
  PackageTemplateResponse,
  PackageTemplateListResponse,
  TemplateListQuery,
} from '@tailfire/shared-types'

@Injectable()
export class PackageTemplatesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * List all package templates for an agency
   */
  async findAll(query: TemplateListQuery): Promise<PackageTemplateListResponse> {
    const { agencyId, search, isActive, limit = 50, offset = 0 } = query

    const conditions = [eq(this.db.schema.packageTemplates.agencyId, agencyId)]

    // Filter by active status (default to active only)
    if (isActive !== undefined) {
      conditions.push(eq(this.db.schema.packageTemplates.isActive, isActive))
    } else {
      conditions.push(eq(this.db.schema.packageTemplates.isActive, true))
    }

    // Search by name or description
    if (search) {
      conditions.push(
        or(
          ilike(this.db.schema.packageTemplates.name, `%${search}%`),
          ilike(this.db.schema.packageTemplates.description, `%${search}%`)
        )!
      )
    }

    const [templates, countResult] = await Promise.all([
      this.db.client
        .select()
        .from(this.db.schema.packageTemplates)
        .where(and(...conditions))
        .orderBy(desc(this.db.schema.packageTemplates.updatedAt))
        .limit(limit)
        .offset(offset),
      this.db.client
        .select({ count: this.db.schema.packageTemplates.id })
        .from(this.db.schema.packageTemplates)
        .where(and(...conditions)),
    ])

    return {
      data: templates.map((t) => this.formatResponse(t)),
      total: countResult.length,
    }
  }

  /**
   * Get a single package template by ID
   */
  async findById(id: string, agencyId: string): Promise<PackageTemplateResponse | null> {
    const [template] = await this.db.client
      .select()
      .from(this.db.schema.packageTemplates)
      .where(
        and(
          eq(this.db.schema.packageTemplates.id, id),
          eq(this.db.schema.packageTemplates.agencyId, agencyId)
        )
      )
      .limit(1)

    return template ? this.formatResponse(template) : null
  }

  /**
   * Get a single package template by ID or throw
   */
  async findByIdOrThrow(id: string, agencyId: string): Promise<PackageTemplateResponse> {
    const template = await this.findById(id, agencyId)
    if (!template) {
      throw new NotFoundException(`Package template ${id} not found`)
    }
    return template
  }

  /**
   * Create a new package template
   */
  async create(dto: CreatePackageTemplateDto & { createdBy?: string }): Promise<PackageTemplateResponse> {
    const [template] = await this.db.client
      .insert(this.db.schema.packageTemplates)
      .values({
        agencyId: dto.agencyId,
        name: dto.name,
        description: dto.description ?? null,
        payload: dto.payload,
        isActive: true,
        createdBy: dto.createdBy ?? null,
      })
      .returning()

    // Template is guaranteed to exist after insert
    return this.formatResponse(template!)
  }

  /**
   * Update a package template
   */
  async update(
    id: string,
    agencyId: string,
    dto: UpdatePackageTemplateDto
  ): Promise<PackageTemplateResponse> {
    // Verify template exists and belongs to agency
    await this.findByIdOrThrow(id, agencyId)

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.payload !== undefined) updateData.payload = dto.payload

    const [updated] = await this.db.client
      .update(this.db.schema.packageTemplates)
      .set(updateData)
      .where(
        and(
          eq(this.db.schema.packageTemplates.id, id),
          eq(this.db.schema.packageTemplates.agencyId, agencyId)
        )
      )
      .returning()

    // Updated is guaranteed to exist after findByIdOrThrow check
    return this.formatResponse(updated!)
  }

  /**
   * Soft delete a package template (set isActive = false)
   */
  async delete(id: string, agencyId: string): Promise<void> {
    // Verify template exists and belongs to agency
    await this.findByIdOrThrow(id, agencyId)

    await this.db.client
      .update(this.db.schema.packageTemplates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(this.db.schema.packageTemplates.id, id),
          eq(this.db.schema.packageTemplates.agencyId, agencyId)
        )
      )
  }

  /**
   * Format database row to API response
   */
  private formatResponse(template: typeof this.db.schema.packageTemplates.$inferSelect): PackageTemplateResponse {
    const payload = template.payload as PackageTemplateResponse['payload']

    // Compute summary stats
    const dayCount = payload?.dayOffsets?.length ?? 0
    const activityCount = payload?.dayOffsets?.reduce((sum, day) => sum + (day.activities?.length ?? 0), 0) ?? 0

    return {
      id: template.id,
      agencyId: template.agencyId,
      name: template.name,
      description: template.description,
      payload,
      isActive: template.isActive,
      createdBy: template.createdBy,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      dayCount,
      activityCount,
    }
  }
}
