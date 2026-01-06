/**
 * Tags Controller
 *
 * REST API endpoints for tag management and entity tag assignments.
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
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TagsService } from './tags.service'
import {
  CreateTagDto,
  UpdateTagDto,
  TagFilterDto,
  UpdateEntityTagsDto,
  CreateAndAssignTagDto,
} from './dto'
import type {
  TagResponseDto,
  TagWithUsageDto,
} from '@tailfire/shared-types'

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Get all tags with optional filtering and usage counts
   * GET /tags?search=vacation&category=trip-type&sortBy=name&sortOrder=asc
   */
  @Get()
  async findAll(@Query() filters: TagFilterDto): Promise<TagWithUsageDto[]> {
    return this.tagsService.findAll(filters)
  }

  /**
   * Create a new tag
   * POST /tags
   */
  @Post()
  async create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    return this.tagsService.create(createTagDto)
  }

  /**
   * Get a single tag by ID
   * GET /tags/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TagResponseDto> {
    return this.tagsService.findOne(id)
  }

  /**
   * Update a tag
   * PATCH /tags/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.tagsService.update(id, updateTagDto)
  }

  /**
   * Delete a tag
   * DELETE /tags/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tagsService.remove(id)
  }
}

/**
 * Trip Tags Controller
 * Endpoints for managing tags on trips
 */
@ApiTags('Trip Tags')
@Controller('trips/:tripId/tags')
export class TripTagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Get all tags for a trip
   * GET /trips/:tripId/tags
   */
  @Get()
  async getTags(@Param('tripId') tripId: string): Promise<TagResponseDto[]> {
    return this.tagsService.getTagsForTrip(tripId)
  }

  /**
   * Replace all tags for a trip
   * PUT /trips/:tripId/tags
   */
  @Put()
  async updateTags(
    @Param('tripId') tripId: string,
    @Body() dto: UpdateEntityTagsDto,
  ): Promise<TagResponseDto[]> {
    return this.tagsService.updateTripTags(tripId, dto.tagIds)
  }

  /**
   * Create a new tag and assign it to this trip
   * POST /trips/:tripId/tags
   */
  @Post()
  async createAndAssignTag(
    @Param('tripId') tripId: string,
    @Body() dto: CreateAndAssignTagDto,
  ): Promise<TagResponseDto> {
    return this.tagsService.createAndAssignToTrip(tripId, dto)
  }
}

/**
 * Contact Tags Controller
 * Endpoints for managing tags on contacts
 */
@ApiTags('Contact Tags')
@Controller('contacts/:contactId/tags')
export class ContactTagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Get all tags for a contact
   * GET /contacts/:contactId/tags
   */
  @Get()
  async getTags(@Param('contactId') contactId: string): Promise<TagResponseDto[]> {
    return this.tagsService.getTagsForContact(contactId)
  }

  /**
   * Replace all tags for a contact
   * PUT /contacts/:contactId/tags
   */
  @Put()
  async updateTags(
    @Param('contactId') contactId: string,
    @Body() dto: UpdateEntityTagsDto,
  ): Promise<TagResponseDto[]> {
    return this.tagsService.updateContactTags(contactId, dto.tagIds)
  }

  /**
   * Create a new tag and assign it to this contact
   * POST /contacts/:contactId/tags
   */
  @Post()
  async createAndAssignTag(
    @Param('contactId') contactId: string,
    @Body() dto: CreateAndAssignTagDto,
  ): Promise<TagResponseDto> {
    return this.tagsService.createAndAssignToContact(contactId, dto)
  }
}
