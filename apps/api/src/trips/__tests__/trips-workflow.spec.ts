/**
 * Integration Tests: Trips Workflow
 *
 * Tests the complete trip lifecycle including:
 * - Trip creation with status transitions
 * - Primary contact association and first booking date
 * - Reference number immutability after leaving draft
 * - Contact status updates when trip is booked
 * - Full lifecycle: draft → quoted → booked → in_progress → completed
 */

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { TripsModule } from '../trips.module'
import { ContactsModule } from '../../contacts/contacts.module'
import { DatabaseModule } from '../../db/database.module'
import { ConfigModule } from '@nestjs/config'
import { EncryptionModule } from '../../common/encryption'
import { DatabaseService } from '../../db/database.service'
import { ContactsService } from '../../contacts/contacts.service'
import { TripsService } from '../trips.service'
import { eq } from 'drizzle-orm'
import { schema } from '@tailfire/database'

const { contacts } = schema

// Helper to wait for async events to process
// NestJS EventEmitter v3+ processes events asynchronously.
// 500ms provides margin for first-test initialization overhead
const waitForEvents = () => new Promise(resolve => setTimeout(resolve, 500))

describe('Trips Workflow (Integration)', () => {
  let app: INestApplication
  let dbService: DatabaseService
  let contactsService: ContactsService
  let tripsService: TripsService
  let testContactId: string
  let testOwnerId: string

  const getDb = () => dbService.db

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        EventEmitterModule.forRoot(),
        DatabaseModule,
        EncryptionModule,
        ContactsModule,
        TripsModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    dbService = moduleFixture.get<DatabaseService>(DatabaseService)
    contactsService = moduleFixture.get<ContactsService>(ContactsService)
    tripsService = moduleFixture.get<TripsService>(TripsService)

    const db = getDb()

    // Create test contact
    const [contact] = await db
      .insert(contacts)
      .values({
        firstName: 'Workflow',
        lastName: 'Tester',
        email: `workflow-test-${Date.now()}@example.com`,
      })
      .returning()

    if (!contact) throw new Error('Failed to create test contact')
    testContactId = contact.id
    testOwnerId = contact.id
  })

  afterAll(async () => {
    if (testContactId) {
      const db = getDb()
      await db.delete(contacts).where(eq(contacts.id, testContactId))
    }
    await app.close()
  })

  beforeEach(async () => {
    // Wait for any pending async events from previous tests to complete
    // This prevents event handler race conditions between tests
    await waitForEvents()

    // NOTE: Do NOT truncate tables - this destroys production/dev data!
    // Tests should create their own data and clean up after themselves.
    // TODO: Refactor this test to use per-test trip creation and cleanup
    const db = getDb()

    // Reset test contact's first booking date to null for isolated tests
    await db
      .update(contacts)
      .set({ firstBookingDate: null })
      .where(eq(contacts.id, testContactId))
  })

  describe('Trip Creation and Primary Contact', () => {
    it('should create trip with primary contact and NOT set first booking date (draft)', async () => {
      // Create trip in draft status
      const trip = await tripsService.create(
        {
          name: 'Test Trip',
          tripType: 'leisure',
          primaryContactId: testContactId,
          startDate: '2025-06-01',
          endDate: '2025-06-15',
        },
        testOwnerId
      )

      expect(trip).toBeDefined()
      expect(trip.status).toBe('draft')
      expect(trip.primaryContactId).toBe(testContactId)
      expect(trip.referenceNumber).toMatch(/^FIT-\d{4}-\d{6}$/)

      // Check contact - first booking date should NOT be set (still draft)
      const contact = await contactsService.findOneInternal(testContactId)
      expect(contact.firstBookingDate).toBeNull()
    })

    it('should create trip as "booked" and set first booking date on contact', async () => {
      // Create trip directly as booked
      const trip = await tripsService.create(
        {
          name: 'Booked Trip',
          tripType: 'leisure',
          primaryContactId: testContactId,
          startDate: '2025-07-01',
          endDate: '2025-07-15',
          status: 'booked',
        },
        testOwnerId
      )

      expect(trip).toBeDefined()
      expect(trip.status).toBe('booked')
      expect(trip.bookingDate).toBeDefined()

      // Wait for event to process
      await waitForEvents()

      // Check contact - first booking date SHOULD be set
      const contact = await contactsService.findOneInternal(testContactId)
      expect(contact.firstBookingDate).toBeDefined()
      expect(contact.firstBookingDate).toBe(trip.bookingDate)
    })
  })

  describe('Status Transitions and Booking Date', () => {
    it('should set first booking date when transitioning from draft → booked', async () => {
      // Create as draft
      const trip = await tripsService.create(
        {
          name: 'Draft to Booked',
          tripType: 'leisure',
          primaryContactId: testContactId,
          startDate: '2025-08-01',
          endDate: '2025-08-15',
        },
        testOwnerId
      )

      expect(trip.status).toBe('draft')

      // Verify contact has no first booking date yet
      let contact = await contactsService.findOneInternal(testContactId)
      expect(contact.firstBookingDate).toBeNull()

      // Transition to booked
      const bookedTrip = await tripsService.update(trip.id, {
        status: 'booked',
      })

      expect(bookedTrip.status).toBe('booked')
      expect(bookedTrip.bookingDate).toBeDefined()

      // Wait for event to process
      await waitForEvents()

      // Check contact - first booking date should now be set
      contact = await contactsService.findOneInternal(testContactId)
      expect(contact.firstBookingDate).toBeDefined()
      expect(contact.firstBookingDate).toBe(bookedTrip.bookingDate)
    })

    /**
     * Regression test: firstBookingDate format must be YYYY-MM-DD
     *
     * Previously, setFirstBookingDate stored full ISO timestamps (e.g., 2025-01-15T10:30:00.000Z)
     * but trip.bookingDate is stored as date-only (YYYY-MM-DD). This caused equality checks to fail.
     *
     * The fix in contacts.service.ts uses date.toISOString().split('T')[0] to ensure
     * firstBookingDate is stored as YYYY-MM-DD format, matching trip.bookingDate.
     */
    it('should store firstBookingDate in YYYY-MM-DD format (regression)', async () => {
      // Create trip as booked
      const trip = await tripsService.create(
        {
          name: 'Date Format Regression Test',
          tripType: 'leisure',
          primaryContactId: testContactId,
          status: 'booked',
          startDate: '2025-12-15',
          endDate: '2025-12-25',
        },
        testOwnerId
      )

      expect(trip.status).toBe('booked')
      expect(trip.bookingDate).toBeDefined()

      // Wait for event to process
      await waitForEvents()

      // Check contact's firstBookingDate format
      const contact = await contactsService.findOneInternal(testContactId)
      expect(contact.firstBookingDate).toBeDefined()

      // Verify YYYY-MM-DD format (no timestamp component)
      expect(contact.firstBookingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      // Verify it matches trip.bookingDate exactly (both should be YYYY-MM-DD)
      expect(contact.firstBookingDate).toBe(trip.bookingDate)
    })

    it('should NOT change first booking date on subsequent bookings', async () => {
      // Create first booked trip
      await tripsService.create(
        {
          name: 'First Booking',
          tripType: 'leisure',
          primaryContactId: testContactId,
          status: 'booked',
          startDate: '2025-09-01',
          endDate: '2025-09-15',
        },
        testOwnerId
      )

      // Wait for first event to process
      await waitForEvents()

      const contact1 = await contactsService.findOneInternal(testContactId)
      const firstBookingDate = contact1.firstBookingDate

      expect(firstBookingDate).toBeDefined()

      // Create second booked trip (later date)
      await tripsService.create(
        {
          name: 'Second Booking',
          tripType: 'group',
          primaryContactId: testContactId,
          status: 'booked',
          startDate: '2025-10-01',
          endDate: '2025-10-15',
        },
        testOwnerId
      )

      // Wait for second event to process
      await waitForEvents()

      // First booking date should remain unchanged
      const contact2 = await contactsService.findOneInternal(testContactId)
      expect(contact2.firstBookingDate).toBe(firstBookingDate)
    })
  })

  describe('Reference Number Immutability', () => {
    it('should lock reference number after leaving draft status', async () => {
      // Create as draft with leisure type (FIT prefix)
      const trip = await tripsService.create(
        {
          name: 'Reference Lock Test',
          tripType: 'leisure',
          primaryContactId: testContactId,
          startDate: '2025-11-01',
          endDate: '2025-11-15',
        },
        testOwnerId
      )

      const draftRef = trip.referenceNumber
      expect(draftRef).toContain('FIT-')

      // Transition to quoted
      const quotedTrip = await tripsService.update(trip.id, {
        status: 'quoted',
      })

      expect(quotedTrip.referenceNumber).toBe(draftRef)

      // Try to change trip type - reference should NOT regenerate
      const updatedTrip = await tripsService.update(trip.id, {
        tripType: 'group',
      })

      expect(updatedTrip.tripType).toBe('group')
      expect(updatedTrip.referenceNumber).toBe(draftRef) // Still FIT prefix
    })
  })

  describe('Full Lifecycle Workflow', () => {
    it('should complete full trip lifecycle: draft → quoted → booked → in_progress → completed', async () => {
      // Step 1: Create draft trip
      const draftTrip = await tripsService.create(
        {
          name: 'Full Lifecycle Trip',
          tripType: 'leisure',
          primaryContactId: testContactId,
          startDate: '2025-12-01',
          endDate: '2025-12-15',
        },
        testOwnerId
      )

      expect(draftTrip.status).toBe('draft')
      const referenceNumber = draftTrip.referenceNumber

      // Step 2: Transition to quoted
      const quotedTrip = await tripsService.update(draftTrip.id, {
        status: 'quoted',
      })

      expect(quotedTrip.status).toBe('quoted')
      expect(quotedTrip.referenceNumber).toBe(referenceNumber)

      // Step 3: Transition to booked
      const bookedTrip = await tripsService.update(quotedTrip.id, {
        status: 'booked',
      })

      expect(bookedTrip.status).toBe('booked')
      expect(bookedTrip.bookingDate).toBeDefined()
      expect(bookedTrip.referenceNumber).toBe(referenceNumber)

      // Wait for event to process
      await waitForEvents()

      // Verify first booking date was set on contact
      const contactAfterBooking = await contactsService.findOneInternal(testContactId)
      expect(contactAfterBooking.firstBookingDate).toBe(bookedTrip.bookingDate)

      // Step 4: Transition to in_progress
      const inProgressTrip = await tripsService.update(bookedTrip.id, {
        status: 'in_progress',
      })

      expect(inProgressTrip.status).toBe('in_progress')
      expect(inProgressTrip.referenceNumber).toBe(referenceNumber)

      // Step 5: Transition to completed
      const completedTrip = await tripsService.update(inProgressTrip.id, {
        status: 'completed',
      })

      expect(completedTrip.status).toBe('completed')
      expect(completedTrip.referenceNumber).toBe(referenceNumber)

      // Final verification
      expect(completedTrip.id).toBe(draftTrip.id)
      expect(completedTrip.name).toBe('Full Lifecycle Trip')
      expect(completedTrip.primaryContactId).toBe(testContactId)
    })

    it('should allow cancellation at any non-terminal stage', async () => {
      // Create and transition to booked
      const trip = await tripsService.create(
        {
          name: 'Cancellation Test',
          tripType: 'leisure',
          primaryContactId: testContactId,
          status: 'booked',
          startDate: '2026-01-01',
          endDate: '2026-01-15',
        },
        testOwnerId
      )

      expect(trip.status).toBe('booked')

      // Cancel the trip
      const cancelledTrip = await tripsService.update(trip.id, {
        status: 'cancelled',
      })

      expect(cancelledTrip.status).toBe('cancelled')

      // Cancelled is terminal - cannot transition to other states
      await expect(
        tripsService.update(cancelledTrip.id, { status: 'completed' })
      ).rejects.toThrow()
    })
  })

  describe('Invalid State Transitions', () => {
    it('should reject invalid transition: draft → in_progress', async () => {
      const trip = await tripsService.create(
        {
          name: 'Invalid Transition Test',
          tripType: 'leisure',
          primaryContactId: testContactId,
          startDate: '2026-02-01',
          endDate: '2026-02-15',
        },
        testOwnerId
      )

      expect(trip.status).toBe('draft')

      // Try invalid transition
      await expect(
        tripsService.update(trip.id, { status: 'in_progress' })
      ).rejects.toThrow(/cannot transition/i)
    })

    it('should reject invalid transition: booked → draft', async () => {
      const trip = await tripsService.create(
        {
          name: 'Booked to Draft Test',
          tripType: 'leisure',
          primaryContactId: testContactId,
          status: 'booked',
          startDate: '2026-03-01',
          endDate: '2026-03-15',
        },
        testOwnerId
      )

      expect(trip.status).toBe('booked')

      // Try invalid transition
      await expect(
        tripsService.update(trip.id, { status: 'draft' })
      ).rejects.toThrow(/cannot transition/i)
    })

    it('should reject any transition from completed (terminal state)', async () => {
      const trip = await tripsService.create(
        {
          name: 'Terminal State Test',
          tripType: 'leisure',
          primaryContactId: testContactId,
          status: 'booked',
          startDate: '2026-04-01',
          endDate: '2026-04-15',
        },
        testOwnerId
      )

      // Complete the trip
      const completedTrip = await tripsService.update(trip.id, {
        status: 'completed',
      })

      expect(completedTrip.status).toBe('completed')

      // Try to transition from completed to anything else
      await expect(
        tripsService.update(completedTrip.id, { status: 'in_progress' })
      ).rejects.toThrow(/cannot transition/i)

      await expect(
        tripsService.update(completedTrip.id, { status: 'cancelled' })
      ).rejects.toThrow(/cannot transition/i)
    })
  })
})
