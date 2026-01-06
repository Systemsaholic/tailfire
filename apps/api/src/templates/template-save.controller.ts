/**
 * Template Save Controller
 *
 * REST endpoints for saving existing itineraries/packages as templates.
 * "Save to Library" functionality.
 *
 * Route structure:
 * - POST /itineraries/:itineraryId/save-as-template - Save itinerary as template
 * - POST /packages/:packageId/save-as-template      - Save package as template
 *
 * Ownership model:
 * - Templates are always created as user-owned (createdBy = auth.userId)
 * - Agency is enforced from JWT claims (cannot save to different agency)
 */

import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ForbiddenException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger'
import { TemplateExtractorService } from './template-extractor.service'
import { GetAuthContext } from '../auth/decorators/auth-context.decorator'
import type { AuthContext } from '../auth/auth.types'
import { zodValidation } from '../common/pipes'
import {
  saveItineraryAsTemplateSchema,
  savePackageAsTemplateSchema,
  type SaveItineraryAsTemplateDto,
  type SavePackageAsTemplateDto,
  type ItineraryTemplateResponse,
  type PackageTemplateResponse,
} from '@tailfire/shared-types'

@ApiTags('Template Save')
@Controller()
export class TemplateSaveController {
  constructor(private readonly extractorService: TemplateExtractorService) {}

  /**
   * Save an itinerary as a template
   * POST /itineraries/:itineraryId/save-as-template
   *
   * Extracts the itinerary structure (days, activities) and saves it as a reusable template.
   */
  @Post('itineraries/:itineraryId/save-as-template')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(zodValidation(saveItineraryAsTemplateSchema))
  @ApiOperation({ summary: 'Save an itinerary as a template' })
  @ApiParam({ name: 'itineraryId', description: 'Itinerary UUID to extract' })
  @ApiBody({
    description: 'Template metadata',
    schema: {
      type: 'object',
      required: ['agencyId', 'name'],
      properties: {
        agencyId: {
          type: 'string',
          format: 'uuid',
          description: 'Agency UUID to own the template',
        },
        name: {
          type: 'string',
          description: 'Template name',
        },
        description: {
          type: 'string',
          description: 'Optional template description',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 404, description: 'Itinerary not found' })
  async saveItineraryAsTemplate(
    @GetAuthContext() auth: AuthContext,
    @Param('itineraryId') itineraryId: string,
    @Body() dto: SaveItineraryAsTemplateDto
  ): Promise<ItineraryTemplateResponse> {
    // Validate agency match - user can only save templates to their own agency
    if (dto.agencyId && dto.agencyId !== auth.agencyId) {
      throw new ForbiddenException('Cannot save templates to a different agency')
    }

    return this.extractorService.saveItineraryAsTemplate(itineraryId, {
      ...dto,
      agencyId: auth.agencyId,
      createdBy: auth.userId,
    })
  }

  /**
   * Save a package as a template
   * POST /packages/:packageId/save-as-template
   *
   * Extracts the package structure (metadata, activities across days) and saves it as a reusable template.
   */
  @Post('packages/:packageId/save-as-template')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(zodValidation(savePackageAsTemplateSchema))
  @ApiOperation({ summary: 'Save a package as a template' })
  @ApiParam({ name: 'packageId', description: 'Package UUID to extract' })
  @ApiBody({
    description: 'Template metadata',
    schema: {
      type: 'object',
      required: ['agencyId', 'name'],
      properties: {
        agencyId: {
          type: 'string',
          format: 'uuid',
          description: 'Agency UUID to own the template',
        },
        name: {
          type: 'string',
          description: 'Template name',
        },
        description: {
          type: 'string',
          description: 'Optional template description',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async savePackageAsTemplate(
    @GetAuthContext() auth: AuthContext,
    @Param('packageId') packageId: string,
    @Body() dto: SavePackageAsTemplateDto
  ): Promise<PackageTemplateResponse> {
    // Validate agency match - user can only save templates to their own agency
    if (dto.agencyId && dto.agencyId !== auth.agencyId) {
      throw new ForbiddenException('Cannot save templates to a different agency')
    }

    return this.extractorService.savePackageAsTemplate(packageId, {
      ...dto,
      agencyId: auth.agencyId,
      createdBy: auth.userId,
    })
  }
}
