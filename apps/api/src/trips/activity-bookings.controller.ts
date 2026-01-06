/**
 * Activity Bookings Controller
 *
 * REST API endpoints for managing activity booking status.
 *
 * Key Distinction:
 * - Activity = Core entity (tour, flight, dining, transportation, custom-cruise, package, etc.)
 * - Package = An activity type that holds sub-activities
 * - Booking = A status applied to an activity (isBooked flag + bookingDate)
 *
 * Routes:
 * - POST /bookings/activities/:activityId/mark - Mark activity as booked
 * - POST /bookings/activities/:activityId/unmark - Remove booking status
 * - GET /bookings/activities?tripId=...&isBooked=... - List activities with booking status
 *
 * @see AUTH_INTEGRATION.md for authentication implementation requirements
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ActivityBookingsService } from './activity-bookings.service'
import { MarkActivityBookedDto, ActivityBookingsFilterDto } from './dto'
import type {
  ActivityBookingResponseDto,
  ActivityBookingsListResponseDto,
} from '@tailfire/shared-types'

@ApiTags('Activity Bookings')
@Controller('bookings/activities')
export class ActivityBookingsController {
  constructor(private readonly activityBookingsService: ActivityBookingsService) {}

  /**
   * Mark an activity as booked
   * POST /bookings/activities/:activityId/mark
   *
   * Business rules:
   * - Activities with packageId cannot be booked individually (400 error)
   * - Activities with activityType 'package' CAN be booked
   * - bookingDate defaults to today if not provided
   */
  @Post(':activityId/mark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an activity as booked' })
  @ApiParam({ name: 'activityId', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity marked as booked' })
  @ApiResponse({ status: 400, description: 'Activity is part of a package' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async markAsBooked(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body() dto: MarkActivityBookedDto
  ): Promise<ActivityBookingResponseDto> {
    // TODO: Extract actorId from auth context when implemented
    return this.activityBookingsService.markAsBooked(activityId, dto, null)
  }

  /**
   * Remove booking status from an activity
   * POST /bookings/activities/:activityId/unmark
   *
   * Business rules:
   * - Activities with packageId cannot be unmarked individually (400 error)
   * - Sets isBooked to false and bookingDate to null
   */
  @Post(':activityId/unmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove booking status from an activity' })
  @ApiParam({ name: 'activityId', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Booking status removed' })
  @ApiResponse({ status: 400, description: 'Activity is part of a package' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async unmarkAsBooked(
    @Param('activityId', ParseUUIDPipe) activityId: string
  ): Promise<ActivityBookingResponseDto> {
    // TODO: Extract actorId from auth context when implemented
    return this.activityBookingsService.unmarkAsBooked(activityId, null)
  }

  /**
   * List activities with booking status
   * GET /bookings/activities?tripId=...&itineraryId=...&isBooked=...
   *
   * Query parameters:
   * - tripId (required): Filter by trip
   * - itineraryId (optional): Filter by specific itinerary
   * - isBooked (optional, default: true): Filter by booking status
   *
   * Response includes:
   * - paymentScheduleMissing: Warning flag for missing payment schedule
   * - bookable: false if activity is part of a package
   * - blockedReason: 'part_of_package' if bookable is false
   */
  @Get()
  @ApiOperation({ summary: 'List activities with booking information' })
  @ApiQuery({ name: 'tripId', required: true, description: 'Trip ID (required for scoping)' })
  @ApiQuery({ name: 'itineraryId', required: false, description: 'Filter by itinerary' })
  @ApiQuery({ name: 'isBooked', required: false, description: 'Filter by booking status (default: true)' })
  @ApiResponse({ status: 200, description: 'List of activities with booking information' })
  @ApiResponse({ status: 400, description: 'tripId is required' })
  async listBooked(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filter: ActivityBookingsFilterDto
  ): Promise<ActivityBookingsListResponseDto> {
    return this.activityBookingsService.listBooked(filter)
  }
}
