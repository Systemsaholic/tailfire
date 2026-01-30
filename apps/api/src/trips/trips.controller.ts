/**
 * Trips Controller
 *
 * REST API endpoints for trip management.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { ApiTags } from '@nestjs/swagger'
import { TripsService } from './trips.service'
import { GetAuthContext } from '../auth/decorators/auth-context.decorator'
import type { AuthContext } from '../auth/auth.types'
import { ActivitiesService } from './activities.service'
import { ActivityLogsService } from '../activity-logs/activity-logs.service'
import { PaymentSchedulesService } from './payment-schedules.service'
import {
  CreateTripDto,
  UpdateTripDto,
  TripFilterDto,
  BulkDeleteTripsDto,
  BulkArchiveTripsDto,
  BulkChangeStatusDto,
  type BulkTripOperationResult,
  type TripFilterOptionsResponseDto,
} from './dto'
import type {
  TripResponseDto,
  PaginatedTripsResponseDto,
  TripBookingStatusResponseDto,
  PackageResponseDto,
  TripPackageTotalsDto,
  UnlinkedActivitiesResponseDto,
  TripExpectedPaymentDto,
  TripPaymentTransactionDto,
} from '../../../../packages/shared-types/src/api'

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly activitiesService: ActivitiesService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly paymentSchedulesService: PaymentSchedulesService,
  ) {}

  /**
   * Create a new trip
   * POST /trips
   */
  @Post()
  async create(
    @GetAuthContext() auth: AuthContext,
    @Body() createTripDto: CreateTripDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.create(createTripDto, auth.userId)
  }

  /**
   * Get all trips with filters
   * GET /trips?page=1&limit=20&status=draft&search=honeymoon
   */
  @Get()
  async findAll(@Query() filters: TripFilterDto): Promise<PaginatedTripsResponseDto> {
    return this.tripsService.findAll(filters)
  }

  // ============================================================================
  // BULK OPERATIONS
  // Must come before :id routes to avoid route conflicts
  // ============================================================================

  /**
   * Get filter options for trips
   * GET /trips/filter-options
   *
   * Returns available options for filter dropdowns (statuses, trip types, tags).
   */
  @Get('filter-options')
  async getFilterOptions(@GetAuthContext() auth: AuthContext): Promise<TripFilterOptionsResponseDto> {
    return this.tripsService.getFilterOptions(auth.userId, auth.agencyId)
  }

  /**
   * Bulk delete trips
   * POST /trips/bulk-delete
   *
   * Deletes multiple trips with per-item validation.
   * Only trips in 'draft' or 'quoted' status can be deleted.
   *
   * @returns Per-item success/failure with reasons
   */
  @Post('bulk-delete')
  async bulkDelete(@Body() dto: BulkDeleteTripsDto): Promise<BulkTripOperationResult> {
    // Phase 4 TODO: Extract from JWT when auth is implemented
    const ownerId = '00000000-0000-0000-0000-000000000001'
    return this.tripsService.bulkDelete(dto.tripIds, ownerId)
  }

  /**
   * Bulk archive/unarchive trips
   * POST /trips/bulk-archive
   *
   * Archives or unarchives multiple trips.
   * No status restriction - any trip can be archived.
   *
   * @returns Per-item success/failure with reasons
   */
  @Post('bulk-archive')
  async bulkArchive(@Body() dto: BulkArchiveTripsDto): Promise<BulkTripOperationResult> {
    // Phase 4 TODO: Extract from JWT when auth is implemented
    const ownerId = '00000000-0000-0000-0000-000000000001'
    return this.tripsService.bulkArchive(dto.tripIds, dto.archive, ownerId)
  }

  /**
   * Bulk change status of trips
   * POST /trips/bulk-status
   *
   * Changes status of multiple trips with transition validation.
   * Each trip's current status must allow the target transition.
   *
   * @returns Per-item success/failure with reasons
   */
  @Post('bulk-status')
  async bulkChangeStatus(@Body() dto: BulkChangeStatusDto): Promise<BulkTripOperationResult> {
    // Phase 4 TODO: Extract from JWT when auth is implemented
    const ownerId = '00000000-0000-0000-0000-000000000001'
    return this.tripsService.bulkChangeStatus(dto.tripIds, dto.status, ownerId)
  }

  // ============================================================================
  // SHARE / GROUP / DUPLICATE - Must come before :id catch-all
  // ============================================================================

  /**
   * Get shared trip by token (public, no auth)
   * GET /trips/share/:token
   */
  @Public()
  @Get('share/:token')
  async getSharedTrip(@Param('token') token: string) {
    return this.tripsService.findByShareToken(token)
  }

  /**
   * List trip groups for the agency
   * GET /trips/groups
   */
  @Get('groups')
  async listTripGroups(@GetAuthContext() auth: AuthContext) {
    return this.tripsService.listTripGroups(auth.agencyId)
  }

  /**
   * Create a trip group
   * POST /trips/groups
   */
  @Post('groups')
  async createTripGroup(
    @GetAuthContext() auth: AuthContext,
    @Body() body: { name: string },
  ) {
    return this.tripsService.createTripGroup(body.name, auth.agencyId, auth.userId)
  }

  /**
   * Update a trip group
   * PATCH /trips/groups/:groupId
   */
  @Patch('groups/:groupId')
  async updateTripGroup(
    @GetAuthContext() auth: AuthContext,
    @Param('groupId') groupId: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.tripsService.updateTripGroup(groupId, body, auth.agencyId, auth.userId)
  }

  /**
   * Delete a trip group
   * DELETE /trips/groups/:groupId
   */
  @Delete('groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTripGroup(
    @GetAuthContext() auth: AuthContext,
    @Param('groupId') groupId: string,
  ) {
    return this.tripsService.deleteTripGroup(groupId, auth.agencyId, auth.userId)
  }

  /**
   * List trips in a group
   * GET /trips/groups/:groupId/trips
   */
  @Get('groups/:groupId/trips')
  async getTripsByGroup(
    @GetAuthContext() auth: AuthContext,
    @Param('groupId') groupId: string,
  ) {
    return this.tripsService.getTripsByGroup(groupId, auth.agencyId)
  }

  /**
   * Publish a trip (generate share token)
   * PATCH /trips/:id/publish
   */
  @Patch(':id/publish')
  async publishTrip(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ) {
    if (auth.role !== 'admin') {
      const existing = await this.tripsService.findOne(id)
      if (existing.ownerId !== auth.userId) {
        throw new ForbiddenException('You can only publish trips you own')
      }
    }
    return this.tripsService.publishTrip(id, auth.userId)
  }

  /**
   * Unpublish a trip (clear share token)
   * PATCH /trips/:id/unpublish
   */
  @Patch(':id/unpublish')
  async unpublishTrip(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ) {
    if (auth.role !== 'admin') {
      const existing = await this.tripsService.findOne(id)
      if (existing.ownerId !== auth.userId) {
        throw new ForbiddenException('You can only unpublish trips you own')
      }
    }
    return this.tripsService.unpublishTrip(id, auth.userId)
  }

  /**
   * Duplicate a trip
   * POST /trips/:id/duplicate
   */
  @Post(':id/duplicate')
  async duplicateTrip(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.tripsService.duplicateTrip(id, auth.userId)
  }

  /**
   * Get booking status for all activities in a trip
   * GET /trips/:id/booking-status
   * IMPORTANT: Must come before @Get(':id') to avoid route conflicts
   *
   * Returns aggregated payment and commission status for the Bookings tab.
   */
  @Get(':id/booking-status')
  async getBookingStatus(
    @Param('id') id: string,
  ): Promise<TripBookingStatusResponseDto> {
    return this.tripsService.getBookingStatus(id)
  }

  /**
   * Get expected payment items for a trip (with activity context)
   * GET /trips/:id/expected-payments
   */
  @Get(':id/expected-payments')
  async getExpectedPayments(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<TripExpectedPaymentDto[]> {
    return this.paymentSchedulesService.getExpectedPaymentsByTripId(id, auth.agencyId)
  }

  /**
   * Get payment transactions for a trip (with activity context)
   * GET /trips/:id/payment-transactions
   */
  @Get(':id/payment-transactions')
  async getPaymentTransactions(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<TripPaymentTransactionDto[]> {
    return this.paymentSchedulesService.getTransactionsByTripId(id, auth.agencyId)
  }

  /**
   * Get activity log for a trip
   * GET /trips/:id/activity?limit=50&offset=0
   * IMPORTANT: Must come before @Get(':id') to avoid route conflicts
   */
  @Get(':id/activity')
  async getActivity(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const parsedLimit = limit ? Number(limit) : 50
    const parsedOffset = offset ? Number(offset) : 0
    return this.activityLogsService.getActivityForTrip(id, parsedLimit, parsedOffset)
  }

  /**
   * Get a single trip by ID
   * GET /trips/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TripResponseDto> {
    return this.tripsService.findOne(id)
  }

  /**
   * Update a trip
   * PATCH /trips/:id
   *
   * Ownership check: Admins can update any trip, users can only update their own.
   */
  @Patch(':id')
  async update(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
    @Body() updateTripDto: UpdateTripDto,
  ): Promise<TripResponseDto> {
    // Check ownership for non-admins
    if (auth.role !== 'admin') {
      const existing = await this.tripsService.findOne(id)
      if (existing.ownerId !== auth.userId) {
        throw new ForbiddenException('You can only update trips you own')
      }
    }
    return this.tripsService.update(id, updateTripDto)
  }

  /**
   * Delete a trip
   * DELETE /trips/:id
   *
   * Ownership check: Admins can delete any trip, users can only delete their own.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetAuthContext() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<void> {
    // Check ownership for non-admins
    if (auth.role !== 'admin') {
      const existing = await this.tripsService.findOne(id)
      if (existing.ownerId !== auth.userId) {
        throw new ForbiddenException('You can only delete trips you own')
      }
    }
    return this.tripsService.remove(id)
  }

  // ============================================================================
  // Trip-Scoped Package Endpoints
  // ============================================================================

  /**
   * Get all packages for a trip
   * GET /trips/:id/packages
   * Returns enriched package data including activityCount for expandable rows
   */
  @Get(':id/packages')
  async getPackages(@Param('id') tripId: string): Promise<PackageResponseDto[]> {
    return this.activitiesService.findPackagesByTrip(tripId)
  }

  /**
   * Get package totals for a trip
   * GET /trips/:id/packages/totals
   *
   * IMPORTANT: Must come after @Get(':id/packages') to avoid route conflicts
   */
  @Get(':id/packages/totals')
  async getPackageTotals(@Param('id') tripId: string): Promise<TripPackageTotalsDto> {
    return this.activitiesService.getTripPackageTotals(tripId)
  }

  /**
   * Get all unlinked activities for a trip (activities not in any package)
   * GET /trips/:id/unlinked-activities
   * @param itineraryId - Optional filter to get activities for a specific itinerary
   */
  @Get(':id/unlinked-activities')
  async getUnlinkedActivities(
    @Param('id') tripId: string,
    @Query('itineraryId') itineraryId?: string
  ): Promise<UnlinkedActivitiesResponseDto> {
    const activities = await this.activitiesService.findUnlinkedByTrip(tripId, itineraryId)
    return {
      activities: activities.map((a) => ({
        id: a.id,
        name: a.name,
        activityType: a.activityType,
        itineraryId: '', // Not returned by findUnlinkedByTrip - frontend doesn't use this
        itineraryDayId: a.itineraryDayId || '',
        dayNumber: null, // Would require additional query - frontend doesn't use this
        date: null, // Would require additional query - frontend doesn't use this
        sequenceOrder: a.sequenceOrder,
        totalPriceCents: a.pricing?.totalPriceCents ?? null,
        parentActivityId: a.parentActivityId,
      })),
      total: activities.length,
    }
  }
}
