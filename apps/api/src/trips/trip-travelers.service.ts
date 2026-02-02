/**
 * Trip Travelers Service
 *
 * Business logic for managing travelers on trips.
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { eq, and } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import { TravellerSplitsService } from '../financials/traveller-splits.service'
import { TripNotificationsService } from '../financials/trip-notifications.service'
import {
  TravelerCreatedEvent,
  TravelerUpdatedEvent,
  TravelerDeletedEvent,
  AuditEvent,
} from '../activity-logs/events'
import type {
  CreateTripTravelerDto,
  UpdateTripTravelerDto,
  TripTravelerFilterDto,
  TripTravelerResponseDto,
} from '../../../../packages/shared-types/src/api'

@Injectable()
export class TripTravelersService {
  private readonly logger = new Logger(TripTravelersService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly travellerSplitsService: TravellerSplitsService,
    private readonly tripNotificationsService: TripNotificationsService,
  ) {}

  /**
   * Add a traveler to a trip
   */
  async create(
    tripId: string,
    dto: CreateTripTravelerDto,
  ): Promise<TripTravelerResponseDto> {
    // Validate trip exists
    const [trip] = await this.db.client
      .select()
      .from(this.db.schema.trips)
      .where(eq(this.db.schema.trips.id, tripId))
      .limit(1)

    if (!trip) {
      throw new NotFoundException('Trip not found')
    }

    // Validate contactId if provided
    let contactSnapshotFromReference: Record<string, any> | undefined

    if ('contactId' in dto && dto.contactId) {
      const contact = await this.db.client
        .select()
        .from(this.db.schema.contacts)
        .where(eq(this.db.schema.contacts.id, dto.contactId))
        .limit(1)

      if (!contact.length || !contact[0]) {
        throw new NotFoundException('Contact not found')
      }

      contactSnapshotFromReference = this.mapContactToSnapshot(contact[0])
    }

    // Validate emergencyContactId if provided
    if (dto.emergencyContactId) {
      const emergencyContact = await this.db.client
        .select()
        .from(this.db.schema.contacts)
        .where(eq(this.db.schema.contacts.id, dto.emergencyContactId))
        .limit(1)

      if (!emergencyContact.length) {
        throw new NotFoundException('Emergency contact not found')
      }
    }

    // Ensure either contactId or contactSnapshot is provided
    const hasContactId = 'contactId' in dto && dto.contactId
    const hasContactSnapshot = 'contactSnapshot' in dto && dto.contactSnapshot

    if (!hasContactId && !hasContactSnapshot) {
      throw new BadRequestException('Either contactId or contactSnapshot must be provided')
    }

    // Auto-create a CRM Contact when traveler is created inline (snapshot only, no contactId)
    let autoCreatedContactId: string | undefined
    if (hasContactSnapshot && !hasContactId) {
      const snapshot = dto.contactSnapshot as Record<string, any>
      const [newContact] = await this.db.client
        .insert(this.db.schema.contacts)
        .values({
          agencyId: trip.agencyId,
          firstName: snapshot.firstName || null,
          lastName: snapshot.lastName || null,
          email: snapshot.email || null,
          phone: snapshot.phone || null,
          dateOfBirth: snapshot.dateOfBirth || null,
          gender: snapshot.gender || null,
          pronouns: snapshot.pronouns || null,
          passportNumber: snapshot.passportNumber || null,
          passportExpiry: snapshot.passportExpiry || null,
          passportCountry: snapshot.passportCountry || null,
          passportIssueDate: snapshot.passportIssueDate || null,
          nationality: snapshot.nationality || null,
          redressNumber: snapshot.redressNumber || null,
          knownTravelerNumber: snapshot.knownTravelerNumber || null,
          dietaryRequirements: snapshot.dietaryRequirements || null,
          mobilityRequirements: snapshot.mobilityRequirements || null,
          seatPreference: snapshot.seatPreference || null,
          cabinPreference: snapshot.cabinPreference || null,
          floorPreference: snapshot.floorPreference || null,
          contactType: 'lead',
        })
        .returning()

      autoCreatedContactId = newContact!.id
      this.logger.log(`[TripTravelersService] Auto-created CRM contact ${autoCreatedContactId} from inline traveler`)
    }

    // Validate primary_contact role uniqueness
    const role = dto.role || 'limited_access'
    if (role === 'primary_contact') {
      const existingPrimaryContact = await this.db.client
        .select()
        .from(this.db.schema.tripTravelers)
        .where(
          and(
            eq(this.db.schema.tripTravelers.tripId, tripId),
            eq(this.db.schema.tripTravelers.role, 'primary_contact')
          )
        )
        .limit(1)

      if (existingPrimaryContact.length > 0) {
        throw new BadRequestException(
          'This trip already has a primary contact. Only one traveler can have the primary_contact role per trip.'
        )
      }
    }

    const resolvedSnapshot =
      hasContactSnapshot ? dto.contactSnapshot : contactSnapshotFromReference

    // Use transaction to ensure atomicity when syncing primary contact
    const [traveler] = await this.db.client.transaction(async (tx) => {
      const [newTraveler] = await tx
        .insert(this.db.schema.tripTravelers)
        .values({
          tripId,
          contactId: hasContactId ? dto.contactId : autoCreatedContactId ?? undefined,
          contactSnapshot: resolvedSnapshot ?? null,
          role,
          isPrimaryTraveler: role === 'primary_contact', // Sync isPrimaryTraveler with role
          travelerType: dto.travelerType || 'adult',
          emergencyContactId: dto.emergencyContactId,
          emergencyContactInline: dto.emergencyContactInline,
          specialRequirements: dto.specialRequirements,
          sequenceOrder: dto.sequenceOrder || 0,
          snapshotUpdatedAt: new Date(),
        })
        .returning()

      // Sync trip's primary_contact_id when creating a traveler with primary_contact role
      const resolvedContactId = hasContactId ? dto.contactId : autoCreatedContactId
      if (role === 'primary_contact' && resolvedContactId) {
        await tx
          .update(this.db.schema.trips)
          .set({ primaryContactId: resolvedContactId })
          .where(eq(this.db.schema.trips.id, tripId))
      }

      return [newTraveler]
    })

    // Emit traveler created event
    const travelerName = resolvedSnapshot?.firstName && resolvedSnapshot?.lastName
      ? `${resolvedSnapshot.firstName} ${resolvedSnapshot.lastName}`
      : 'Traveler'

    this.logger.log('[TripTravelersService] About to emit traveler.created event:', {
      travelerId: traveler!.id,
      tripId,
      travelerName,
      role,
      travelerType: dto.travelerType || 'adult',
    })

    this.eventEmitter.emit(
      'traveler.created',
      new TravelerCreatedEvent(traveler!.id, tripId, travelerName, null, {
        role,
        travelerType: dto.travelerType || 'adult',
      }),
    )

    this.logger.log('[TripTravelersService] Event emitted successfully')

    return this.mapToResponseDto(traveler)
  }

  /**
   * Find all travelers with optional filters
   */
  async findAll(
    filters: TripTravelerFilterDto,
  ): Promise<TripTravelerResponseDto[]> {
    const conditions = []

    // If tripId filter is provided, validate it exists
    if (filters.tripId) {
      const [trip] = await this.db.client
        .select()
        .from(this.db.schema.trips)
        .where(eq(this.db.schema.trips.id, filters.tripId))
        .limit(1)

      if (!trip) {
        throw new NotFoundException('Trip not found')
      }

      conditions.push(eq(this.db.schema.tripTravelers.tripId, filters.tripId))
    }

    if (filters.contactId) {
      conditions.push(eq(this.db.schema.tripTravelers.contactId, filters.contactId))
    }

    if (filters.role) {
      conditions.push(eq(this.db.schema.tripTravelers.role, filters.role))
    }

    if (filters.isPrimaryTraveler !== undefined) {
      conditions.push(eq(this.db.schema.tripTravelers.isPrimaryTraveler, filters.isPrimaryTraveler))
    }

    if (filters.travelerType) {
      conditions.push(eq(this.db.schema.tripTravelers.travelerType, filters.travelerType))
    }

    const travelers = await this.db.client
      .select()
      .from(this.db.schema.tripTravelers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    return Promise.all(travelers.map((traveler) => this.mapToResponseDto(traveler)))
  }

  /**
   * Find one traveler by ID
   * Optionally validates the traveler belongs to a specific trip
   */
  async findOne(
    id: string,
    tripId?: string,
  ): Promise<TripTravelerResponseDto> {
    // First get the traveler
    const [traveler] = await this.db.client
      .select()
      .from(this.db.schema.tripTravelers)
      .where(eq(this.db.schema.tripTravelers.id, id))
      .limit(1)

    if (!traveler) {
      throw new NotFoundException(`Traveler with ID ${id} not found`)
    }

    // Validate trip exists
    const [trip] = await this.db.client
      .select()
      .from(this.db.schema.trips)
      .where(eq(this.db.schema.trips.id, traveler.tripId))
      .limit(1)

    if (!trip) {
      throw new NotFoundException(`Traveler with ID ${id} not found`)
    }

    // If tripId is provided, validate the traveler belongs to that specific trip
    if (tripId && traveler.tripId !== tripId) {
      throw new NotFoundException(
        `Traveler with ID ${id} does not belong to trip ${tripId}`,
      )
    }

    return this.mapToResponseDto(traveler)
  }

  /**
   * Update a traveler
   * Optionally validates the traveler belongs to a specific trip
   */
  async update(
    id: string,
    dto: UpdateTripTravelerDto,
    tripId?: string,
  ): Promise<TripTravelerResponseDto> {
    // First get the traveler to validate it exists and belongs to the trip
    const existingTraveler = await this.findOne(id, tripId)

    // Validate contactId if provided
    let contactSnapshotFromReference: Record<string, any> | undefined
    if (dto.contactId) {
      const contact = await this.db.client
        .select()
        .from(this.db.schema.contacts)
        .where(eq(this.db.schema.contacts.id, dto.contactId))
        .limit(1)

      if (!contact.length || !contact[0]) {
        throw new NotFoundException('Contact not found')
      }

      contactSnapshotFromReference = this.mapContactToSnapshot(contact[0])
    }

    // Validate emergencyContactId if provided
    if (dto.emergencyContactId) {
      const emergencyContact = await this.db.client
        .select()
        .from(this.db.schema.contacts)
        .where(eq(this.db.schema.contacts.id, dto.emergencyContactId))
        .limit(1)

      if (!emergencyContact.length) {
        throw new NotFoundException('Emergency contact not found')
      }
    }

    // Validate primary_contact role uniqueness if role is being changed
    if (dto.role && dto.role === 'primary_contact') {
      const existingPrimaryContact = await this.db.client
        .select()
        .from(this.db.schema.tripTravelers)
        .where(
          and(
            eq(this.db.schema.tripTravelers.tripId, existingTraveler.tripId),
            eq(this.db.schema.tripTravelers.role, 'primary_contact')
          )
        )
        .limit(1)

      // If there's already a primary contact and it's not this traveler, reject the update
      if (existingPrimaryContact.length > 0 && existingPrimaryContact[0]?.id !== id) {
        throw new BadRequestException(
          'This trip already has a primary contact. Only one traveler can have the primary_contact role per trip.'
        )
      }
    }

    // Prepare update data with role sync
    const updateData: Record<string, any> = {
      ...dto,
      updatedAt: new Date(),
    }

    // Sync isPrimaryTraveler with role if role is provided
    if (dto.role) {
      updateData.isPrimaryTraveler = dto.role === 'primary_contact'
    }

    if (dto.contactSnapshot) {
      updateData.contactSnapshot = dto.contactSnapshot
      updateData.snapshotUpdatedAt = new Date()
    } else if (contactSnapshotFromReference) {
      updateData.contactSnapshot = contactSnapshotFromReference
      updateData.snapshotUpdatedAt = new Date()
    }

    // Use transaction to ensure atomicity when syncing primary contact
    const [traveler] = await this.db.client.transaction(async (tx) => {
      const [updatedTraveler] = await tx
        .update(this.db.schema.tripTravelers)
        .set(updateData)
        .where(eq(this.db.schema.tripTravelers.id, id))
        .returning()

      if (!updatedTraveler) {
        throw new NotFoundException(`Traveler with ID ${id} not found`)
      }

      // Sync trip's primary_contact_id when updating to primary_contact role
      if (dto.role === 'primary_contact' && updatedTraveler.contactId) {
        await tx
          .update(this.db.schema.trips)
          .set({ primaryContactId: updatedTraveler.contactId })
          .where(eq(this.db.schema.trips.id, updatedTraveler.tripId))
      }

      // Clear trip's primary_contact_id if this traveler was primary and role is being changed
      if (existingTraveler.role === 'primary_contact' && dto.role && dto.role !== 'primary_contact') {
        await tx
          .update(this.db.schema.trips)
          .set({ primaryContactId: null })
          .where(eq(this.db.schema.trips.id, updatedTraveler.tripId))
      }

      return [updatedTraveler]
    })

    // Emit traveler updated event
    const snapshot = traveler.contactSnapshot as { firstName?: string; lastName?: string } | null
    const travelerName = snapshot?.firstName && snapshot?.lastName
      ? `${snapshot.firstName} ${snapshot.lastName}`
      : 'Traveler'

    this.eventEmitter.emit(
      'traveler.updated',
      new TravelerUpdatedEvent(traveler.id, traveler.tripId, travelerName, null, dto),
    )

    return this.mapToResponseDto(traveler)
  }

  /**
   * Remove a traveler from a trip
   * Optionally validates the traveler belongs to a specific trip
   * Also cleans up associated cost splits and triggers notifications
   */
  async remove(id: string, tripId?: string): Promise<void> {
    // Validate traveler exists (and belongs to specific trip if provided)
    const existingTraveler = await this.findOne(id, tripId)
    const actualTripId = existingTraveler.tripId

    // Capture group memberships before delete (cascade will remove them)
    const groupMemberships = await this.db.client
      .select({
        groupId: this.db.schema.travelerGroupMembers.travelerGroupId,
        groupName: this.db.schema.travelerGroups.name,
      })
      .from(this.db.schema.travelerGroupMembers)
      .leftJoin(
        this.db.schema.travelerGroups,
        eq(this.db.schema.travelerGroupMembers.travelerGroupId, this.db.schema.travelerGroups.id)
      )
      .where(eq(this.db.schema.travelerGroupMembers.tripTravelerId, id))

    // Use transaction to ensure atomicity when syncing primary contact
    await this.db.client.transaction(async (tx) => {
      const [traveler] = await tx
        .delete(this.db.schema.tripTravelers)
        .where(eq(this.db.schema.tripTravelers.id, id))
        .returning()

      if (!traveler) {
        throw new NotFoundException(`Traveler with ID ${id} not found`)
      }

      // Clear trip's primary_contact_id if removing the primary contact traveler
      if (existingTraveler.role === 'primary_contact') {
        await tx
          .update(this.db.schema.trips)
          .set({ primaryContactId: null })
          .where(eq(this.db.schema.trips.id, traveler.tripId))
      }

      // Emit traveler deleted event
      const snapshot = traveler.contactSnapshot as { firstName?: string; lastName?: string } | null
      const travelerName = snapshot?.firstName && snapshot?.lastName
        ? `${snapshot.firstName} ${snapshot.lastName}`
        : 'Traveler'

      this.eventEmitter.emit(
        'traveler.deleted',
        new TravelerDeletedEvent(traveler.id, traveler.tripId, travelerName, null),
      )

      // Emit audit events for cascaded group membership removals
      for (const membership of groupMemberships) {
        this.eventEmitter.emit(
          'audit.deleted',
          new AuditEvent(
            'trip_group',
            membership.groupId,
            'removed_from_group',
            traveler.tripId,
            null,
            `Removed ${travelerName} from group "${membership.groupName || 'Unknown'}"`,
            { travelerId: id, travelerName },
          ),
        )
      }
    })

    // Clean up the traveller's cost splits (outside transaction to handle separately)
    try {
      const { affectedActivityIds } = await this.travellerSplitsService.deleteTravellerSplits(
        actualTripId,
        id
      )

      // Create notification if there are affected activities that need split recalculation
      if (affectedActivityIds.length > 0) {
        const travelerName = existingTraveler.contactSnapshot?.firstName
          ? `${existingTraveler.contactSnapshot.firstName} ${existingTraveler.contactSnapshot.lastName || ''}`.trim()
          : 'A traveler'

        // Activity names not available here, pass IDs as names for now
        // The notification service will format the message appropriately
        await this.tripNotificationsService.createSplitRecalculationNotification(
          actualTripId,
          id, // travellerId
          travelerName,
          affectedActivityIds,
          affectedActivityIds // Use IDs as placeholder names (notification will truncate display)
        )

        this.logger.log(
          `Cleaned up ${affectedActivityIds.length} split(s) for removed traveler ${id} on trip ${actualTripId}`
        )
      }
    } catch (error) {
      // Log but don't fail the deletion - splits will be orphaned but trip remains consistent
      this.logger.error(
        `Failed to clean up splits for removed traveler ${id}: ${error}`
      )
    }
  }

  /**
   * Map database entity to response DTO
   * Populates the contact relation if contactId is present
   */
  /**
   * Get traveler snapshot (contact data as it was when added to trip)
   * Returns 404 if no snapshot exists
   */
  async getSnapshot(id: string, tripId: string) {
    const [traveler] = await this.db.client
      .select()
      .from(this.db.schema.tripTravelers)
      .where(
        and(
          eq(this.db.schema.tripTravelers.id, id),
          eq(this.db.schema.tripTravelers.tripId, tripId),
        ),
      )
      .limit(1)

    if (!traveler) {
      throw new NotFoundException('Traveler not found')
    }

    if (!traveler.contactSnapshot) {
      throw new NotFoundException('No snapshot available for this traveler')
    }

    // Return snapshot with timestamp
    return {
      ...traveler.contactSnapshot,
      snapshotAt: typeof traveler.updatedAt === 'string' ? traveler.updatedAt : traveler.updatedAt.toISOString(),
    }
  }

  /**
   * Reset traveler snapshot (update snapshot to current contact data)
   * Updates the contactSnapshot to match the current contact information
   */
  async resetSnapshot(id: string, tripId: string): Promise<TripTravelerResponseDto> {
    // First get the traveler to validate it exists and belongs to the trip
    const existingTraveler = await this.findOne(id, tripId)

    // Validate that the traveler has a contactId
    if (!existingTraveler.contactId) {
      throw new BadRequestException('Cannot reset snapshot: traveler has no associated contact')
    }

    // Get the current contact data
    const [contact] = await this.db.client
      .select()
      .from(this.db.schema.contacts)
      .where(eq(this.db.schema.contacts.id, existingTraveler.contactId))
      .limit(1)

    if (!contact) {
      throw new NotFoundException('Contact not found')
    }

    // Create new snapshot from current contact data
    const newSnapshot = this.mapContactToSnapshot(contact)

    // Update the traveler with the new snapshot
    const [traveler] = await this.db.client
      .update(this.db.schema.tripTravelers)
      .set({
        contactSnapshot: newSnapshot,
        snapshotUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.tripTravelers.id, id))
      .returning()

    if (!traveler) {
      throw new NotFoundException(`Traveler with ID ${id} not found`)
    }

    // Emit traveler updated event
    const travelerName = newSnapshot.firstName && newSnapshot.lastName
      ? `${newSnapshot.firstName} ${newSnapshot.lastName}`
      : 'Traveler'

    this.eventEmitter.emit(
      'traveler.updated',
      new TravelerUpdatedEvent(
        traveler.id,
        traveler.tripId,
        travelerName,
        null,
        { contactSnapshot: newSnapshot }
      ),
    )

    return this.mapToResponseDto(traveler)
  }

  private async mapToResponseDto(traveler: any): Promise<TripTravelerResponseDto> {
    let contact = undefined

    // Populate contact if contactId exists
    if (traveler.contactId) {
      const [foundContact] = await this.db.client
        .select()
        .from(this.db.schema.contacts)
        .where(eq(this.db.schema.contacts.id, traveler.contactId))
        .limit(1)

      if (foundContact) {
        // Add computed fields to match ContactResponseDto
        const displayName = foundContact.preferredName ?? foundContact.firstName ?? foundContact.legalFirstName ?? 'Unknown'
        const legalFullName = [
          foundContact.prefix,
          foundContact.legalFirstName ?? foundContact.firstName,
          foundContact.middleName,
          foundContact.legalLastName ?? foundContact.lastName,
          foundContact.suffix
        ].filter(Boolean).join(' ') || null

        contact = {
          ...foundContact,
          displayName,
          legalFullName,
        } as any
      }
    }

    // Compute snapshot staleness: compare snapshotUpdatedAt vs contact.updatedAt
    let isSnapshotStale = false
    if (contact && traveler.snapshotUpdatedAt) {
      const snapshotTime = typeof traveler.snapshotUpdatedAt === 'string'
        ? new Date(traveler.snapshotUpdatedAt)
        : traveler.snapshotUpdatedAt
      const contactTime = typeof contact.updatedAt === 'string'
        ? new Date(contact.updatedAt)
        : contact.updatedAt
      if (contactTime && snapshotTime && contactTime > snapshotTime) {
        isSnapshotStale = true
      }
    }

    const formatTs = (ts: any) => ts ? (typeof ts === 'string' ? ts : ts.toISOString()) : null

    return {
      id: traveler.id,
      tripId: traveler.tripId,
      contactId: traveler.contactId,
      contact,
      role: traveler.role,
      isPrimaryTraveler: traveler.isPrimaryTraveler,
      travelerType: traveler.travelerType,
      contactSnapshot: traveler.contactSnapshot,
      emergencyContactId: traveler.emergencyContactId,
      emergencyContactInline: traveler.emergencyContactInline,
      specialRequirements: traveler.specialRequirements,
      sequenceOrder: traveler.sequenceOrder,
      snapshotUpdatedAt: formatTs(traveler.snapshotUpdatedAt),
      contactDeletedAt: formatTs(traveler.contactDeletedAt),
      isSnapshotStale,
      createdAt: typeof traveler.createdAt === 'string' ? traveler.createdAt : traveler.createdAt.toISOString(),
      updatedAt: typeof traveler.updatedAt === 'string' ? traveler.updatedAt : traveler.updatedAt.toISOString(),
    }
  }

  private mapContactToSnapshot(
    contact: typeof this.db.schema.contacts.$inferSelect,
  ): Record<string, any> {
    const firstName =
      contact.firstName ??
      contact.legalFirstName ??
      contact.preferredName ??
      'Traveler'
    const lastName =
      contact.lastName ??
      contact.legalLastName ??
      contact.preferredName ??
      'Contact'

    return {
      // Basic name fields
      firstName,
      lastName,
      legalFirstName: contact.legalFirstName ?? undefined,
      legalLastName: contact.legalLastName ?? undefined,
      middleName: contact.middleName ?? undefined,
      preferredName: contact.preferredName ?? undefined,
      prefix: contact.prefix ?? undefined,
      suffix: contact.suffix ?? undefined,

      // Contact information
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,

      // Personal details
      dateOfBirth: contact.dateOfBirth
        ? contact.dateOfBirth.split('T')[0]
        : undefined,
      gender: contact.gender ?? undefined,
      pronouns: contact.pronouns ?? undefined,

      // Passport information
      passportNumber: contact.passportNumber ?? undefined,
      passportExpiry: contact.passportExpiry
        ? contact.passportExpiry.split('T')[0]
        : undefined,
      passportCountry: contact.passportCountry ?? undefined,
      passportIssueDate: contact.passportIssueDate
        ? contact.passportIssueDate.split('T')[0]
        : undefined,
      nationality: contact.nationality ?? undefined,

      // TSA Credentials
      redressNumber: contact.redressNumber ?? undefined,
      knownTravelerNumber: contact.knownTravelerNumber ?? undefined,

      // Special requirements
      dietaryRequirements: contact.dietaryRequirements ?? undefined,
      mobilityRequirements: contact.mobilityRequirements ?? undefined,

      // Travel preferences
      seatPreference: contact.seatPreference ?? undefined,
      cabinPreference: contact.cabinPreference ?? undefined,
      floorPreference: contact.floorPreference ?? undefined,
    }
  }
}
