/**
 * Globus Controller
 *
 * Real-time proxy endpoints for the Globus Family of Brands WebAPI.
 * Serves tours, departures, filters, and promotions for Globus, Cosmos, and Monograms.
 */

import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiHeader, ApiSecurity } from '@nestjs/swagger'
import { Public } from '../auth/decorators/public.decorator'
import { CatalogAuthGuard, CatalogThrottleGuard } from '../common/guards'
import { GlobusService } from './globus.service'
import { GlobusSearchQueryDto, GlobusToursQueryDto } from './dto/search.dto'
import { GlobusDeparturesQueryDto } from './dto/tour-detail.dto'
import { GlobusFiltersQueryDto, GlobusPromotionsQueryDto } from './dto/filters.dto'

@ApiTags('Globus Tours')
@Controller('globus')
@Public()
@UseGuards(CatalogAuthGuard, CatalogThrottleGuard)
@ApiSecurity('bearer')
@ApiHeader({
  name: 'x-catalog-api-key',
  description: 'Catalog API key for OTA public access (alternative to JWT)',
  required: false,
})
export class GlobusController {
  constructor(private readonly globusService: GlobusService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search vacations by keyword' })
  @ApiResponse({ status: 200, description: 'Matching tour results' })
  async search(@Query() dto: GlobusSearchQueryDto) {
    return this.globusService.searchByKeyword(
      dto.keywords,
      dto.brand,
      dto.season,
      dto.currency,
    )
  }

  @Get('tours')
  @ApiOperation({ summary: 'List all available tours' })
  @ApiResponse({ status: 200, description: 'All tours for the specified brand/season' })
  async listTours(@Query() dto: GlobusToursQueryDto) {
    return this.globusService.getAllTours(dto.brand, dto.season, dto.currency)
  }

  @Get('tours/:tourCode/departures')
  @ApiOperation({ summary: 'Get departures with live pricing for a tour' })
  @ApiParam({ name: 'tourCode', description: 'Globus tour code (e.g. "CQ")' })
  @ApiResponse({ status: 200, description: 'Departures with cabin pricing' })
  async getDepartures(
    @Param('tourCode') tourCode: string,
    @Query() dto: GlobusDeparturesQueryDto,
  ) {
    return this.globusService.getDeparturesWithPricing(
      tourCode,
      dto.brand,
      dto.currency,
    )
  }

  @Get('filters/locations')
  @ApiOperation({ summary: 'Get location keywords for autocomplete' })
  @ApiResponse({ status: 200, description: 'Location keyword strings' })
  async getLocationKeywords(@Query() dto: GlobusFiltersQueryDto) {
    return this.globusService.getLocationKeywords(dto.brand)
  }

  @Get('filters/styles')
  @ApiOperation({ summary: 'Get travel style keywords for filters' })
  @ApiResponse({ status: 200, description: 'Travel style keyword strings' })
  async getTravelStyleKeywords(@Query() dto: GlobusFiltersQueryDto) {
    return this.globusService.getTravelStyleKeywords(dto.brand)
  }

  @Get('promotions')
  @ApiOperation({ summary: 'Get current promotions' })
  @ApiResponse({ status: 200, description: 'Active promotions with tour associations' })
  async getPromotions(@Query() dto: GlobusPromotionsQueryDto) {
    return this.globusService.getPromotions(dto.brand, dto.season)
  }
}
