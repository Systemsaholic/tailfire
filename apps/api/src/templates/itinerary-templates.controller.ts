/**
 * Itinerary Templates Controller
 *
 * REST endpoints for agency-scoped itinerary templates.
 * Templates store reusable itinerary structures that can be applied to trips.
 *
 * Route structure:
 * - GET    /templates/itineraries              - List itinerary templates
 * - POST   /templates/itineraries              - Create template
 * - GET    /templates/itineraries/:id          - Get template by ID
 * - PATCH  /templates/itineraries/:id          - Update template
 * - DELETE /templates/itineraries/:id          - Soft delete template
 *
 * Ownership model:
 * - Agency templates (createdBy = null): Admins CRUD, users read-only
 * - User templates (createdBy = userId): Owner CRUD, others read-only
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ForbiddenException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ItineraryTemplatesService } from './itinerary-templates.service'
import { GetAuthContext } from '../auth/decorators/auth-context.decorator'
import type { AuthContext } from '../auth/auth.types'
import { zodValidation } from '../common/pipes'
import {
  createItineraryTemplateSchema,
  updateItineraryTemplateSchema,
  type CreateItineraryTemplateDto,
  type UpdateItineraryTemplateDto,
  type ItineraryTemplateResponse,
  type ItineraryTemplateListResponse,
} from '@tailfire/shared-types'

@ApiTags('Itinerary Templates')
@Controller('templates/itineraries')
export class ItineraryTemplatesController {
  constructor(private readonly templatesService: ItineraryTemplatesService) {}

  /**
   * List all itinerary templates for an agency
   * GET /templates/itineraries
   */
  @Get()
  @ApiOperation({ summary: 'List itinerary templates for an agency' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name/description' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  async list(
    @GetAuthContext() auth: AuthContext,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<ItineraryTemplateListResponse> {
    return this.templatesService.findAll({
      agencyId: auth.agencyId,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    })
  }

  /**
   * Get an itinerary template by ID
   * GET /templates/itineraries/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an itinerary template by ID' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  async get(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<ItineraryTemplateResponse> {
    return this.templatesService.findByIdOrThrow(id, auth.agencyId)
  }

  /**
   * Create a new itinerary template
   * POST /templates/itineraries
   *
   * Creates a user-owned template (createdBy = auth.userId).
   * Only admins can create agency templates (createdBy = null) by passing isAgencyTemplate: true.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(zodValidation(createItineraryTemplateSchema))
  @ApiOperation({ summary: 'Create an itinerary template' })
  async create(
    @GetAuthContext() auth: AuthContext,
    @Body() dto: CreateItineraryTemplateDto,
  ): Promise<ItineraryTemplateResponse> {
    return this.templatesService.create({
      ...dto,
      agencyId: auth.agencyId,
      createdBy: auth.userId,
    })
  }

  /**
   * Update an itinerary template
   * PATCH /templates/itineraries/:id
   *
   * Ownership check:
   * - Admins can update any template
   * - Users can only update templates they created
   * - Agency templates (createdBy = null) are read-only for non-admins
   */
  @Patch(':id')
  @UsePipes(zodValidation(updateItineraryTemplateSchema))
  @ApiOperation({ summary: 'Update an itinerary template' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  async update(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateItineraryTemplateDto
  ): Promise<ItineraryTemplateResponse> {
    // Check ownership for non-admins
    if (auth.role !== 'admin') {
      const template = await this.templatesService.findByIdOrThrow(id, auth.agencyId)
      if (!template.createdBy) {
        throw new ForbiddenException('Only admins can modify agency templates')
      }
      if (template.createdBy !== auth.userId) {
        throw new ForbiddenException('You can only modify templates you created')
      }
    }

    return this.templatesService.update(id, auth.agencyId, dto)
  }

  /**
   * Soft delete an itinerary template
   * DELETE /templates/itineraries/:id
   *
   * Ownership check:
   * - Admins can delete any template
   * - Users can only delete templates they created
   * - Agency templates (createdBy = null) are read-only for non-admins
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an itinerary template' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  async delete(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<void> {
    // Check ownership for non-admins
    if (auth.role !== 'admin') {
      const template = await this.templatesService.findByIdOrThrow(id, auth.agencyId)
      if (!template.createdBy) {
        throw new ForbiddenException('Only admins can delete agency templates')
      }
      if (template.createdBy !== auth.userId) {
        throw new ForbiddenException('You can only delete templates you created')
      }
    }

    await this.templatesService.delete(id, auth.agencyId)
  }
}
