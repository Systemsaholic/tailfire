/**
 * Contact Groups Controller
 *
 * REST API endpoints for managing contact groups.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ContactGroupsService } from './contact-groups.service'
import {
  CreateContactGroupDto,
  UpdateContactGroupDto,
  ContactGroupFilterDto,
  AddContactToGroupDto,
  UpdateContactGroupMemberDto,
} from './dto'
import type {
  ContactGroupResponseDto,
  ContactGroupWithMembersResponseDto,
  PaginatedContactGroupsResponseDto,
} from '../../../../packages/shared-types/src/api'
import { GetAuthContext } from '../auth/decorators/auth-context.decorator'
import type { AuthContext } from '../auth/auth.types'

@ApiTags('Contact Groups')
@Controller('contact-groups')
export class ContactGroupsController {
  constructor(private readonly groupsService: ContactGroupsService) {}

  /**
   * Create a new contact group
   * POST /contact-groups
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetAuthContext() auth: AuthContext,
    @Body() dto: CreateContactGroupDto,
  ): Promise<ContactGroupResponseDto> {
    return this.groupsService.create(dto, auth.agencyId)
  }

  /**
   * Get all contact groups with filtering and pagination
   * GET /contact-groups?page=1&limit=20&groupType=family
   */
  @Get()
  async findAll(
    @GetAuthContext() auth: AuthContext,
    @Query() filters: ContactGroupFilterDto,
  ): Promise<PaginatedContactGroupsResponseDto> {
    return this.groupsService.findAll(filters, auth.agencyId)
  }

  /**
   * Get a single contact group by ID
   * GET /contact-groups/:id
   */
  @Get(':id')
  async findOne(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<ContactGroupResponseDto> {
    return this.groupsService.findOne(id, auth.agencyId)
  }

  /**
   * Get a contact group with all members
   * GET /contact-groups/:id/members
   */
  @Get(':id/members')
  async findOneWithMembers(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<ContactGroupWithMembersResponseDto> {
    return this.groupsService.findOneWithMembers(id, auth.agencyId)
  }

  /**
   * Update a contact group
   * PUT /contact-groups/:id
   */
  @Put(':id')
  async update(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateContactGroupDto,
  ): Promise<ContactGroupResponseDto> {
    return this.groupsService.update(id, dto, auth.agencyId)
  }

  /**
   * Delete a contact group
   * DELETE /contact-groups/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.groupsService.remove(id, auth.agencyId)
  }

  /**
   * Add a contact to a group
   * POST /contact-groups/:id/members
   */
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @GetAuthContext() auth: AuthContext,
    @Param('id') groupId: string,
    @Body() dto: AddContactToGroupDto,
  ): Promise<void> {
    return this.groupsService.addMember(groupId, dto, auth.agencyId)
  }

  /**
   * Update a group member (role, notes)
   * PUT /contact-groups/:id/members/:memberId
   */
  @Put(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateMember(
    @GetAuthContext() auth: AuthContext,
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateContactGroupMemberDto,
  ): Promise<void> {
    return this.groupsService.updateMember(groupId, memberId, dto, auth.agencyId)
  }

  /**
   * Remove a contact from a group
   * DELETE /contact-groups/:id/members/:memberId
   */
  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @GetAuthContext() auth: AuthContext,
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    return this.groupsService.removeMember(groupId, memberId, auth.agencyId)
  }
}
