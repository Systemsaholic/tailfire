/**
 * Service Fees Controller
 *
 * REST API endpoints for service fee management.
 *
 * TODO: Add @UseGuards(AuthGuard) when authentication is implemented
 * TODO: Add tenant scoping to ensure users can only access their own agency's trips
 *
 * Endpoints:
 * - GET /trips/:tripId/service-fees - List all service fees for a trip
 * - GET /service-fees/:id - Get a single service fee
 * - POST /trips/:tripId/service-fees - Create a new service fee
 * - PATCH /service-fees/:id - Update a service fee (draft only)
 * - POST /service-fees/:id/send - Send a service fee
 * - POST /service-fees/:id/mark-paid - Mark as paid (manual, pre-Stripe)
 * - POST /service-fees/:id/refund - Process a refund
 * - POST /service-fees/:id/cancel - Cancel a service fee
 * - DELETE /service-fees/:id - Delete a service fee (draft only)
 */

import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ServiceFeesService } from './service-fees.service'
import type {
  ServiceFeeResponseDto,
  CreateServiceFeeDto,
  UpdateServiceFeeDto,
  RefundServiceFeeDto,
} from '@tailfire/shared-types'

@ApiTags('Service Fees')
@Controller()
export class ServiceFeesController {
  constructor(private readonly serviceFeesService: ServiceFeesService) {}

  /**
   * Get all service fees for a trip
   * GET /trips/:tripId/service-fees
   */
  @Get('trips/:tripId/service-fees')
  async getServiceFees(@Param('tripId') tripId: string): Promise<ServiceFeeResponseDto[]> {
    return this.serviceFeesService.getServiceFees(tripId)
  }

  /**
   * Get a single service fee
   * GET /service-fees/:id
   */
  @Get('service-fees/:id')
  async getServiceFee(@Param('id') id: string): Promise<ServiceFeeResponseDto> {
    return this.serviceFeesService.getServiceFee(id)
  }

  /**
   * Create a new service fee (draft status)
   * POST /trips/:tripId/service-fees
   */
  @Post('trips/:tripId/service-fees')
  async createServiceFee(
    @Param('tripId') tripId: string,
    @Body() dto: CreateServiceFeeDto
  ): Promise<ServiceFeeResponseDto> {
    return this.serviceFeesService.createServiceFee(tripId, dto)
  }

  /**
   * Update a service fee (draft only)
   * PATCH /service-fees/:id
   */
  @Patch('service-fees/:id')
  async updateServiceFee(
    @Param('id') id: string,
    @Body() dto: UpdateServiceFeeDto
  ): Promise<ServiceFeeResponseDto> {
    return this.serviceFeesService.updateServiceFee(id, dto)
  }

  /**
   * Send a service fee (draft → sent)
   * POST /service-fees/:id/send
   */
  @Post('service-fees/:id/send')
  async sendServiceFee(@Param('id') id: string): Promise<ServiceFeeResponseDto> {
    return this.serviceFeesService.sendServiceFee(id)
  }

  /**
   * Mark a service fee as paid (sent → paid)
   * This is a manual endpoint for pre-Stripe testing
   * In production, payment confirmation comes from Stripe webhooks
   * POST /service-fees/:id/mark-paid
   */
  @Post('service-fees/:id/mark-paid')
  async markAsPaid(@Param('id') id: string): Promise<ServiceFeeResponseDto> {
    return this.serviceFeesService.markAsPaid(id)
  }

  /**
   * Process a refund
   * POST /service-fees/:id/refund
   */
  @Post('service-fees/:id/refund')
  async processRefund(
    @Param('id') id: string,
    @Body() dto: RefundServiceFeeDto
  ): Promise<ServiceFeeResponseDto> {
    return this.serviceFeesService.processRefund(id, dto)
  }

  /**
   * Cancel a service fee (draft/sent → cancelled)
   * POST /service-fees/:id/cancel
   */
  @Post('service-fees/:id/cancel')
  async cancelServiceFee(@Param('id') id: string): Promise<ServiceFeeResponseDto> {
    return this.serviceFeesService.cancelServiceFee(id)
  }

  /**
   * Delete a service fee (draft only)
   * DELETE /service-fees/:id
   */
  @Delete('service-fees/:id')
  async deleteServiceFee(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.serviceFeesService.deleteServiceFee(id)
    return { success: true }
  }
}
