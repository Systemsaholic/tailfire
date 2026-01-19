/**
 * Dashboard Controller
 *
 * API endpoints for dashboard statistics
 */

import { Controller, Get } from '@nestjs/common'
import { GetAuthContext } from '../auth/decorators/auth-context.decorator'
import type { AuthContext } from '../auth/auth.types'
import { DashboardService, DashboardStats } from './dashboard.service'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/stats
   * Returns aggregated statistics for the dashboard
   */
  @Get('stats')
  async getStats(@GetAuthContext() auth: AuthContext): Promise<DashboardStats> {
    return this.dashboardService.getStats(auth.agencyId)
  }
}
