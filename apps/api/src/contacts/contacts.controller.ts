/**
 * Contacts Controller
 *
 * REST API endpoints for Contact management.
 * Implements limited view for non-owner access per auth plan.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ContactsService } from './contacts.service'
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterDto,
} from './dto'
import type {
  ContactResponseDto,
  PaginatedContactsResponseDto,
} from '../../../../packages/shared-types/src/api'
import { GetAuthContext } from '../auth/decorators/auth-context.decorator'
import type { AuthContext } from '../auth/auth.types'

/**
 * Sensitive fields to strip for non-owner access.
 * Limited view = Name, Email, Phone, Address only.
 */
const SENSITIVE_FIELDS = [
  'passportNumber',
  'passportExpiry',
  'passportCountry',
  'passportIssueDate',
  'nationality',
  'redressNumber',
  'knownTravelerNumber',
  'dateOfBirth',
  'dietaryRequirements',
  'mobilityRequirements',
  'trustBalanceCad',
  'trustBalanceUsd',
  'marketingEmailOptIn',
  'marketingEmailOptInAt',
  'marketingSmsOptIn',
  'marketingSmsOptInAt',
  'marketingPhoneOptIn',
  'marketingPhoneOptInAt',
  'marketingOptInSource',
  'marketingOptOutAt',
  'marketingOptOutReason',
] as const

/**
 * Apply limited view filter - strips sensitive fields for non-owners
 */
function applyLimitedView(
  contact: ContactResponseDto,
  auth: AuthContext
): ContactResponseDto {
  // Admins and owners get full access
  if (auth.role === 'admin' || contact.ownerId === auth.userId) {
    return contact
  }

  // Non-owners get limited view - strip sensitive fields
  const filtered = { ...contact }
  for (const field of SENSITIVE_FIELDS) {
    if (field in filtered) {
      ;(filtered as Record<string, unknown>)[field] = null
    }
  }
  return filtered
}

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  /**
   * Create a new contact
   * POST /contacts
   * - Admins can create agency-wide contacts (null owner_id)
   * - Users must create contacts they own
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetAuthContext() auth: AuthContext,
    @Body() dto: CreateContactDto
  ): Promise<ContactResponseDto> {
    // Users must set themselves as owner
    if (auth.role !== 'admin' && !dto.ownerId) {
      dto.ownerId = auth.userId
    }
    // Users cannot create agency-wide contacts (null owner)
    if (auth.role !== 'admin' && dto.ownerId !== auth.userId) {
      throw new ForbiddenException('Users can only create contacts they own')
    }
    return this.contactsService.create(dto, auth.agencyId)
  }

  /**
   * Get all contacts with filtering and pagination
   * GET /contacts?page=1&limit=20&search=john&isActive=true
   * Applies limited view filter for non-owners
   */
  @Get()
  async findAll(
    @GetAuthContext() auth: AuthContext,
    @Query() filters: ContactFilterDto
  ): Promise<PaginatedContactsResponseDto> {
    const result = await this.contactsService.findAll(filters, auth.agencyId)
    // Apply limited view filter to each contact
    return {
      ...result,
      data: result.data.map((contact) => applyLimitedView(contact, auth)),
    }
  }

  /**
   * Get trips associated with a contact
   * GET /contacts/:id/trips
   */
  @Get(':id/trips')
  async getTrips(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.contactsService.getTripsForContact(id, auth.agencyId)
  }

  /**
   * Get a single contact by ID
   * GET /contacts/:id
   * Applies limited view filter for non-owners
   */
  @Get(':id')
  async findOne(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string
  ): Promise<ContactResponseDto> {
    const contact = await this.contactsService.findOne(id, auth.agencyId)
    return applyLimitedView(contact, auth)
  }

  /**
   * Update a contact
   * PUT /contacts/:id
   * - Admins can update any contact
   * - Users can only update contacts they own
   */
  @Put(':id')
  async update(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    // Check ownership for non-admins
    if (auth.role !== 'admin') {
      const existing = await this.contactsService.findOne(id, auth.agencyId)
      if (existing.ownerId !== auth.userId) {
        throw new ForbiddenException('You can only update contacts you own')
      }
    }
    return this.contactsService.update(id, dto, auth.agencyId)
  }

  /**
   * Soft delete a contact
   * DELETE /contacts/:id
   * - Admins can delete any contact
   * - Users can only delete contacts they own
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string
  ): Promise<void> {
    // Check ownership for non-admins
    if (auth.role !== 'admin') {
      const existing = await this.contactsService.findOne(id, auth.agencyId)
      if (existing.ownerId !== auth.userId) {
        throw new ForbiddenException('You can only delete contacts you own')
      }
    }
    return this.contactsService.remove(id, auth.agencyId)
  }

  /**
   * Hard delete a contact (permanent)
   * DELETE /contacts/:id/permanent
   * - Admins can delete any contact
   * - Users can only delete contacts they own
   */
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string
  ): Promise<void> {
    // Check ownership for non-admins
    if (auth.role !== 'admin') {
      const existing = await this.contactsService.findOne(id, auth.agencyId)
      if (existing.ownerId !== auth.userId) {
        throw new ForbiddenException('You can only delete contacts you own')
      }
    }
    return this.contactsService.hardDelete(id, auth.agencyId)
  }

  /**
   * Promote a lead to client
   * POST /contacts/:id/promote-to-client
   */
  @Post(':id/promote-to-client')
  async promoteToClient(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<ContactResponseDto> {
    return this.contactsService.promoteToClient(id, auth.agencyId)
  }

  /**
   * Update contact status
   * PATCH /contacts/:id/status
   */
  @Patch(':id/status')
  async updateStatus(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: { status: string },
  ): Promise<ContactResponseDto> {
    return this.contactsService.updateStatus(id, dto.status, auth.agencyId)
  }

  /**
   * Update marketing consent
   * PATCH /contacts/:id/marketing-consent
   */
  @Patch(':id/marketing-consent')
  async updateMarketingConsent(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: any,
  ): Promise<ContactResponseDto> {
    return this.contactsService.updateMarketingConsent(id, dto, auth.agencyId)
  }
}
