/**
 * Traveler Groups Service
 *
 * Business logic for managing traveler groups (rooms, dining, activities, etc.).
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { eq, and } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type {
  CreateTravelerGroupDto,
  UpdateTravelerGroupDto,
  TravelerGroupFilterDto,
  AddTravelerToGroupDto,
  UpdateTravelerGroupMemberDto,
  TravelerGroupResponseDto,
  TravelerGroupWithMembersResponseDto,
  TravelerGroupMemberResponseDto,
} from '../../../../packages/shared-types/src/api'

@Injectable()
export class TravelerGroupsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Create a new traveler group
   */
  async create(
    tripId: string,
    dto: CreateTravelerGroupDto,
  ): Promise<TravelerGroupResponseDto> {
    // Validate trip exists
    const [trip] = await this.db.client
      .select()
      .from(this.db.schema.trips)
      .where(eq(this.db.schema.trips.id, tripId))
      .limit(1)

    if (!trip) {
      throw new NotFoundException('Trip not found')
    }

    const [group] = await this.db.client
      .insert(this.db.schema.travelerGroups)
      .values({
        tripId,
        name: dto.name,
        groupType: dto.groupType,
        description: dto.description,
        sequenceOrder: dto.sequenceOrder,
      })
      .returning()

    return this.mapToResponseDto(group)
  }

  /**
   * Find all traveler groups with optional filters
   */
  async findAll(
    filters: TravelerGroupFilterDto,
  ): Promise<TravelerGroupResponseDto[]> {
    const conditions = []

    // If tripId filter is provided, validate it exists
    if (filters.tripId) {
      const [trip] = await this.db.client
        .select()
        .from(this.db.schema.trips)
        .where(eq(this.db.schema.trips.id, filters.tripId))
        .limit(1)

      if (!trip) {
        throw new NotFoundException('Trip not found')
      }

      conditions.push(eq(this.db.schema.travelerGroups.tripId, filters.tripId))
    }

    if (filters.groupType) {
      conditions.push(eq(this.db.schema.travelerGroups.groupType, filters.groupType))
    }

    const groups = await this.db.client
      .select()
      .from(this.db.schema.travelerGroups)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    return groups.map((group) => this.mapToResponseDto(group))
  }

  /**
   * Find one traveler group by ID
   * Optionally validates the group belongs to a specific trip
   */
  async findOne(
    id: string,
    tripId?: string,
  ): Promise<TravelerGroupResponseDto> {
    // First get the group
    const [group] = await this.db.client
      .select()
      .from(this.db.schema.travelerGroups)
      .where(eq(this.db.schema.travelerGroups.id, id))
      .limit(1)

    if (!group) {
      throw new NotFoundException(`Traveler group with ID ${id} not found`)
    }

    // Validate trip exists
    const [trip] = await this.db.client
      .select()
      .from(this.db.schema.trips)
      .where(eq(this.db.schema.trips.id, group.tripId))
      .limit(1)

    if (!trip) {
      throw new NotFoundException(`Traveler group with ID ${id} not found`)
    }

    // If tripId is provided, validate the group belongs to that specific trip
    if (tripId && group.tripId !== tripId) {
      throw new NotFoundException(
        `Traveler group with ID ${id} does not belong to trip ${tripId}`,
      )
    }

    return this.mapToResponseDto(group)
  }

  /**
   * Find one traveler group with its members
   * Optionally validates the group belongs to a specific trip
   */
  async findOneWithMembers(
    id: string,
    tripId?: string,
  ): Promise<TravelerGroupWithMembersResponseDto> {
    const group = await this.findOne(id, tripId)

    // Get all members
    const members = await this.db.client
      .select()
      .from(this.db.schema.travelerGroupMembers)
      .where(eq(this.db.schema.travelerGroupMembers.travelerGroupId, id))

    return {
      ...group,
      members: members.map((m) => this.mapMemberToResponseDto(m)),
    }
  }

  /**
   * Update a traveler group
   * Optionally validates the group belongs to a specific trip
   */
  async update(
    id: string,
    dto: UpdateTravelerGroupDto,
    tripId?: string,
  ): Promise<TravelerGroupResponseDto> {
    // Validate group exists (and belongs to specific trip if provided)
    await this.findOne(id, tripId)

    const [group] = await this.db.client
      .update(this.db.schema.travelerGroups)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.travelerGroups.id, id))
      .returning()

    if (!group) {
      throw new NotFoundException(`Traveler group with ID ${id} not found`)
    }

    return this.mapToResponseDto(group)
  }

  /**
   * Delete a traveler group
   * Optionally validates the group belongs to a specific trip
   */
  async remove(id: string, tripId?: string): Promise<void> {
    // Validate group exists (and belongs to specific trip if provided)
    await this.findOne(id, tripId)

    const [group] = await this.db.client
      .delete(this.db.schema.travelerGroups)
      .where(eq(this.db.schema.travelerGroups.id, id))
      .returning()

    if (!group) {
      throw new NotFoundException(`Traveler group with ID ${id} not found`)
    }
  }

  /**
   * Add a traveler to a group
   */
  async addMember(
    groupId: string,
    dto: AddTravelerToGroupDto,
  ): Promise<TravelerGroupMemberResponseDto> {
    // Validate group exists
    const group = await this.findOne(groupId)

    // Validate tripTravelerId exists and belongs to the same trip
    const [traveler] = await this.db.client
      .select()
      .from(this.db.schema.tripTravelers)
      .where(eq(this.db.schema.tripTravelers.id, dto.tripTravelerId))
      .limit(1)

    if (!traveler) {
      throw new NotFoundException('Trip traveler not found')
    }

    if (traveler.tripId !== group.tripId) {
      throw new BadRequestException('Traveler does not belong to the same trip as the group')
    }

    // Check if traveler is already in this group
    const existing = await this.db.client
      .select()
      .from(this.db.schema.travelerGroupMembers)
      .where(
        and(
          eq(this.db.schema.travelerGroupMembers.travelerGroupId, groupId),
          eq(this.db.schema.travelerGroupMembers.tripTravelerId, dto.tripTravelerId),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new BadRequestException('Traveler is already in this group')
    }

    const [member] = await this.db.client
      .insert(this.db.schema.travelerGroupMembers)
      .values({
        travelerGroupId: groupId,
        tripTravelerId: dto.tripTravelerId,
        role: dto.role,
        notes: dto.notes,
      })
      .returning()

    return this.mapMemberToResponseDto(member)
  }

  /**
   * Update a group member
   */
  async updateMember(
    memberId: string,
    dto: UpdateTravelerGroupMemberDto,
  ): Promise<TravelerGroupMemberResponseDto> {
    // Get the member
    const [member] = await this.db.client
      .select()
      .from(this.db.schema.travelerGroupMembers)
      .where(eq(this.db.schema.travelerGroupMembers.id, memberId))
      .limit(1)

    if (!member) {
      throw new NotFoundException(`Group member with ID ${memberId} not found`)
    }

    // Validate group exists
    await this.findOne(member.travelerGroupId)

    const [updatedMember] = await this.db.client
      .update(this.db.schema.travelerGroupMembers)
      .set(dto)
      .where(eq(this.db.schema.travelerGroupMembers.id, memberId))
      .returning()

    if (!updatedMember) {
      throw new NotFoundException(`Group member with ID ${memberId} not found`)
    }

    return this.mapMemberToResponseDto(updatedMember)
  }

  /**
   * Remove a traveler from a group
   */
  async removeMember(memberId: string): Promise<void> {
    // Get the member
    const [member] = await this.db.client
      .select()
      .from(this.db.schema.travelerGroupMembers)
      .where(eq(this.db.schema.travelerGroupMembers.id, memberId))
      .limit(1)

    if (!member) {
      throw new NotFoundException(`Group member with ID ${memberId} not found`)
    }

    // Validate group exists
    await this.findOne(member.travelerGroupId)

    const [deleted] = await this.db.client
      .delete(this.db.schema.travelerGroupMembers)
      .where(eq(this.db.schema.travelerGroupMembers.id, memberId))
      .returning()

    if (!deleted) {
      throw new NotFoundException(`Group member with ID ${memberId} not found`)
    }
  }

  /**
   * Map database entity to response DTO
   */
  private mapToResponseDto(group: any): TravelerGroupResponseDto {
    return {
      id: group.id,
      tripId: group.tripId,
      name: group.name,
      groupType: group.groupType,
      description: group.description,
      sequenceOrder: group.sequenceOrder,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    }
  }

  /**
   * Map member entity to response DTO
   */
  private mapMemberToResponseDto(member: any): TravelerGroupMemberResponseDto {
    return {
      id: member.id,
      travelerGroupId: member.travelerGroupId,
      tripTravelerId: member.tripTravelerId,
      role: member.role,
      notes: member.notes,
      addedAt: member.addedAt.toISOString(),
    }
  }
}
