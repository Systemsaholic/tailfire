/**
 * Booking Service
 *
 * High-level orchestration for cruise booking operations.
 * Coordinates FusionAPI calls with session management and database updates.
 *
 * This service is the main entry point for booking operations.
 */

import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { FusionApiService } from './fusion-api.service'
import { BookingSessionService, SessionInfo, BookingFlowType } from './booking-session.service'
import {
  CruiseSearchParams,
  CruiseSearchResult,
  RateCode,
  CabinGrade,
  CabinsResponse,
  BasketAddResult,
  BasketResult,
  BookingRequest,
  BookingResult,
} from '../types/fusion-api.types'

// Session expiry configuration
const SESSION_TTL_HOURS = 2

export interface SearchResult {
  sessionKey: string
  results: CruiseSearchResult[]
  meta: {
    totalResults: number
    page: number
    pageSize: number
  }
}

export interface AddToBasketParams {
  activityId: string
  userId: string
  tripId?: string
  tripTravelerId?: string
  flowType: BookingFlowType
  sessionKey: string // REQUIRED: Must reuse sessionKey from search step
  codetocruiseid: string
  resultno: number
  gradeno: number
  farecode: string
  cabinresult?: string
  cabinno?: string
}

export interface CompleteBookingParams {
  sessionId: string
  userId: string
  idempotencyKey: string
  passengers: BookingRequest['passengers']
  contact: BookingRequest['contact']
  allocation?: BookingRequest['allocation']
  payment?: BookingRequest['payment']
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name)

  constructor(
    private readonly fusionApi: FusionApiService,
    private readonly sessionService: BookingSessionService,
  ) {}

  // ============================================================================
  // Search Operations
  // ============================================================================

  /**
   * Search for cruises
   * Creates or reuses a session for subsequent operations
   */
  async searchCruises(
    params: CruiseSearchParams,
    existingSessionKey?: string
  ): Promise<SearchResult> {
    const sessionKey = existingSessionKey || randomUUID()

    const response = await this.fusionApi.searchCruises({
      ...params,
      sessionkey: sessionKey,
    })

    return {
      sessionKey: response.meta?.sessionkey || sessionKey,
      results: response.results || [],
      meta: {
        totalResults: response.meta?.totalresults || 0,
        page: response.meta?.page || 1,
        pageSize: response.meta?.pagesize || 20,
      },
    }
  }

  /**
   * Get rate codes for a cruise (agency-tailored fares)
   */
  async getRateCodes(
    sessionKey: string,
    codetocruiseid: string,
    resultno: number
  ): Promise<RateCode[]> {
    const response = await this.fusionApi.getRateCodes({
      sessionkey: sessionKey,
      codetocruiseid,
      resultno,
    })

    return response.results || []
  }

  /**
   * Get cabin grades/categories
   */
  async getCabinGrades(
    sessionKey: string,
    codetocruiseid: string,
    resultno: number,
    farecode?: string
  ): Promise<CabinGrade[]> {
    const response = await this.fusionApi.getCabinGrades({
      sessionkey: sessionKey,
      codetocruiseid,
      resultno,
      farecode,
    })

    return response.results || []
  }

  /**
   * Get specific cabins with deck plans
   */
  async getCabins(
    sessionKey: string,
    codetocruiseid: string,
    resultno: number,
    gradeno: number,
    farecode?: string
  ): Promise<CabinsResponse> {
    return this.fusionApi.getCabins({
      sessionkey: sessionKey,
      codetocruiseid,
      resultno,
      gradeno,
      farecode,
    })
  }

  // ============================================================================
  // Basket Operations
  // ============================================================================

  /**
   * Add a cabin to basket (puts cabin on hold)
   * Creates a booking session in the database
   */
  async addToBasket(params: AddToBasketParams): Promise<{
    session: SessionInfo
    basket: BasketAddResult
    holdExpiresAt?: Date
  }> {
    this.logger.log(`Adding cabin to basket for activity ${params.activityId}`)

    // CRITICAL: Reuse the sessionKey from search step to maintain FusionAPI session continuity
    // FusionAPI ties results (codetocruiseid, resultno) to the original session
    const sessionKey = params.sessionKey

    // Add to basket (this puts the cabin on hold)
    const basket = await this.fusionApi.addToBasket({
      sessionkey: sessionKey,
      codetocruiseid: params.codetocruiseid,
      resultno: params.resultno,
      gradeno: params.gradeno,
      farecode: params.farecode,
      cabinresult: params.cabinresult,
      cabinno: params.cabinno,
    })

    // Parse hold expiry time
    let holdExpiresAt: Date | undefined
    if (basket.holdcabin?.releasetime) {
      holdExpiresAt = new Date(basket.holdcabin.releasetime)
    }

    // Create database session
    const session = await this.sessionService.createSession({
      activityId: params.activityId,
      userId: params.userId,
      tripId: params.tripId,
      tripTravelerId: params.tripTravelerId,
      flowType: params.flowType,
      sessionKey: basket.sessionkey || sessionKey,
      sessionExpiresAt: new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000),
      codetocruiseid: params.codetocruiseid,
      resultNo: String(params.resultno),
    })

    // Update session with basket state
    await this.sessionService.updateSession(session.id, {
      fareCode: params.farecode,
      gradeNo: params.gradeno,
      cabinNo: params.cabinno,
      basketItemKey: basket.itemkey,
      cabinResult: params.cabinresult,
      holdExpiresAt,
    })

    // Get updated session
    const updatedSession = await this.sessionService.getSessionById(session.id)

    return {
      session: updatedSession!,
      basket,
      holdExpiresAt,
    }
  }

  /**
   * Get basket contents for a session
   */
  async getBasket(sessionId: string, userId: string): Promise<BasketResult & { session: SessionInfo }> {
    const session = await this.sessionService.validateSessionOwnership(sessionId, userId)

    // Extend session expiry
    await this.sessionService.extendSessionExpiry(sessionId)

    const basket = await this.fusionApi.getBasket(session.sessionKey)

    return {
      ...basket,
      session,
    }
  }

  /**
   * Remove item from basket
   */
  async removeFromBasket(
    sessionId: string,
    userId: string,
    itemkey: string
  ): Promise<void> {
    const session = await this.sessionService.validateSessionOwnership(sessionId, userId)

    await this.fusionApi.removeFromBasket(session.sessionKey, itemkey)

    // Update session
    await this.sessionService.updateSession(sessionId, {
      basketItemKey: undefined,
      holdExpiresAt: undefined,
    })
  }

  // ============================================================================
  // Booking Operations
  // ============================================================================

  /**
   * Complete a booking
   *
   * Uses idempotency key to prevent double-bookings on retry.
   * Flow:
   * 1. Check for existing booking with idempotency key
   * 2. Create pending idempotency record
   * 3. Submit booking to FusionAPI
   * 4. Update idempotency record with result
   * 5. Complete session and store booking reference
   */
  async completeBooking(params: CompleteBookingParams): Promise<BookingResult> {
    this.logger.log(`Completing booking for session ${params.sessionId}`)

    // 1. Check for existing booking with idempotency key
    const existing = await this.sessionService.findByIdempotencyKey(params.idempotencyKey)
    if (existing.found && existing.bookingRef) {
      this.logger.log(`Returning cached booking ${existing.bookingRef}`)
      return {
        success: true,
        bookingreference: existing.bookingRef,
        ...(existing.bookingResponse as object),
      }
    }

    // Validate session ownership
    const session = await this.sessionService.validateSessionOwnership(
      params.sessionId,
      params.userId
    )

    // Check hold status
    const holdStatus = this.sessionService.getHoldStatus(session)
    if (!holdStatus.isHeld) {
      throw new ConflictException(
        'Cabin hold has expired. Please re-select a cabin to continue.'
      )
    }

    if (holdStatus.isWarning) {
      this.logger.warn(
        `Cabin hold expires in ${holdStatus.remainingMinutes} minutes for session ${session.id}`
      )
    }

    // 2. Create pending idempotency record
    try {
      await this.sessionService.createIdempotencyRecord(
        params.idempotencyKey,
        session.activityId,
        params.userId
      )
    } catch (error: any) {
      // Unique constraint violation means another request is processing
      if (error.code === '23505') {
        throw new ConflictException(
          'Another booking request is in progress. Please wait and retry.'
        )
      }
      throw error
    }

    // 3. Submit booking to FusionAPI
    let bookingResult: BookingResult
    try {
      bookingResult = await this.fusionApi.createBooking({
        sessionkey: session.sessionKey,
        passengers: params.passengers,
        contact: params.contact,
        allocation: params.allocation,
        payment: params.payment,
      })
    } catch (error) {
      // 4a. Update idempotency record with failure
      const message = error instanceof Error ? error.message : 'Unknown error'
      await this.sessionService.updateIdempotencyRecord(
        params.idempotencyKey,
        false,
        undefined,
        { error: message }
      )
      throw error
    }

    // 4b. Update idempotency record with success
    await this.sessionService.updateIdempotencyRecord(
      params.idempotencyKey,
      bookingResult.success,
      bookingResult.bookingreference,
      bookingResult
    )

    // 5. Complete session and store booking reference
    // SECURITY: Pass userId for ownership verification before updating custom_cruise_details
    if (bookingResult.success && bookingResult.bookingreference) {
      await this.sessionService.completeSession(
        params.sessionId,
        bookingResult.bookingreference,
        params.userId
      )
    }

    return bookingResult
  }

  // ============================================================================
  // Handoff Operations
  // ============================================================================

  /**
   * Get proposal for client (agent's selection + hold countdown)
   */
  async getProposal(activityId: string, clientUserId: string): Promise<{
    session: SessionInfo
    basket: BasketResult
    holdStatus: ReturnType<BookingSessionService['getHoldStatus']>
  }> {
    // Verify handoff authorization
    const handoff = await this.sessionService.canHandoffSession(activityId, clientUserId)
    if (!handoff.allowed || !handoff.session) {
      throw new BadRequestException(handoff.reason || 'Not authorized')
    }

    const session = handoff.session

    // Get basket contents
    const basket = await this.fusionApi.getBasket(session.sessionKey)

    // Get hold status
    const holdStatus = this.sessionService.getHoldStatus(session)

    return {
      session,
      basket,
      holdStatus,
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Get active session for an activity
   */
  async getSession(activityId: string): Promise<SessionInfo | null> {
    return this.sessionService.getActiveSession(activityId)
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionService.validateSessionOwnership(sessionId, userId)

    // Try to release basket (best effort)
    if (session.basketItemKey) {
      try {
        await this.fusionApi.removeFromBasket(session.sessionKey, session.basketItemKey)
      } catch (error) {
        this.logger.warn(`Failed to release basket for session ${sessionId}:`, error)
      }
    }

    await this.sessionService.cancelSession(sessionId)
  }
}
