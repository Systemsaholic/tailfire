/**
 * Amenities Controller
 *
 * REST API endpoints for amenity management and activity-amenity assignments.
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
import { AmenitiesService } from './amenities.service'
import {
  CreateAmenityDto,
  UpdateAmenityDto,
  AmenityFilterDto,
  UpdateActivityAmenitiesDto,
  BulkUpsertAmenitiesDto,
} from './dto'
import type {
  AmenityResponseDto,
  AmenitiesByCategory,
  BulkUpsertAmenitiesResponseDto,
} from '@tailfire/shared-types'

@ApiTags('Amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  /**
   * Get all amenities with optional filtering
   * GET /amenities?search=wifi&category=connectivity
   */
  @Get()
  async findAll(@Query() filters: AmenityFilterDto): Promise<AmenityResponseDto[]> {
    return this.amenitiesService.findAll(filters)
  }

  /**
   * Get all amenities grouped by category
   * GET /amenities/grouped
   */
  @Get('grouped')
  async findAllGrouped(): Promise<AmenitiesByCategory[]> {
    return this.amenitiesService.findAllGroupedByCategory()
  }

  /**
   * Bulk upsert amenities (for external API integration)
   * POST /amenities/bulk-upsert
   */
  @Post('bulk-upsert')
  async bulkUpsert(
    @Body() dto: BulkUpsertAmenitiesDto
  ): Promise<BulkUpsertAmenitiesResponseDto> {
    return this.amenitiesService.bulkUpsert(dto)
  }

  /**
   * Create a new amenity
   * POST /amenities
   */
  @Post()
  async create(@Body() dto: CreateAmenityDto): Promise<AmenityResponseDto> {
    return this.amenitiesService.create(dto)
  }

  /**
   * Get a single amenity by ID
   * GET /amenities/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AmenityResponseDto> {
    return this.amenitiesService.findOne(id)
  }

  /**
   * Update an amenity
   * PATCH /amenities/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAmenityDto
  ): Promise<AmenityResponseDto> {
    return this.amenitiesService.update(id, dto)
  }

  /**
   * Delete an amenity
   * DELETE /amenities/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.amenitiesService.remove(id)
  }
}

/**
 * Activity Amenities Controller
 * Endpoints for managing amenities on activities (lodging, tours, etc.)
 */
@ApiTags('Activity Amenities')
@Controller('activities/:activityId/amenities')
export class ActivityAmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  /**
   * Get all amenities for an activity
   * GET /activities/:activityId/amenities
   */
  @Get()
  async getAmenities(
    @Param('activityId') activityId: string
  ): Promise<AmenityResponseDto[]> {
    return this.amenitiesService.getAmenitiesForActivity(activityId)
  }

  /**
   * Replace all amenities for an activity
   * PUT /activities/:activityId/amenities
   */
  @Put()
  async updateAmenities(
    @Param('activityId') activityId: string,
    @Body() dto: UpdateActivityAmenitiesDto
  ): Promise<AmenityResponseDto[]> {
    return this.amenitiesService.updateActivityAmenities(activityId, dto.amenityIds)
  }

  /**
   * Add amenities to an activity (append)
   * POST /activities/:activityId/amenities
   */
  @Post()
  async addAmenities(
    @Param('activityId') activityId: string,
    @Body() dto: UpdateActivityAmenitiesDto
  ): Promise<AmenityResponseDto[]> {
    return this.amenitiesService.addAmenitiesToActivity(activityId, dto.amenityIds)
  }

  /**
   * Remove specific amenities from an activity
   * DELETE /activities/:activityId/amenities
   */
  @Delete()
  async removeAmenities(
    @Param('activityId') activityId: string,
    @Body() dto: UpdateActivityAmenitiesDto
  ): Promise<AmenityResponseDto[]> {
    return this.amenitiesService.removeAmenitiesFromActivity(activityId, dto.amenityIds)
  }
}
