/**
 * Trip-Order Controller
 *
 * REST API endpoints for Trip-Order PDF generation.
 *
 * TODO: Add @UseGuards(AuthGuard) when authentication is implemented
 * TODO: Add tenant scoping to ensure users can only access their own agency's trips
 *
 * Endpoints:
 * - POST /trips/:tripId/trip-order - Generate and get Trip-Order PDF URL
 * - POST /trips/:tripId/trip-order/download - Download Trip-Order PDF directly
 */

import { Controller, Post, Param, Body, Res, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { TripOrderService } from './trip-order.service'
import type { GenerateTripOrderDto, TripOrderResponseDto } from '@tailfire/shared-types'

@ApiTags('Trip Orders')
@Controller()
export class TripOrderController {
  constructor(private readonly tripOrderService: TripOrderService) {}

  /**
   * Generate Trip-Order PDF and return URL
   * POST /trips/:tripId/trip-order
   */
  @Post('trips/:tripId/trip-order')
  async generateTripOrder(
    @Param('tripId') tripId: string,
    @Query('agencyId') agencyId: string,
    @Body() dto: GenerateTripOrderDto
  ): Promise<TripOrderResponseDto> {
    // In a real app, agencyId would come from the authenticated user's context
    // For now, we accept it as a query param
    return this.tripOrderService.generateTripOrderWithUrl(tripId, agencyId ?? '', dto)
  }

  /**
   * Generate and download Trip-Order PDF directly
   * POST /trips/:tripId/trip-order/download
   */
  @Post('trips/:tripId/trip-order/download')
  async downloadTripOrder(
    @Param('tripId') tripId: string,
    @Query('agencyId') agencyId: string,
    @Body() dto: GenerateTripOrderDto,
    @Res() res: Response
  ): Promise<void> {
    const pdfBuffer = await this.tripOrderService.generateTripOrder(tripId, agencyId ?? '', dto)

    // Get trip name for filename
    const filename = `trip-order-${tripId.slice(0, 8)}.pdf`

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    })

    res.send(pdfBuffer)
  }
}
