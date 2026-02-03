/**
 * Tour Import Controller
 *
 * REST API endpoints for tour catalog sync operations.
 * Protected by internal API key (x-internal-api-key header).
 * Intended for admin/internal use only.
 */

import { Controller, Post, Get, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common'
import { ApiTags, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Public } from '../auth/decorators/public.decorator'
import { InternalApiKeyGuard } from '../cruise-import/guards/internal-api-key.guard'
import { TourImportService } from './tour-import.service'
import { TourSyncOptions, TourSyncResult, GLOBUS_BRANDS } from './tour-import.types'

@ApiTags('Tour Import')
@Controller('tour-import')
@Public() // Bypass JWT auth
@UseGuards(InternalApiKeyGuard) // Require internal API key
@ApiHeader({
  name: 'x-internal-api-key',
  description: 'Internal API key for tour sync operations',
  required: true,
})
export class TourImportController {
  constructor(private readonly tourImportService: TourImportService) {}

  // ============================================================================
  // SYNC ENDPOINTS
  // ============================================================================

  /**
   * Start a full tour catalog sync.
   * POST /tour-import/sync
   */
  @Post('sync')
  @ApiOperation({ summary: 'Start a full tour catalog sync from Globus API' })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  @ApiResponse({ status: 409, description: 'Sync already in progress' })
  async runSync(@Body() options: TourSyncOptions = {}): Promise<TourSyncResult> {
    if (this.tourImportService.isSyncInProgress()) {
      throw new HttpException('Sync already in progress', HttpStatus.CONFLICT)
    }

    return this.tourImportService.runSync(options)
  }

  /**
   * Run a dry-run sync (show what would be synced without changes).
   * POST /tour-import/sync/dry-run
   */
  @Post('sync/dry-run')
  @ApiOperation({ summary: 'Dry run sync (preview without changes)' })
  async runDrySync(@Body() options: TourSyncOptions = {}): Promise<TourSyncResult> {
    return this.tourImportService.runSync({ ...options, dryRun: true })
  }

  /**
   * Check if sync is currently in progress.
   * GET /tour-import/sync/status
   */
  @Get('sync/status')
  @ApiOperation({ summary: 'Check sync status' })
  getSyncStatus(): { inProgress: boolean } {
    return this.tourImportService.getSyncStatus()
  }

  // ============================================================================
  // INFO ENDPOINTS
  // ============================================================================

  /**
   * Get available brands for sync.
   * GET /tour-import/brands
   */
  @Get('brands')
  @ApiOperation({ summary: 'Get available brands for sync' })
  getBrands(): { brands: string[] } {
    return { brands: GLOBUS_BRANDS }
  }
}
