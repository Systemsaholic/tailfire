/**
 * Tour Repository Controller
 *
 * API endpoints for browsing tour catalog.
 * Supports tiered authentication:
 * - JWT auth (admin/client portal) - no rate limiting
 * - API key auth (OTA public) - aggressive rate limiting
 */

import { Controller, Get, Query, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiHeader, ApiSecurity } from '@nestjs/swagger'
import { Public } from '../auth/decorators/public.decorator'
import { CatalogAuthGuard, CatalogThrottleGuard } from '../common/guards'
import { TourRepositoryService } from './tour-repository.service'
import {
  TourSearchDto,
  TourSearchResponseDto,
  TourFiltersResponseDto,
} from './dto/tour-search.dto'
import { TourDetailResponseDto, TourDeparturesResponseDto } from './dto/tour-detail.dto'

@ApiTags('Tour Repository')
@Controller('tour-repository')
@Public() // Bypass global JWT guard - we use our own hybrid auth
@UseGuards(CatalogAuthGuard, CatalogThrottleGuard)
@ApiSecurity('bearer')
@ApiHeader({
  name: 'x-catalog-api-key',
  description: 'Catalog API key for OTA public access (alternative to JWT)',
  required: false,
})
export class TourRepositoryController {
  constructor(private readonly tourRepository: TourRepositoryService) {}

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search tours with filters and pagination.
   * GET /tour-repository/tours
   */
  @Get('tours')
  @ApiOperation({ summary: 'Search tours with filters and pagination' })
  @ApiResponse({ status: 200, type: TourSearchResponseDto })
  async searchTours(@Query() dto: TourSearchDto): Promise<TourSearchResponseDto> {
    return this.tourRepository.searchTours(dto)
  }

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  /**
   * Get available filter options (operators, seasons, days).
   * GET /tour-repository/filters
   */
  @Get('filters')
  @ApiOperation({ summary: 'Get available filter options for search UI' })
  @ApiResponse({ status: 200, type: TourFiltersResponseDto })
  async getFilters(@Query() currentFilters?: TourSearchDto): Promise<TourFiltersResponseDto> {
    return this.tourRepository.getFilterOptions(currentFilters)
  }

  // ============================================================================
  // TOUR DETAIL
  // ============================================================================

  /**
   * Get full tour details including itinerary, hotels, media, and inclusions.
   * GET /tour-repository/tours/:id
   */
  @Get('tours/:id')
  @ApiOperation({ summary: 'Get tour details by ID' })
  @ApiParam({ name: 'id', description: 'Tour UUID' })
  @ApiResponse({ status: 200, type: TourDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  async getTourDetail(@Param('id', ParseUUIDPipe) id: string): Promise<TourDetailResponseDto> {
    return this.tourRepository.getTourDetail(id)
  }

  // ============================================================================
  // DEPARTURES
  // ============================================================================

  /**
   * Get tour departures with pricing.
   * GET /tour-repository/tours/:id/departures
   */
  @Get('tours/:id/departures')
  @ApiOperation({ summary: 'Get tour departures with pricing' })
  @ApiParam({ name: 'id', description: 'Tour UUID' })
  @ApiResponse({ status: 200, type: TourDeparturesResponseDto })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  async getTourDepartures(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<TourDeparturesResponseDto> {
    return this.tourRepository.getTourDepartures(id)
  }
}
