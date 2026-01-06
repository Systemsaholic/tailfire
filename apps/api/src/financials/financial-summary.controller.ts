/**
 * Financial Summary Controller
 *
 * REST API endpoint for trip financial summary.
 *
 * TODO: Add @UseGuards(AuthGuard) when authentication is implemented
 * TODO: Add tenant scoping to ensure users can only access their own agency's trips
 *
 * Endpoints:
 * - GET /trips/:tripId/financial-summary - Get comprehensive financial summary
 */

import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FinancialSummaryService } from './financial-summary.service'
import type { TripFinancialSummaryResponseDto } from '@tailfire/shared-types'

@ApiTags('Financial Summary')
@Controller()
export class FinancialSummaryController {
  constructor(private readonly financialSummaryService: FinancialSummaryService) {}

  /**
   * Get comprehensive financial summary for a trip
   * GET /trips/:tripId/financial-summary
   */
  @Get('trips/:tripId/financial-summary')
  async getFinancialSummary(
    @Param('tripId') tripId: string
  ): Promise<TripFinancialSummaryResponseDto> {
    return this.financialSummaryService.getTripFinancialSummary(tripId)
  }
}
