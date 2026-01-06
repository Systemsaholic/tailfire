/**
 * Itinerary Templates Service
 *
 * Business logic for itinerary template CRUD operations.
 * Templates store reusable itinerary structures that can be applied to trips.
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type {
  CreateItineraryTemplateDto,
  UpdateItineraryTemplateDto,
  ItineraryTemplateResponse,
  ItineraryTemplateListResponse,
  TemplateListQuery,
} from '@tailfire/shared-types'

@Injectable()
export class ItineraryTemplatesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * List all itinerary templates for an agency
   */
  async findAll(query: TemplateListQuery): Promise<ItineraryTemplateListResponse> {
    const { agencyId, search, isActive, limit = 50, offset = 0 } = query

    const conditions = [eq(this.db.schema.itineraryTemplates.agencyId, agencyId)]

    // Filter by active status (default to active only)
    if (isActive !== undefined) {
      conditions.push(eq(this.db.schema.itineraryTemplates.isActive, isActive))
    } else {
      conditions.push(eq(this.db.schema.itineraryTemplates.isActive, true))
    }

    // Search by name or description
    if (search) {
      conditions.push(
        or(
          ilike(this.db.schema.itineraryTemplates.name, `%${search}%`),
          ilike(this.db.schema.itineraryTemplates.description, `%${search}%`)
        )!
      )
    }

    const [templates, countResult] = await Promise.all([
      this.db.client
        .select()
        .from(this.db.schema.itineraryTemplates)
        .where(and(...conditions))
        .orderBy(desc(this.db.schema.itineraryTemplates.updatedAt))
        .limit(limit)
        .offset(offset),
      this.db.client
        .select({ count: this.db.schema.itineraryTemplates.id })
        .from(this.db.schema.itineraryTemplates)
        .where(and(...conditions)),
    ])

    return {
      data: templates.map((t) => this.formatResponse(t)),
      total: countResult.length,
    }
  }

  /**
   * Get a single itinerary template by ID
   */
  async findById(id: string, agencyId: string): Promise<ItineraryTemplateResponse | null> {
    const [template] = await this.db.client
      .select()
      .from(this.db.schema.itineraryTemplates)
      .where(
        and(
          eq(this.db.schema.itineraryTemplates.id, id),
          eq(this.db.schema.itineraryTemplates.agencyId, agencyId)
        )
      )
      .limit(1)

    return template ? this.formatResponse(template) : null
  }

  /**
   * Get a single itinerary template by ID or throw
   */
  async findByIdOrThrow(id: string, agencyId: string): Promise<ItineraryTemplateResponse> {
    const template = await this.findById(id, agencyId)
    if (!template) {
      throw new NotFoundException(`Itinerary template ${id} not found`)
    }
    return template
  }

  /**
   * Create a new itinerary template
   */
  async create(dto: CreateItineraryTemplateDto & { createdBy?: string }): Promise<ItineraryTemplateResponse> {
    const [template] = await this.db.client
      .insert(this.db.schema.itineraryTemplates)
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
   * Update an itinerary template
   */
  async update(
    id: string,
    agencyId: string,
    dto: UpdateItineraryTemplateDto
  ): Promise<ItineraryTemplateResponse> {
    // Verify template exists and belongs to agency
    await this.findByIdOrThrow(id, agencyId)

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.payload !== undefined) updateData.payload = dto.payload

    const [updated] = await this.db.client
      .update(this.db.schema.itineraryTemplates)
      .set(updateData)
      .where(
        and(
          eq(this.db.schema.itineraryTemplates.id, id),
          eq(this.db.schema.itineraryTemplates.agencyId, agencyId)
        )
      )
      .returning()

    // Updated is guaranteed to exist after findByIdOrThrow check
    return this.formatResponse(updated!)
  }

  /**
   * Soft delete an itinerary template (set isActive = false)
   */
  async delete(id: string, agencyId: string): Promise<void> {
    // Verify template exists and belongs to agency
    await this.findByIdOrThrow(id, agencyId)

    await this.db.client
      .update(this.db.schema.itineraryTemplates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(this.db.schema.itineraryTemplates.id, id),
          eq(this.db.schema.itineraryTemplates.agencyId, agencyId)
        )
      )
  }

  /**
   * Format database row to API response
   */
  private formatResponse(template: typeof this.db.schema.itineraryTemplates.$inferSelect): ItineraryTemplateResponse {
    const payload = template.payload as ItineraryTemplateResponse['payload']

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
