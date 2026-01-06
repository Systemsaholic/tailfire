/**
 * Tags Service
 *
 * Business logic for managing tags and tag assignments.
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { eq, ilike, desc, asc, sql, and, inArray } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type {
  TagResponseDto,
  TagWithUsageDto,
  CreateTagDto,
  UpdateTagDto,
  TagFilterDto,
  CreateAndAssignTagDto,
} from '@tailfire/shared-types'

@Injectable()
export class TagsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get all tags with optional filtering and usage counts
   */
  async findAll(filters: TagFilterDto = {}): Promise<TagWithUsageDto[]> {
    const {
      search,
      category,
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 100,
      offset = 0,
    } = filters

    // Build where conditions
    const conditions = []
    if (search) {
      conditions.push(ilike(this.db.schema.tags.name, `%${search}%`))
    }
    if (category) {
      conditions.push(eq(this.db.schema.tags.category, category))
    }

    // Query tags with usage counts
    const tags = await this.db.client
      .select({
        id: this.db.schema.tags.id,
        name: this.db.schema.tags.name,
        category: this.db.schema.tags.category,
        color: this.db.schema.tags.color,
        createdAt: this.db.schema.tags.createdAt,
        updatedAt: this.db.schema.tags.updatedAt,
        tripCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${this.db.schema.tripTags}
          WHERE ${this.db.schema.tripTags.tagId} = ${this.db.schema.tags.id}
        )`,
        contactCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${this.db.schema.contactTags}
          WHERE ${this.db.schema.contactTags.tagId} = ${this.db.schema.tags.id}
        )`,
      })
      .from(this.db.schema.tags)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sortOrder === 'asc'
          ? asc(this.db.schema.tags[sortBy === 'usageCount' ? 'id' : sortBy])
          : desc(this.db.schema.tags[sortBy === 'usageCount' ? 'id' : sortBy])
      )
      .limit(limit)
      .offset(offset)

    // Format response with usage counts
    return tags.map((tag) => ({
      ...tag,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
      usageCount: tag.tripCount + tag.contactCount,
    }))
  }

  /**
   * Get a single tag by ID
   */
  async findOne(id: string): Promise<TagResponseDto> {
    const [tag] = await this.db.client
      .select()
      .from(this.db.schema.tags)
      .where(eq(this.db.schema.tags.id, id))
      .limit(1)

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`)
    }

    return {
      ...tag,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    }
  }

  /**
   * Create a new tag
   */
  async create(dto: CreateTagDto): Promise<TagResponseDto> {
    // Check if tag name already exists (case-insensitive)
    const existing = await this.db.client
      .select()
      .from(this.db.schema.tags)
      .where(ilike(this.db.schema.tags.name, dto.name))
      .limit(1)

    if (existing.length > 0) {
      throw new ConflictException(`Tag with name "${dto.name}" already exists`)
    }

    const [tag] = await this.db.client
      .insert(this.db.schema.tags)
      .values({
        name: dto.name.trim(),
        category: dto.category?.trim() || null,
        color: dto.color?.trim() || null,
      })
      .returning()

    return {
      ...tag!,
      createdAt: tag!.createdAt.toISOString(),
      updatedAt: tag!.updatedAt.toISOString(),
    }
  }

  /**
   * Update a tag
   */
  async update(id: string, dto: UpdateTagDto): Promise<TagResponseDto> {
    // Check if tag exists
    await this.findOne(id)

    // If updating name, check for conflicts
    if (dto.name) {
      const existing = await this.db.client
        .select()
        .from(this.db.schema.tags)
        .where(
          and(
            ilike(this.db.schema.tags.name, dto.name),
            sql`${this.db.schema.tags.id} != ${id}`
          )
        )
        .limit(1)

      if (existing.length > 0) {
        throw new ConflictException(`Tag with name "${dto.name}" already exists`)
      }
    }

    const [tag] = await this.db.client
      .update(this.db.schema.tags)
      .set({
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.category !== undefined && { category: dto.category?.trim() || null }),
        ...(dto.color !== undefined && { color: dto.color?.trim() || null }),
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.tags.id, id))
      .returning()

    return {
      ...tag!,
      createdAt: tag!.createdAt.toISOString(),
      updatedAt: tag!.updatedAt.toISOString(),
    }
  }

  /**
   * Delete a tag
   * Also removes all associations with trips and contacts
   */
  async remove(id: string): Promise<void> {
    // Check if tag exists
    await this.findOne(id)

    // Delete tag (cascade will handle junction table cleanup)
    await this.db.client
      .delete(this.db.schema.tags)
      .where(eq(this.db.schema.tags.id, id))
  }

  /**
   * Get all tags for a trip
   */
  async getTagsForTrip(tripId: string): Promise<TagResponseDto[]> {
    const tags = await this.db.client
      .select({
        id: this.db.schema.tags.id,
        name: this.db.schema.tags.name,
        category: this.db.schema.tags.category,
        color: this.db.schema.tags.color,
        createdAt: this.db.schema.tags.createdAt,
        updatedAt: this.db.schema.tags.updatedAt,
      })
      .from(this.db.schema.tags)
      .innerJoin(
        this.db.schema.tripTags,
        eq(this.db.schema.tags.id, this.db.schema.tripTags.tagId)
      )
      .where(eq(this.db.schema.tripTags.tripId, tripId))
      .orderBy(asc(this.db.schema.tags.name))

    return tags.map((tag) => ({
      ...tag,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    }))
  }

  /**
   * Get all tags for a contact
   */
  async getTagsForContact(contactId: string): Promise<TagResponseDto[]> {
    const tags = await this.db.client
      .select({
        id: this.db.schema.tags.id,
        name: this.db.schema.tags.name,
        category: this.db.schema.tags.category,
        color: this.db.schema.tags.color,
        createdAt: this.db.schema.tags.createdAt,
        updatedAt: this.db.schema.tags.updatedAt,
      })
      .from(this.db.schema.tags)
      .innerJoin(
        this.db.schema.contactTags,
        eq(this.db.schema.tags.id, this.db.schema.contactTags.tagId)
      )
      .where(eq(this.db.schema.contactTags.contactId, contactId))
      .orderBy(asc(this.db.schema.tags.name))

    return tags.map((tag) => ({
      ...tag,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    }))
  }

  /**
   * Update tags for a trip (replaces all existing tags)
   */
  async updateTripTags(tripId: string, tagIds: string[]): Promise<TagResponseDto[]> {
    // Verify all tag IDs exist
    if (tagIds.length > 0) {
      const tags = await this.db.client
        .select({ id: this.db.schema.tags.id })
        .from(this.db.schema.tags)
        .where(inArray(this.db.schema.tags.id, tagIds))

      if (tags.length !== tagIds.length) {
        throw new BadRequestException('One or more tag IDs are invalid')
      }
    }

    // Delete existing associations
    await this.db.client
      .delete(this.db.schema.tripTags)
      .where(eq(this.db.schema.tripTags.tripId, tripId))

    // Create new associations
    if (tagIds.length > 0) {
      await this.db.client
        .insert(this.db.schema.tripTags)
        .values(
          tagIds.map((tagId) => ({
            tripId,
            tagId,
          }))
        )
    }

    // Return updated tags
    return this.getTagsForTrip(tripId)
  }

  /**
   * Update tags for a contact (replaces all existing tags)
   */
  async updateContactTags(contactId: string, tagIds: string[]): Promise<TagResponseDto[]> {
    // Verify all tag IDs exist
    if (tagIds.length > 0) {
      const tags = await this.db.client
        .select({ id: this.db.schema.tags.id })
        .from(this.db.schema.tags)
        .where(inArray(this.db.schema.tags.id, tagIds))

      if (tags.length !== tagIds.length) {
        throw new BadRequestException('One or more tag IDs are invalid')
      }
    }

    // Delete existing associations
    await this.db.client
      .delete(this.db.schema.contactTags)
      .where(eq(this.db.schema.contactTags.contactId, contactId))

    // Create new associations
    if (tagIds.length > 0) {
      await this.db.client
        .insert(this.db.schema.contactTags)
        .values(
          tagIds.map((tagId) => ({
            contactId,
            tagId,
          }))
        )
    }

    // Return updated tags
    return this.getTagsForContact(contactId)
  }

  /**
   * Create a new tag and assign it to a trip in one atomic operation
   */
  async createAndAssignToTrip(
    tripId: string,
    dto: CreateAndAssignTagDto
  ): Promise<TagResponseDto> {
    // Create the tag
    const tag = await this.create(dto)

    // Assign to trip
    await this.db.client
      .insert(this.db.schema.tripTags)
      .values({
        tripId,
        tagId: tag.id,
      })

    return tag
  }

  /**
   * Create a new tag and assign it to a contact in one atomic operation
   */
  async createAndAssignToContact(
    contactId: string,
    dto: CreateAndAssignTagDto
  ): Promise<TagResponseDto> {
    // Create the tag
    const tag = await this.create(dto)

    // Assign to contact
    await this.db.client
      .insert(this.db.schema.contactTags)
      .values({
        contactId,
        tagId: tag.id,
      })

    return tag
  }
}
