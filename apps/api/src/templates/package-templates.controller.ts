/**
 * Package Templates Controller
 *
 * REST endpoints for agency-scoped package templates.
 * Templates store reusable package structures that can be applied to itineraries.
 *
 * Route structure:
 * - GET    /templates/packages              - List package templates
 * - POST   /templates/packages              - Create template
 * - GET    /templates/packages/:id          - Get template by ID
 * - PATCH  /templates/packages/:id          - Update template
 * - DELETE /templates/packages/:id          - Soft delete template
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
import { PackageTemplatesService } from './package-templates.service'
import { GetAuthContext } from '../auth/decorators/auth-context.decorator'
import type { AuthContext } from '../auth/auth.types'
import { zodValidation } from '../common/pipes'
import {
  createPackageTemplateSchema,
  updatePackageTemplateSchema,
  type CreatePackageTemplateDto,
  type UpdatePackageTemplateDto,
  type PackageTemplateResponse,
  type PackageTemplateListResponse,
} from '@tailfire/shared-types'

@ApiTags('Package Templates')
@Controller('templates/packages')
export class PackageTemplatesController {
  constructor(private readonly templatesService: PackageTemplatesService) {}

  /**
   * List all package templates for an agency
   * GET /templates/packages
   */
  @Get()
  @ApiOperation({ summary: 'List package templates for an agency' })
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
  ): Promise<PackageTemplateListResponse> {
    return this.templatesService.findAll({
      agencyId: auth.agencyId,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    })
  }

  /**
   * Get a package template by ID
   * GET /templates/packages/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a package template by ID' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  async get(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<PackageTemplateResponse> {
    return this.templatesService.findByIdOrThrow(id, auth.agencyId)
  }

  /**
   * Create a new package template
   * POST /templates/packages
   *
   * Creates a user-owned template (createdBy = auth.userId).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(zodValidation(createPackageTemplateSchema))
  @ApiOperation({ summary: 'Create a package template' })
  async create(
    @GetAuthContext() auth: AuthContext,
    @Body() dto: CreatePackageTemplateDto,
  ): Promise<PackageTemplateResponse> {
    return this.templatesService.create({
      ...dto,
      agencyId: auth.agencyId,
      createdBy: auth.userId,
    })
  }

  /**
   * Update a package template
   * PATCH /templates/packages/:id
   *
   * Ownership check:
   * - Admins can update any template
   * - Users can only update templates they created
   * - Agency templates (createdBy = null) are read-only for non-admins
   */
  @Patch(':id')
  @UsePipes(zodValidation(updatePackageTemplateSchema))
  @ApiOperation({ summary: 'Update a package template' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  async update(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdatePackageTemplateDto
  ): Promise<PackageTemplateResponse> {
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
   * Soft delete a package template
   * DELETE /templates/packages/:id
   *
   * Ownership check:
   * - Admins can delete any template
   * - Users can only delete templates they created
   * - Agency templates (createdBy = null) are read-only for non-admins
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a package template' })
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
