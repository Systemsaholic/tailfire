/**
 * Contact Relationships Controller
 *
 * REST API endpoints for managing relationships between contacts.
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
import { ContactRelationshipsService } from './contact-relationships.service'
import {
  CreateContactRelationshipDto,
  UpdateContactRelationshipDto,
  ContactRelationshipFilterDto,
} from './dto'
import type {
  ContactRelationshipResponseDto,
} from '../../../../packages/shared-types/src/api'

@ApiTags('Contact Relationships')
@Controller('contacts/:contactId/relationships')
export class ContactRelationshipsController {
  constructor(private readonly relationshipsService: ContactRelationshipsService) {}

  /**
   * Create a new relationship for a contact
   * POST /contacts/:contactId/relationships
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('contactId') contactId: string,
    @Body() dto: CreateContactRelationshipDto,
  ): Promise<ContactRelationshipResponseDto> {
    return this.relationshipsService.create(contactId, dto)
  }

  /**
   * Get all relationships with optional filters
   * GET /contacts/:contactId/relationships?category=family
   */
  @Get()
  async findAll(
    @Param('contactId') contactId: string,
    @Query() filters: ContactRelationshipFilterDto,
  ): Promise<ContactRelationshipResponseDto[]> {
    // Add contactId to filters
    return this.relationshipsService.findAll({ ...filters, contactId })
  }

  /**
   * Update a relationship
   * PUT /contacts/:contactId/relationships/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactRelationshipDto,
  ): Promise<ContactRelationshipResponseDto> {
    return this.relationshipsService.update(id, dto)
  }

  /**
   * Delete a relationship
   * DELETE /contacts/:contactId/relationships/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.relationshipsService.remove(id)
  }
}
