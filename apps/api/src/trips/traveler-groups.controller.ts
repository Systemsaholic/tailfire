/**
 * Traveler Groups Controller
 *
 * REST API endpoints for traveler group management.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TravelerGroupsService } from './traveler-groups.service'
import {
  CreateTravelerGroupDto,
  UpdateTravelerGroupDto,
  TravelerGroupFilterDto,
  AddTravelerToGroupDto,
  UpdateTravelerGroupMemberDto,
} from './dto'
import type {
  TravelerGroupResponseDto,
  TravelerGroupWithMembersResponseDto,
  TravelerGroupMemberResponseDto,
} from '../../../../packages/shared-types/src/api'

@ApiTags('Traveler Groups')
@Controller('trips/:tripId/traveler-groups')
export class TravelerGroupsController {
  constructor(private readonly travelerGroupsService: TravelerGroupsService) {}

  /**
   * Create a new traveler group
   * POST /trips/:tripId/traveler-groups
   */
  @Post()
  async create(
    @Param('tripId') tripId: string,
    @Body() createTravelerGroupDto: CreateTravelerGroupDto,
  ): Promise<TravelerGroupResponseDto> {
    return this.travelerGroupsService.create(tripId, createTravelerGroupDto)
  }

  /**
   * Get all traveler groups (optionally filtered)
   * GET /trips/:tripId/traveler-groups
   */
  @Get()
  async findAll(
    @Param('tripId') tripId: string,
    @Query() filters: TravelerGroupFilterDto,
  ): Promise<TravelerGroupResponseDto[]> {
    // Merge tripId from route param with query filters
    return this.travelerGroupsService.findAll({ ...filters, tripId })
  }

  /**
   * Get a single traveler group by ID
   * GET /trips/:tripId/traveler-groups/:id
   * Validates the group belongs to the specified trip
   */
  @Get(':id')
  async findOne(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ): Promise<TravelerGroupResponseDto> {
    return this.travelerGroupsService.findOne(id, tripId)
  }

  /**
   * Get a traveler group with all its members
   * GET /trips/:tripId/traveler-groups/:id/members
   * Validates the group belongs to the specified trip
   */
  @Get(':id/members')
  async findOneWithMembers(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ): Promise<TravelerGroupWithMembersResponseDto> {
    return this.travelerGroupsService.findOneWithMembers(id, tripId)
  }

  /**
   * Update a traveler group
   * PATCH /trips/:tripId/traveler-groups/:id
   * Validates the group belongs to the specified trip
   */
  @Patch(':id')
  async update(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() updateTravelerGroupDto: UpdateTravelerGroupDto,
  ): Promise<TravelerGroupResponseDto> {
    return this.travelerGroupsService.update(id, updateTravelerGroupDto, tripId)
  }

  /**
   * Delete a traveler group
   * DELETE /trips/:tripId/traveler-groups/:id
   * Validates the group belongs to the specified trip
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.travelerGroupsService.remove(id, tripId)
  }

  /**
   * Add a traveler to a group
   * POST /trips/:tripId/traveler-groups/:groupId/members
   */
  @Post(':groupId/members')
  async addMember(
    @Param('groupId') groupId: string,
    @Body() addTravelerToGroupDto: AddTravelerToGroupDto,
  ): Promise<TravelerGroupMemberResponseDto> {
    return this.travelerGroupsService.addMember(groupId, addTravelerToGroupDto)
  }

  /**
   * Update a group member
   * PATCH /trips/:tripId/traveler-groups/:groupId/members/:memberId
   */
  @Patch(':groupId/members/:memberId')
  async updateMember(
    @Param('memberId') memberId: string,
    @Body() updateTravelerGroupMemberDto: UpdateTravelerGroupMemberDto,
  ): Promise<TravelerGroupMemberResponseDto> {
    return this.travelerGroupsService.updateMember(memberId, updateTravelerGroupMemberDto)
  }

  /**
   * Remove a traveler from a group
   * DELETE /trips/:tripId/traveler-groups/:groupId/members/:memberId
   */
  @Delete(':groupId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Param('memberId') memberId: string): Promise<void> {
    return this.travelerGroupsService.removeMember(memberId)
  }
}
