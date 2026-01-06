/**
 * Itineraries Controller
 *
 * REST API endpoints for trip itinerary management.
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
import { ItinerariesService } from './itineraries.service'
import {
  CreateItineraryDto,
  UpdateItineraryDto,
  ItineraryFilterDto,
} from './dto'
import type { ItineraryResponseDto } from '../../../../packages/shared-types/src/api'

@ApiTags('Itineraries')
@Controller('trips/:tripId/itineraries')
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  /**
   * Create a new itinerary for a trip
   * POST /trips/:tripId/itineraries
   */
  @Post()
  async create(
    @Param('tripId') tripId: string,
    @Body() createItineraryDto: CreateItineraryDto,
  ): Promise<ItineraryResponseDto> {
    return this.itinerariesService.create(tripId, createItineraryDto)
  }

  /**
   * Get all itineraries (optionally filtered)
   * GET /trips/:tripId/itineraries
   */
  @Get()
  async findAll(
    @Param('tripId') tripId: string,
    @Query() filters: ItineraryFilterDto,
  ): Promise<ItineraryResponseDto[]> {
    // Merge tripId from route param with query filters
    return this.itinerariesService.findAll({ ...filters, tripId })
  }

  /**
   * Get a single itinerary by ID
   * GET /trips/:tripId/itineraries/:id
   * Validates the itinerary belongs to the specified trip
   */
  @Get(':id')
  async findOne(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ): Promise<ItineraryResponseDto> {
    return this.itinerariesService.findOne(id, tripId)
  }

  /**
   * Select an itinerary as the active option for a trip
   * PATCH /trips/:tripId/itineraries/:id/select
   * Sets isSelected=true for this itinerary and false for all others in the trip
   * NOTE: Must come before generic :id route to prevent route matching conflicts
   */
  @Patch(':id/select')
  async selectItinerary(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ): Promise<ItineraryResponseDto> {
    return this.itinerariesService.selectItinerary(id, tripId)
  }

  /**
   * Update an itinerary
   * PATCH /trips/:tripId/itineraries/:id
   * Validates the itinerary belongs to the specified trip
   */
  @Patch(':id')
  async update(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() updateItineraryDto: UpdateItineraryDto,
  ): Promise<ItineraryResponseDto> {
    return this.itinerariesService.update(id, updateItineraryDto, tripId)
  }

  /**
   * Delete an itinerary
   * DELETE /trips/:tripId/itineraries/:id
   * Validates the itinerary belongs to the specified trip
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.itinerariesService.remove(id, tripId)
  }
}
