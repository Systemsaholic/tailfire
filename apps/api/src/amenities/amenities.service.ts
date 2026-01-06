/**
 * Amenities Service
 *
 * Business logic for managing amenities and activity-amenity assignments.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { eq, ilike, and, inArray } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import { schema } from '@tailfire/database'
import type {
  AmenityResponseDto,
  AmenitiesByCategory,
  BulkUpsertAmenitiesResponseDto,
  AmenityCategory,
  AmenitySource,
} from '@tailfire/shared-types'
import type {
  CreateAmenityDto,
  UpdateAmenityDto,
  AmenityFilterDto,
  BulkUpsertAmenitiesDto,
} from './dto'

// Category display labels
const CATEGORY_LABELS: Record<AmenityCategory, string> = {
  connectivity: 'Connectivity',
  facilities: 'Facilities',
  dining: 'Dining',
  services: 'Services',
  parking: 'Parking',
  accessibility: 'Accessibility',
  room_features: 'Room Features',
  family: 'Family',
  pets: 'Pets',
  other: 'Other',
}

@Injectable()
export class AmenitiesService {
  private readonly logger = new Logger(AmenitiesService.name)

  constructor(private readonly db: DatabaseService) {}

  /**
   * Generate a URL-safe slug from a name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .replace(/^-|-$/g, '') // Trim hyphens
      .slice(0, 100) // Max length
  }

  /**
   * Map database row to response DTO
   */
  private toResponseDto(row: typeof schema.amenities.$inferSelect): AmenityResponseDto {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      icon: row.icon,
      description: row.description,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  /**
   * Get all amenities with optional filtering
   */
  async findAll(filters: AmenityFilterDto = {}): Promise<AmenityResponseDto[]> {
    const conditions = []

    if (filters.search) {
      conditions.push(ilike(schema.amenities.name, `%${filters.search}%`))
    }
    if (filters.category) {
      conditions.push(eq(schema.amenities.category, filters.category))
    }
    if (filters.source) {
      conditions.push(eq(schema.amenities.source, filters.source))
    }

    const results = await this.db.client
      .select()
      .from(schema.amenities)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(schema.amenities.category, schema.amenities.name)

    return results.map(this.toResponseDto)
  }

  /**
   * Get amenities grouped by category for UI display
   */
  async findAllGroupedByCategory(): Promise<AmenitiesByCategory[]> {
    const all = await this.findAll()

    const grouped = new Map<AmenityCategory, AmenityResponseDto[]>()

    // Initialize all categories (in order)
    const categoryOrder: AmenityCategory[] = [
      'connectivity',
      'facilities',
      'dining',
      'services',
      'parking',
      'accessibility',
      'room_features',
      'family',
      'pets',
      'other',
    ]

    for (const category of categoryOrder) {
      grouped.set(category, [])
    }

    // Group amenities
    for (const amenity of all) {
      const list = grouped.get(amenity.category) || []
      list.push(amenity)
      grouped.set(amenity.category, list)
    }

    // Convert to array, only include categories with amenities
    const result: AmenitiesByCategory[] = []
    for (const category of categoryOrder) {
      const categoryAmenities = grouped.get(category) || []
      if (categoryAmenities.length > 0) {
        result.push({
          category,
          label: CATEGORY_LABELS[category],
          amenities: categoryAmenities,
        })
      }
    }

    return result
  }

  /**
   * Get a single amenity by ID
   */
  async findOne(id: string): Promise<AmenityResponseDto> {
    const [result] = await this.db.client
      .select()
      .from(schema.amenities)
      .where(eq(schema.amenities.id, id))
      .limit(1)

    if (!result) {
      throw new NotFoundException(`Amenity with ID ${id} not found`)
    }

    return this.toResponseDto(result)
  }

  /**
   * Create a new amenity
   */
  async create(dto: CreateAmenityDto): Promise<AmenityResponseDto> {
    const slug = this.generateSlug(dto.name)

    const [result] = await this.db.client
      .insert(schema.amenities)
      .values({
        name: dto.name,
        slug,
        category: dto.category || 'other',
        icon: dto.icon,
        description: dto.description,
        source: 'manual',
      })
      .returning()

    this.logger.log(`Created amenity: ${result!.name} (${result!.id})`)
    return this.toResponseDto(result!)
  }

  /**
   * Update an amenity
   */
  async update(id: string, dto: UpdateAmenityDto): Promise<AmenityResponseDto> {
    await this.findOne(id) // Throws if not found

    const updates: Partial<typeof schema.amenities.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (dto.name !== undefined) {
      updates.name = dto.name
      updates.slug = this.generateSlug(dto.name)
    }
    if (dto.category !== undefined) {
      updates.category = dto.category
    }
    if (dto.icon !== undefined) {
      updates.icon = dto.icon
    }
    if (dto.description !== undefined) {
      updates.description = dto.description
    }

    const [result] = await this.db.client
      .update(schema.amenities)
      .set(updates)
      .where(eq(schema.amenities.id, id))
      .returning()

    return this.toResponseDto(result!)
  }

  /**
   * Delete an amenity
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id) // Throws if not found

    await this.db.client.delete(schema.amenities).where(eq(schema.amenities.id, id))

    this.logger.log(`Deleted amenity: ${id}`)
  }

  /**
   * Bulk upsert amenities (for external API integration)
   * Creates new amenities if they don't exist, returns all matching amenities
   */
  async bulkUpsert(dto: BulkUpsertAmenitiesDto): Promise<BulkUpsertAmenitiesResponseDto> {
    const slugs = dto.names.map(name => this.generateSlug(name))

    // Find existing amenities by slug
    const existing = await this.db.client
      .select()
      .from(schema.amenities)
      .where(inArray(schema.amenities.slug, slugs))

    const existingSlugs = new Set(existing.map(a => a.slug))

    // Determine which need to be created
    const toCreate: { name: string; slug: string }[] = []
    for (let i = 0; i < dto.names.length; i++) {
      const slug = slugs[i]!
      const name = dto.names[i]!
      if (!existingSlugs.has(slug)) {
        toCreate.push({ name, slug })
      }
    }

    // Create new amenities
    let created: typeof schema.amenities.$inferSelect[] = []
    if (toCreate.length > 0) {
      created = await this.db.client
        .insert(schema.amenities)
        .values(
          toCreate.map(({ name, slug }) => ({
            name,
            slug,
            category: 'other' as AmenityCategory,
            source: dto.source,
          }))
        )
        .onConflictDoNothing()
        .returning()

      this.logger.log(`Created ${created.length} new amenities from ${dto.source}`)
    }

    // Return all matching amenities
    const all = [...existing, ...created]

    // Filter to only return amenities matching the requested names/slugs
    const requestedSlugsSet = new Set(slugs)
    const filtered = all.filter(a => requestedSlugsSet.has(a.slug))

    return {
      amenities: filtered.map(this.toResponseDto),
      created: created.length,
    }
  }

  // ============================================================================
  // Activity Amenity Management
  // ============================================================================

  /**
   * Get amenities for an activity
   */
  async getAmenitiesForActivity(activityId: string): Promise<AmenityResponseDto[]> {
    const results = await this.db.client
      .select({ amenity: schema.amenities })
      .from(schema.activityAmenities)
      .innerJoin(schema.amenities, eq(schema.activityAmenities.amenityId, schema.amenities.id))
      .where(eq(schema.activityAmenities.activityId, activityId))
      .orderBy(schema.amenities.category, schema.amenities.name)

    return results.map(r => this.toResponseDto(r.amenity))
  }

  /**
   * Update amenities for an activity (replace all)
   */
  async updateActivityAmenities(
    activityId: string,
    amenityIds: string[]
  ): Promise<AmenityResponseDto[]> {
    // Delete existing assignments
    await this.db.client
      .delete(schema.activityAmenities)
      .where(eq(schema.activityAmenities.activityId, activityId))

    // Insert new assignments
    if (amenityIds.length > 0) {
      await this.db.client.insert(schema.activityAmenities).values(
        amenityIds.map(amenityId => ({
          activityId,
          amenityId,
        }))
      )
    }

    // Return updated list
    return this.getAmenitiesForActivity(activityId)
  }

  /**
   * Add amenities to an activity (append, don't replace)
   */
  async addAmenitiesToActivity(
    activityId: string,
    amenityIds: string[]
  ): Promise<AmenityResponseDto[]> {
    if (amenityIds.length > 0) {
      // Use ON CONFLICT DO NOTHING to handle duplicates
      await this.db.client
        .insert(schema.activityAmenities)
        .values(
          amenityIds.map(amenityId => ({
            activityId,
            amenityId,
          }))
        )
        .onConflictDoNothing()
    }

    return this.getAmenitiesForActivity(activityId)
  }

  /**
   * Remove specific amenities from an activity
   */
  async removeAmenitiesFromActivity(
    activityId: string,
    amenityIds: string[]
  ): Promise<AmenityResponseDto[]> {
    if (amenityIds.length > 0) {
      await this.db.client
        .delete(schema.activityAmenities)
        .where(
          and(
            eq(schema.activityAmenities.activityId, activityId),
            inArray(schema.activityAmenities.amenityId, amenityIds)
          )
        )
    }

    return this.getAmenitiesForActivity(activityId)
  }

  /**
   * Bulk upsert amenities by name and assign to activity
   * Used by external API integration to auto-create missing amenities
   */
  async upsertAndAssignToActivity(
    activityId: string,
    amenityNames: string[],
    source: AmenitySource = 'manual'
  ): Promise<AmenityResponseDto[]> {
    if (amenityNames.length === 0) {
      return []
    }

    // Upsert amenities
    const { amenities: upsertedAmenities } = await this.bulkUpsert({
      names: amenityNames,
      source,
    })

    // Add to activity
    const amenityIds = upsertedAmenities.map(a => a.id)
    return this.addAmenitiesToActivity(activityId, amenityIds)
  }
}
