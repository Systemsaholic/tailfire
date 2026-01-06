/**
 * Trip Notifications Service
 *
 * Manages financial notifications for trips:
 * - Split recalculation needed (when travellers change)
 * - Payment received/overdue
 * - Refund processed
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type {
  TripNotificationResponseDto,
  TripNotificationsFilterDto,
  PaginatedNotificationsResponseDto,
  DismissNotificationDto,
  TripNotificationMetadata,
  NotificationType,
  NotificationStatus,
} from '@tailfire/shared-types'

@Injectable()
export class TripNotificationsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get notifications for a trip with filtering and pagination
   */
  async getNotifications(
    tripId: string,
    filters: TripNotificationsFilterDto = {}
  ): Promise<PaginatedNotificationsResponseDto> {
    const { status, notificationType, page = 1, limit = 20 } = filters

    // Build where conditions
    const conditions = [eq(this.db.schema.tripNotifications.tripId, tripId)]

    if (status) {
      if (Array.isArray(status)) {
        conditions.push(inArray(this.db.schema.tripNotifications.status, status))
      } else {
        conditions.push(eq(this.db.schema.tripNotifications.status, status))
      }
    }

    if (notificationType) {
      if (Array.isArray(notificationType)) {
        conditions.push(inArray(this.db.schema.tripNotifications.notificationType, notificationType))
      } else {
        conditions.push(eq(this.db.schema.tripNotifications.notificationType, notificationType))
      }
    }

    // Get total count
    const countResult = await this.db.client
      .select({ count: this.db.schema.tripNotifications.id })
      .from(this.db.schema.tripNotifications)
      .where(and(...conditions))

    const total = countResult.length

    // Get paginated results
    const offset = (page - 1) * limit
    const notifications = await this.db.client
      .select()
      .from(this.db.schema.tripNotifications)
      .where(and(...conditions))
      .orderBy(desc(this.db.schema.tripNotifications.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data: notifications.map((n) => this.formatNotification(n)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get a single notification by ID
   */
  async getNotification(notificationId: string): Promise<TripNotificationResponseDto> {
    const [notification] = await this.db.client
      .select()
      .from(this.db.schema.tripNotifications)
      .where(eq(this.db.schema.tripNotifications.id, notificationId))
      .limit(1)

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`)
    }

    return this.formatNotification(notification)
  }

  /**
   * Dismiss a notification
   */
  async dismissNotification(
    notificationId: string,
    dto: DismissNotificationDto = {}
  ): Promise<TripNotificationResponseDto> {
    // Check if notification exists
    await this.getNotification(notificationId)

    const newStatus: NotificationStatus = dto.acted ? 'acted' : 'dismissed'
    const timestampField = dto.acted ? 'actedAt' : 'dismissedAt'

    const [updated] = await this.db.client
      .update(this.db.schema.tripNotifications)
      .set({
        status: newStatus,
        [timestampField]: new Date(),
      })
      .where(eq(this.db.schema.tripNotifications.id, notificationId))
      .returning()

    return this.formatNotification(updated!)
  }

  /**
   * Create a split recalculation notification
   * Called when a traveller is removed from a trip
   */
  async createSplitRecalculationNotification(
    tripId: string,
    travellerId: string,
    travellerName: string,
    affectedActivityIds: string[],
    affectedActivityNames: string[]
  ): Promise<TripNotificationResponseDto> {
    const message =
      affectedActivityIds.length === 1
        ? `${travellerName} was removed from the trip. Activity "${affectedActivityNames[0]}" needs split recalculation.`
        : `${travellerName} was removed from the trip. ${affectedActivityIds.length} activities need split recalculation.`

    const metadata: TripNotificationMetadata = {
      travellerId,
      travellerName,
      affectedActivityIds,
      affectedActivityNames,
    }

    const [notification] = await this.db.client
      .insert(this.db.schema.tripNotifications)
      .values({
        tripId,
        notificationType: 'split_recalculation_needed',
        status: 'pending',
        message,
        metadata,
      })
      .returning()

    return this.formatNotification(notification!)
  }

  /**
   * Create a payment received notification
   */
  async createPaymentReceivedNotification(
    tripId: string,
    serviceFeeId: string,
    amountCents: number,
    currency: string
  ): Promise<TripNotificationResponseDto> {
    const amountFormatted = (amountCents / 100).toFixed(2)
    const message = `Payment of ${currency} $${amountFormatted} received`

    const metadata: TripNotificationMetadata = {
      serviceFeeId,
      amount: amountCents,
      currency,
    }

    const [notification] = await this.db.client
      .insert(this.db.schema.tripNotifications)
      .values({
        tripId,
        notificationType: 'payment_received',
        status: 'pending',
        message,
        metadata,
      })
      .returning()

    return this.formatNotification(notification!)
  }

  /**
   * Create a payment overdue notification
   */
  async createPaymentOverdueNotification(
    tripId: string,
    serviceFeeId: string,
    amountCents: number,
    currency: string,
    daysPastDue: number
  ): Promise<TripNotificationResponseDto> {
    const amountFormatted = (amountCents / 100).toFixed(2)
    const message = `Payment of ${currency} $${amountFormatted} is ${daysPastDue} days overdue`

    const metadata: TripNotificationMetadata = {
      serviceFeeId,
      amount: amountCents,
      currency,
    }

    const [notification] = await this.db.client
      .insert(this.db.schema.tripNotifications)
      .values({
        tripId,
        notificationType: 'payment_overdue',
        status: 'pending',
        message,
        metadata,
      })
      .returning()

    return this.formatNotification(notification!)
  }

  /**
   * Create a refund processed notification
   */
  async createRefundProcessedNotification(
    tripId: string,
    serviceFeeId: string,
    amountCents: number,
    currency: string
  ): Promise<TripNotificationResponseDto> {
    const amountFormatted = (amountCents / 100).toFixed(2)
    const message = `Refund of ${currency} $${amountFormatted} processed`

    const metadata: TripNotificationMetadata = {
      serviceFeeId,
      amount: amountCents,
      currency,
    }

    const [notification] = await this.db.client
      .insert(this.db.schema.tripNotifications)
      .values({
        tripId,
        notificationType: 'refund_processed',
        status: 'pending',
        message,
        metadata,
      })
      .returning()

    return this.formatNotification(notification!)
  }

  /**
   * Delete all notifications for a trip
   */
  async deleteAllForTrip(tripId: string): Promise<void> {
    await this.db.client
      .delete(this.db.schema.tripNotifications)
      .where(eq(this.db.schema.tripNotifications.tripId, tripId))
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private formatNotification(notification: {
    id: string
    tripId: string
    notificationType: NotificationType
    status: NotificationStatus
    message: string
    metadata: unknown
    createdAt: Date
    dismissedAt: Date | null
    actedAt: Date | null
  }): TripNotificationResponseDto {
    return {
      id: notification.id,
      tripId: notification.tripId,
      notificationType: notification.notificationType,
      status: notification.status,
      message: notification.message,
      metadata: (notification.metadata as TripNotificationMetadata) ?? null,
      createdAt: notification.createdAt.toISOString(),
      dismissedAt: notification.dismissedAt?.toISOString() ?? null,
      actedAt: notification.actedAt?.toISOString() ?? null,
    }
  }
}
