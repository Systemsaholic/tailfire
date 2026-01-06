/**
 * Template Apply Controller
 *
 * REST endpoints for applying templates to create itineraries and packages.
 *
 * Route structure:
 * - POST /trips/:tripId/templates/itineraries/:templateId/apply  - Apply itinerary template to trip
 * - POST /itineraries/:itineraryId/templates/packages/:templateId/apply - Apply package template to itinerary
 *
 * TODO: Add @UseGuards(AuthGuard) when authentication is implemented
 */

import {
  Controller,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  UsePipes,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger'
import { TemplateApplierService } from './template-applier.service'
import { zodValidation } from '../common/pipes'
import {
  applyItineraryTemplateSchema,
  applyPackageTemplateSchema,
  type ApplyItineraryTemplateDto,
  type ApplyPackageTemplateDto,
} from '@tailfire/shared-types'

@ApiTags('Template Apply')
@Controller()
export class TemplateApplyController {
  constructor(private readonly applierService: TemplateApplierService) {}

  /**
   * Apply an itinerary template to a trip
   * POST /trips/:tripId/templates/itineraries/:templateId/apply?agencyId=xxx
   *
   * Creates a new itinerary with days and activities from the template.
   */
  @Post('trips/:tripId/templates/itineraries/:templateId/apply')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(zodValidation(applyItineraryTemplateSchema))
  @ApiOperation({ summary: 'Apply an itinerary template to a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip UUID to add itinerary to' })
  @ApiParam({ name: 'templateId', description: 'Itinerary template UUID to apply' })
  @ApiQuery({ name: 'agencyId', required: true, description: 'Agency UUID for authorization' })
  @ApiBody({
    description: 'Apply options',
    schema: {
      type: 'object',
      properties: {
        anchorDay: {
          type: 'string',
          description: 'ISO date (YYYY-MM-DD) to use as anchor. Defaults to trip start date.',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Itinerary created successfully' })
  @ApiResponse({ status: 404, description: 'Trip or template not found' })
  @ApiResponse({ status: 403, description: 'Agency context required' })
  async applyItineraryTemplate(
    @Param('tripId') tripId: string,
    @Param('templateId') templateId: string,
    @Query('agencyId') agencyId: string,
    @Body() dto: ApplyItineraryTemplateDto
  ): Promise<{ itineraryId: string }> {
    if (!agencyId) {
      throw new ForbiddenException('Agency context required')
    }

    return this.applierService.applyItineraryTemplate(tripId, templateId, agencyId, dto)
  }

  /**
   * Apply a package template to an itinerary
   * POST /itineraries/:itineraryId/templates/packages/:templateId/apply?agencyId=xxx
   *
   * Creates a new package with activities across days from the anchor day.
   * Auto-extends the itinerary if the package spans beyond existing days.
   */
  @Post('itineraries/:itineraryId/templates/packages/:templateId/apply')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(zodValidation(applyPackageTemplateSchema))
  @ApiOperation({ summary: 'Apply a package template to an itinerary' })
  @ApiParam({ name: 'itineraryId', description: 'Itinerary UUID to add package to' })
  @ApiParam({ name: 'templateId', description: 'Package template UUID to apply' })
  @ApiQuery({ name: 'agencyId', required: true, description: 'Agency UUID for authorization' })
  @ApiBody({
    description: 'Apply options',
    schema: {
      type: 'object',
      required: ['anchorDayId'],
      properties: {
        anchorDayId: {
          type: 'string',
          description: 'Day UUID to use as anchor (day 0 of the package)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  @ApiResponse({ status: 404, description: 'Itinerary, day, or template not found' })
  @ApiResponse({ status: 403, description: 'Agency context required' })
  async applyPackageTemplate(
    @Param('itineraryId') itineraryId: string,
    @Param('templateId') templateId: string,
    @Query('agencyId') agencyId: string,
    @Body() dto: ApplyPackageTemplateDto
  ): Promise<{ packageId: string }> {
    if (!agencyId) {
      throw new ForbiddenException('Agency context required')
    }

    return this.applierService.applyPackageTemplate(itineraryId, templateId, agencyId, dto)
  }
}
