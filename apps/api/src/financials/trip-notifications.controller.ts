/**
 * Trip Notifications Controller
 *
 * REST API endpoints for financial trip notifications.
 *
 * Endpoints:
 * - GET /trips/:tripId/notifications - Get notifications for a trip
 * - GET /notifications/:id - Get a single notification
 * - POST /notifications/:id/dismiss - Dismiss a notification
 */

import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TripNotificationsService } from './trip-notifications.service'
import type {
  TripNotificationResponseDto,
  TripNotificationsFilterDto,
  PaginatedNotificationsResponseDto,
  DismissNotificationDto,
} from '@tailfire/shared-types'

@ApiTags('Trip Notifications')
@Controller()
export class TripNotificationsController {
  constructor(private readonly notificationsService: TripNotificationsService) {}

  /**
   * Get notifications for a trip with optional filtering
   * GET /trips/:tripId/notifications
   */
  @Get('trips/:tripId/notifications')
  async getNotifications(
    @Param('tripId') tripId: string,
    @Query() filters: TripNotificationsFilterDto
  ): Promise<PaginatedNotificationsResponseDto> {
    return this.notificationsService.getNotifications(tripId, filters)
  }

  /**
   * Get a single notification by ID
   * GET /notifications/:id
   */
  @Get('notifications/:id')
  async getNotification(@Param('id') id: string): Promise<TripNotificationResponseDto> {
    return this.notificationsService.getNotification(id)
  }

  /**
   * Dismiss a notification
   * POST /notifications/:id/dismiss
   */
  @Post('notifications/:id/dismiss')
  async dismissNotification(
    @Param('id') id: string,
    @Body() dto: DismissNotificationDto
  ): Promise<TripNotificationResponseDto> {
    return this.notificationsService.dismissNotification(id, dto)
  }
}
