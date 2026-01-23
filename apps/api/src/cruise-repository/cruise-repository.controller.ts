/**
 * Cruise Repository Controller
 *
 * API endpoints for browsing cruise sailings.
 * Supports tiered authentication:
 * - JWT auth (admin/client portal) - no rate limiting
 * - API key auth (OTA public) - aggressive rate limiting
 */

import { Controller, Get, Query, Param, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiHeader, ApiSecurity } from '@nestjs/swagger'
import { Public } from '../auth/decorators/public.decorator'
import { CatalogAuthGuard } from './guards/catalog-auth.guard'
import { CatalogThrottleGuard } from './guards/catalog-throttle.guard'
import { CruiseRepositoryService } from './cruise-repository.service'
import {
  SailingSearchDto,
  SailingSearchResponseDto,
  SailingFiltersResponseDto,
} from './dto/sailing-search.dto'
import {
  SailingDetailResponseDto,
  ShipImagesResponseDto,
  ShipDecksResponseDto,
  AlternateSailingsResponseDto,
  CabinImagesResponseDto,
} from './dto/sailing-detail.dto'

@ApiTags('Cruise Repository')
@Controller('cruise-repository')
@Public() // Bypass global JWT guard - we use our own hybrid auth
@UseGuards(CatalogAuthGuard, CatalogThrottleGuard)
@ApiSecurity('bearer')
@ApiHeader({
  name: 'x-catalog-api-key',
  description: 'Catalog API key for OTA public access (alternative to JWT)',
  required: false,
})
export class CruiseRepositoryController {
  constructor(private readonly cruiseRepository: CruiseRepositoryService) {}

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search sailings with filters and pagination.
   * GET /cruise-repository/sailings
   */
  @Get('sailings')
  @ApiOperation({ summary: 'Search sailings with filters and pagination' })
  @ApiResponse({ status: 200, type: SailingSearchResponseDto })
  async searchSailings(@Query() dto: SailingSearchDto): Promise<SailingSearchResponseDto> {
    return this.cruiseRepository.searchSailings(dto)
  }

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  /**
   * Get available filter options (cruise lines, ships, regions, ports, ranges).
   * Pass current filter values to get dynamic options that adjust based on selections.
   * GET /cruise-repository/filters
   */
  @Get('filters')
  @ApiOperation({ summary: 'Get available filter options for search UI (dynamically filtered)' })
  @ApiResponse({ status: 200, type: SailingFiltersResponseDto })
  async getFilters(@Query() currentFilters?: SailingSearchDto): Promise<SailingFiltersResponseDto> {
    return this.cruiseRepository.getFilterOptions(currentFilters)
  }

  // ============================================================================
  // SAILING DETAIL
  // ============================================================================

  /**
   * Get full sailing details including itinerary and prices.
   * GET /cruise-repository/sailings/:id
   */
  @Get('sailings/:id')
  @ApiOperation({ summary: 'Get sailing details by ID' })
  @ApiParam({ name: 'id', description: 'Sailing UUID' })
  @ApiResponse({ status: 200, type: SailingDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Sailing not found' })
  async getSailingDetail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<SailingDetailResponseDto> {
    return this.cruiseRepository.getSailingDetail(id)
  }

  // ============================================================================
  // SHIP IMAGES (PAGINATED)
  // ============================================================================

  /**
   * Get paginated ship images.
   * GET /cruise-repository/ships/:shipId/images
   */
  @Get('ships/:shipId/images')
  @ApiOperation({ summary: 'Get paginated ship images' })
  @ApiParam({ name: 'shipId', description: 'Ship UUID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Items per page (max: 20, default: 10)' })
  @ApiResponse({ status: 200, type: ShipImagesResponseDto })
  async getShipImages(
    @Param('shipId', ParseUUIDPipe) shipId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number
  ): Promise<ShipImagesResponseDto> {
    return this.cruiseRepository.getShipImages(shipId, page, pageSize)
  }

  // ============================================================================
  // SHIP DECKS (with cabin coordinates for interactive deck plans)
  // ============================================================================

  /**
   * Get ship deck plans with cabin coordinate overlays.
   * GET /cruise-repository/ships/:shipId/decks
   */
  @Get('ships/:shipId/decks')
  @ApiOperation({ summary: 'Get ship decks with cabin coordinates for interactive deck plans' })
  @ApiParam({ name: 'shipId', description: 'Ship UUID' })
  @ApiResponse({ status: 200, type: ShipDecksResponseDto })
  @ApiResponse({ status: 404, description: 'Ship not found' })
  async getShipDecks(
    @Param('shipId', ParseUUIDPipe) shipId: string
  ): Promise<ShipDecksResponseDto> {
    return this.cruiseRepository.getShipDecks(shipId)
  }

  // ============================================================================
  // ALTERNATE SAILINGS
  // ============================================================================

  /**
   * Get alternate sailings for a given sailing.
   * GET /cruise-repository/sailings/:id/alternates
   */
  @Get('sailings/:id/alternates')
  @ApiOperation({ summary: 'Get alternate/similar sailings' })
  @ApiParam({ name: 'id', description: 'Sailing UUID' })
  @ApiResponse({ status: 200, type: AlternateSailingsResponseDto })
  @ApiResponse({ status: 404, description: 'Sailing not found' })
  async getAlternateSailings(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<AlternateSailingsResponseDto> {
    return this.cruiseRepository.getAlternateSailings(id)
  }

  // ============================================================================
  // CABIN IMAGES
  // ============================================================================

  /**
   * Get cabin type gallery images.
   * GET /cruise-repository/cabin-types/:id/images
   */
  @Get('cabin-types/:id/images')
  @ApiOperation({ summary: 'Get cabin type gallery images' })
  @ApiParam({ name: 'id', description: 'Cabin type UUID' })
  @ApiResponse({ status: 200, type: CabinImagesResponseDto })
  @ApiResponse({ status: 404, description: 'Cabin type not found' })
  async getCabinImages(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<CabinImagesResponseDto> {
    return this.cruiseRepository.getCabinImages(id)
  }
}
