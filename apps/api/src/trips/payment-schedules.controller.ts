/**
 * Payment Schedules Controller
 *
 * REST endpoints for activity-level payment schedule management.
 * Handles payment schedule config and expected payment items.
 *
 * Note: Legacy /component-pricing/* routes were removed in favor of
 * /activity-pricing/* to align with the activityPricingId field name.
 *
 * TODO: Add @UseGuards(AuthGuard) when authentication is implemented (Phase 4)
 * TODO: Add tenant scoping to ensure users can only access their own agency's trips
 * TODO: Extract agencyId from JWT context for proper authorization
 *
 * @see AUTH_INTEGRATION.md for authentication implementation requirements
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PaymentSchedulesService } from './payment-schedules.service'
import type {
  PaymentScheduleConfigDto,
  CreatePaymentScheduleConfigDto,
  UpdatePaymentScheduleConfigDto,
  UpdateExpectedPaymentItemDto,
  ExpectedPaymentItemDto,
  PaymentTransactionDto,
  CreatePaymentTransactionDto,
  PaymentTransactionListResponseDto,
} from '@tailfire/shared-types'

@ApiTags('Payment Schedules')
@Controller('payment-schedules')
export class PaymentSchedulesController {
  constructor(private readonly paymentSchedulesService: PaymentSchedulesService) {}

  // ============================================================================
  // Payment Schedule Config Endpoints
  // ============================================================================

  /**
   * Get payment schedule config by activity pricing ID
   * GET /payment-schedules/activity-pricing/:activityPricingId
   */
  @Get('activity-pricing/:activityPricingId')
  async getByActivityPricingId(
    @Param('activityPricingId') activityPricingId: string,
  ): Promise<PaymentScheduleConfigDto | null> {
    return this.paymentSchedulesService.findByActivityPricingId(activityPricingId)
  }

  /**
   * Create payment schedule configuration
   * POST /payment-schedules
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePaymentScheduleConfigDto,
  ): Promise<PaymentScheduleConfigDto> {
    return this.paymentSchedulesService.create(dto)
  }

  /**
   * Update payment schedule configuration
   * PATCH /payment-schedules/activity-pricing/:activityPricingId
   */
  @Patch('activity-pricing/:activityPricingId')
  async update(
    @Param('activityPricingId') activityPricingId: string,
    @Body() dto: UpdatePaymentScheduleConfigDto,
  ): Promise<PaymentScheduleConfigDto> {
    return this.paymentSchedulesService.update(activityPricingId, dto)
  }

  /**
   * Delete payment schedule configuration (cascades to expected payment items)
   * DELETE /payment-schedules/activity-pricing/:activityPricingId
   */
  @Delete('activity-pricing/:activityPricingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('activityPricingId') activityPricingId: string): Promise<void> {
    await this.paymentSchedulesService.delete(activityPricingId)
  }

  // ============================================================================
  // Expected Payment Items Endpoints
  // ============================================================================

  /**
   * Update an expected payment item
   * PATCH /payment-schedules/expected-payment-items/:itemId
   */
  @Patch('expected-payment-items/:itemId')
  async updateExpectedPaymentItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateExpectedPaymentItemDto,
  ): Promise<ExpectedPaymentItemDto> {
    return this.paymentSchedulesService.updateExpectedPaymentItem(itemId, dto)
  }

  // ============================================================================
  // Payment Transaction Endpoints
  // ============================================================================

  /**
   * Create a payment transaction
   * POST /payment-schedules/transactions
   */
  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @Body() dto: CreatePaymentTransactionDto,
  ): Promise<PaymentTransactionDto> {
    return this.paymentSchedulesService.createTransaction(dto)
  }

  /**
   * Get all transactions for an expected payment item
   * GET /payment-schedules/expected-payment-items/:itemId/transactions
   */
  @Get('expected-payment-items/:itemId/transactions')
  async getTransactionsByExpectedPaymentItemId(
    @Param('itemId') itemId: string,
  ): Promise<PaymentTransactionListResponseDto> {
    return this.paymentSchedulesService.findTransactionsByExpectedPaymentItemId(itemId)
  }

  /**
   * Delete a payment transaction
   * DELETE /payment-schedules/transactions/:transactionId
   */
  @Delete('transactions/:transactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTransaction(@Param('transactionId') transactionId: string): Promise<void> {
    await this.paymentSchedulesService.deleteTransaction(transactionId)
  }
}
