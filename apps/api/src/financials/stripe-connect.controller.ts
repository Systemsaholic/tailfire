/**
 * Stripe Connect Controller
 *
 * REST API endpoints for Stripe Connect operations.
 *
 * TODO: Add @UseGuards(AuthGuard) when authentication is implemented
 * TODO: Add tenant scoping to ensure users can only manage their own agency
 * TODO: Consider role-based access (admin only for Stripe onboarding)
 *
 * Endpoints:
 * - GET /agencies/:agencyId/settings - Get agency settings
 * - PATCH /agencies/:agencyId/settings - Update agency settings
 * - POST /agencies/:agencyId/stripe/onboard - Start Stripe onboarding
 * - GET /agencies/:agencyId/stripe/status - Refresh and get account status
 * - POST /agencies/:agencyId/stripe/dashboard - Get dashboard login link
 */

import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { StripeConnectService } from './stripe-connect.service'
import type {
  StripeOnboardingResponseDto,
  StripeAccountStatusResponseDto,
  AgencySettingsResponseDto,
  UpdateAgencySettingsDto,
} from '@tailfire/shared-types'

@ApiTags('Stripe Connect')
@Controller()
export class StripeConnectController {
  constructor(private readonly stripeConnectService: StripeConnectService) {}

  /**
   * Get agency settings
   * GET /agencies/:agencyId/settings
   */
  @Get('agencies/:agencyId/settings')
  async getAgencySettings(
    @Param('agencyId') agencyId: string
  ): Promise<AgencySettingsResponseDto> {
    return this.stripeConnectService.getAgencySettings(agencyId)
  }

  /**
   * Update agency settings (compliance, branding, etc.)
   * PATCH /agencies/:agencyId/settings
   */
  @Patch('agencies/:agencyId/settings')
  async updateAgencySettings(
    @Param('agencyId') agencyId: string,
    @Body() dto: UpdateAgencySettingsDto
  ): Promise<AgencySettingsResponseDto> {
    return this.stripeConnectService.updateAgencySettings(agencyId, dto)
  }

  /**
   * Start Stripe Connect onboarding
   * POST /agencies/:agencyId/stripe/onboard
   */
  @Post('agencies/:agencyId/stripe/onboard')
  async startOnboarding(
    @Param('agencyId') agencyId: string,
    @Body() dto: { returnUrl: string; refreshUrl: string }
  ): Promise<StripeOnboardingResponseDto> {
    return this.stripeConnectService.startOnboarding(agencyId, dto.returnUrl, dto.refreshUrl)
  }

  /**
   * Refresh and get Stripe account status
   * GET /agencies/:agencyId/stripe/status
   */
  @Get('agencies/:agencyId/stripe/status')
  async getAccountStatus(
    @Param('agencyId') agencyId: string
  ): Promise<StripeAccountStatusResponseDto> {
    return this.stripeConnectService.refreshAccountStatus(agencyId)
  }

  /**
   * Get Stripe Express Dashboard login link
   * POST /agencies/:agencyId/stripe/dashboard
   */
  @Post('agencies/:agencyId/stripe/dashboard')
  async getDashboardLink(@Param('agencyId') agencyId: string): Promise<{ url: string }> {
    return this.stripeConnectService.createDashboardLink(agencyId)
  }
}
