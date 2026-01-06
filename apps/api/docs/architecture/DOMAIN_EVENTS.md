# Domain Events Architecture

**Last Updated:** 2025-11-14
**Status:** Implemented
**Scope:** Backend API Service Layer

---

## Table of Contents

1. [Overview](#overview)
2. [Why Domain Events?](#why-domain-events)
3. [Architecture](#architecture)
4. [Implementation Guide](#implementation-guide)
5. [Current Events](#current-events)
6. [Best Practices](#best-practices)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Domain events are a pattern for decoupling services by using an event-driven architecture. Instead of Service A directly calling methods on Service B, Service A emits an event that Service B listens to and reacts accordingly.

**Key Benefits:**
- Eliminates circular dependencies between modules
- Reduces coupling between services
- Makes side effects explicit and traceable
- Enables async processing and eventual consistency
- Improves testability and modularity

**Technology Stack:**
- **Event Emitter:** `@nestjs/event-emitter` (built on Node.js EventEmitter2)
- **Pattern:** In-process, synchronous-by-default event pub/sub
- **Async Support:** Event handlers run asynchronously via Promise.all()

---

## Why Domain Events?

### Problem: Circular Dependencies

Before implementing domain events, we had a circular dependency:

```
TripsModule → imports ContactsModule
  └─ TripsService → injects ContactsService
                      └─ calls setFirstBookingDate()

ContactsModule → imports TripsModule (potential future need)
```

This creates:
- **Tight coupling:** TripsService knows implementation details of ContactsService
- **Import cycles:** Modules depend on each other
- **Testing complexity:** Can't test TripsService without mocking ContactsService
- **Maintenance risk:** Changes in ContactsService affect TripsService

### Solution: Event-Driven Architecture

```
TripsService → emits "trip.booked" event
                  ↓
              EventEmitter2
                  ↓
ContactsService → listens for "trip.booked"
                → updates firstBookingDate independently
```

Benefits:
- **No direct dependency:** TripsService doesn't know ContactsService exists
- **No import cycle:** TripsModule doesn't import ContactsModule
- **Decoupled logic:** Contact updates are a side effect, not core trip logic
- **Easy testing:** Test event emission separately from event handling

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    app.module.ts                        │
│  EventEmitterModule.forRoot()  ← Global Configuration   │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │                               │
    ┌───────▼────────┐              ┌──────▼──────┐
    │  TripsService  │              │ ContactsSrv │
    │                │              │             │
    │  - create()    │              │ @OnEvent    │
    │  - update()    │              │ ('trip.    │
    │                │              │  booked')   │
    │ emit(          │              │             │
    │  TripBooked    │──────────────▶ handle      │
    │  Event)        │   Event      │ TripBooked()│
    └────────────────┘              └─────────────┘
```

### Event Flow

1. **Trigger:** Business operation occurs (e.g., trip status → 'booked')
2. **Emit:** Service creates event object and emits via EventEmitter2
3. **Propagate:** EventEmitter2 notifies all registered listeners
4. **Handle:** Event listeners execute their business logic
5. **Complete:** Original operation returns to caller

**Important:** Event handlers run asynchronously but are awaited by EventEmitter2, so errors in handlers will affect the original operation.

---

## Implementation Guide

### Step 1: Define the Event Class

Create a plain TypeScript class in `src/{module}/events/`:

```typescript
// src/trips/events/trip-booked.event.ts

/**
 * Domain Event: Trip Booked
 *
 * Emitted when a trip transitions to 'booked' status.
 */
export class TripBookedEvent {
  constructor(
    public readonly tripId: string,
    public readonly primaryContactId: string | null,
    public readonly bookingDate: string,
  ) {}
}
```

**Guidelines:**
- Use descriptive past-tense names (TripBookedEvent, not BookTripEvent)
- Make all properties `readonly` to prevent mutation
- Include all data needed by listeners (avoid forcing DB lookups)
- Keep it simple - just a data container, no logic

### Step 2: Emit the Event

In your service, inject EventEmitter2 and emit the event:

```typescript
// src/trips/trips.service.ts

import { EventEmitter2 } from '@nestjs/event-emitter'
import { TripBookedEvent } from './events/trip-booked.event'

@Injectable()
export class TripsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2, // ← Inject
  ) {}

  async update(id: string, dto: UpdateTripDto): Promise<TripResponseDto> {
    // ... business logic ...

    const isTransitioningToBooked =
      dto.status === 'booked' && existingTrip.status !== 'booked'

    const [trip] = await this.db.client
      .update(this.db.schema.trips)
      .set({ ...dto, bookingDate })
      .where(eq(this.db.schema.trips.id, id))
      .returning()

    // Emit event if booking occurred
    if (isTransitioningToBooked && trip.primaryContactId && bookingDate) {
      this.eventEmitter.emit(
        'trip.booked',  // ← Event name (string)
        new TripBookedEvent(trip.id, trip.primaryContactId, bookingDate)
      )
    }

    return this.mapToResponseDto(trip)
  }
}
```

**Guidelines:**
- Emit AFTER the database transaction succeeds
- Use dot-notation for event names: `{domain}.{action}`
- Only emit when the event actually occurred (check conditions)
- Pass complete event object with all necessary data

### Step 3: Listen for the Event

In the listening service, use `@OnEvent` decorator:

```typescript
// src/contacts/contacts.service.ts

import { OnEvent } from '@nestjs/event-emitter'
import { TripBookedEvent } from '../trips/events/trip-booked.event'

@Injectable()
export class ContactsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Event Listener: Handle TripBookedEvent
   *
   * When a trip is booked, set the contact's first booking date
   * if not already set.
   */
  @OnEvent('trip.booked')  // ← Same event name
  async handleTripBooked(event: TripBookedEvent): Promise<void> {
    if (!event.primaryContactId) {
      return
    }

    // Check if first booking date already set
    const [contact] = await this.db.client
      .select()
      .from(this.db.schema.contacts)
      .where(eq(this.db.schema.contacts.id, event.primaryContactId))
      .limit(1)

    if (!contact || contact.firstBookingDate) {
      return  // Already set, skip
    }

    // Set first booking date
    await this.setFirstBookingDate(
      event.primaryContactId,
      new Date(event.bookingDate),
    )
  }
}
```

**Guidelines:**
- Use descriptive handler method names: `handle{EventName}`
- Make handlers idempotent (safe to run multiple times)
- Handle null/undefined event properties gracefully
- Use early returns for invalid states
- Keep handlers focused on a single responsibility

### Step 4: Update Module Configuration

Ensure EventEmitterModule is imported globally in `app.module.ts`:

```typescript
// src/app.module.ts

import { EventEmitterModule } from '@nestjs/event-emitter'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),  // ← Enable event emitter globally
    DatabaseModule,
    ContactsModule,
    TripsModule,
  ],
})
export class AppModule {}
```

**Important:** The emitting module (TripsModule) no longer needs to import the listening module (ContactsModule). The event emitter handles the connection.

---

## Current Events

### TripBookedEvent

**Location:** `src/trips/events/trip-booked.event.ts`

**Emitted When:** A trip transitions to 'booked' status (either on create or update)

**Emitted By:** `TripsService.create()`, `TripsService.update()`

**Listened By:** `ContactsService.handleTripBooked()`

**Purpose:** Allows ContactsService to set the contact's `firstBookingDate` without TripsService directly calling ContactsService.

**Payload:**
```typescript
{
  tripId: string              // ID of the trip that was booked
  primaryContactId: string    // ID of the primary contact on the trip
  bookingDate: string         // Date the trip was booked (YYYY-MM-DD)
}
```

**Business Rules:**
- Only emitted when status transitions TO 'booked' (not already booked)
- Only emitted if primaryContactId exists
- Only emitted if bookingDate exists
- ContactsService only sets firstBookingDate if not already set

---

## Best Practices

### Event Naming

Use past-tense, domain-scoped event names:

```typescript
// ✅ Good
'trip.booked'
'contact.created'
'payment.processed'
'email.sent'

// ❌ Bad
'book-trip'           // Imperative, not past-tense
'tripBooked'          // Missing domain scope
'trip_booked'         // Use dots, not underscores
'TripBookedEvent'     // Class name, not event name
```

### Event Classes

Keep event classes simple data containers:

```typescript
// ✅ Good
export class TripBookedEvent {
  constructor(
    public readonly tripId: string,
    public readonly primaryContactId: string | null,
    public readonly bookingDate: string,
  ) {}
}

// ❌ Bad - has business logic
export class TripBookedEvent {
  constructor(public trip: Trip) {}

  get isFirstBooking(): boolean {
    // Business logic doesn't belong in events
    return this.trip.status === 'booked'
  }
}
```

### Event Handlers

Make handlers idempotent and defensive:

```typescript
// ✅ Good - idempotent, handles edge cases
@OnEvent('trip.booked')
async handleTripBooked(event: TripBookedEvent): Promise<void> {
  if (!event.primaryContactId) return

  const contact = await this.findContact(event.primaryContactId)
  if (!contact || contact.firstBookingDate) return

  await this.setFirstBookingDate(event.primaryContactId, event.bookingDate)
}

// ❌ Bad - not idempotent, assumes data exists
@OnEvent('trip.booked')
async handleTripBooked(event: TripBookedEvent): Promise<void> {
  // Will fail on duplicate events or missing contact
  await this.setFirstBookingDate(event.primaryContactId, event.bookingDate)
}
```

### Error Handling

Event handlers can throw errors - they will bubble up to the emitter:

```typescript
@OnEvent('trip.booked')
async handleTripBooked(event: TripBookedEvent): Promise<void> {
  try {
    await this.setFirstBookingDate(event.primaryContactId, event.bookingDate)
  } catch (error) {
    // Log error for debugging
    this.logger.error('Failed to set first booking date', {
      error,
      event,
    })

    // Decide: swallow or rethrow?
    // - Swallow if it's acceptable for this side effect to fail
    // - Rethrow if the main operation should fail too
    throw error
  }
}
```

### When to Use Events vs Direct Calls

Use **Domain Events** when:
- ✅ The operation is a side effect, not core to the transaction
- ✅ You want to decouple modules
- ✅ Multiple listeners might need to react
- ✅ The operation might become async in the future

Use **Direct Calls** when:
- ✅ The operation is part of the core transaction
- ✅ You need synchronous validation/response
- ✅ The coupling is intentional and acceptable
- ✅ You need to handle errors differently

**Example:**
```typescript
// ✅ Use event - side effect, decoupled
this.eventEmitter.emit('trip.booked', new TripBookedEvent(...))

// ✅ Use direct call - core validation
const isValid = await this.validationService.validateTrip(dto)
if (!isValid) throw new BadRequestException()
```

---

## Testing

### Testing Event Emission

Test that events are emitted when expected:

```typescript
describe('TripsService', () => {
  let service: TripsService
  let eventEmitter: EventEmitter2

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [TripsService, DatabaseService],
    }).compile()

    service = module.get(TripsService)
    eventEmitter = module.get(EventEmitter2)
  })

  it('should emit trip.booked event when status changes to booked', async () => {
    const emitSpy = jest.spyOn(eventEmitter, 'emit')

    await service.update(tripId, { status: 'booked' })

    expect(emitSpy).toHaveBeenCalledWith(
      'trip.booked',
      expect.objectContaining({
        tripId: expect.any(String),
        primaryContactId: expect.any(String),
        bookingDate: expect.any(String),
      }),
    )
  })

  it('should NOT emit trip.booked when status unchanged', async () => {
    const emitSpy = jest.spyOn(eventEmitter, 'emit')

    await service.update(tripId, { name: 'New Name' })

    expect(emitSpy).not.toHaveBeenCalled()
  })
})
```

### Testing Event Handlers

Test handlers independently of emitters:

```typescript
describe('ContactsService - Event Handlers', () => {
  let service: ContactsService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ContactsService, DatabaseService],
    }).compile()

    service = module.get(ContactsService)
  })

  describe('handleTripBooked', () => {
    it('should set first booking date if not already set', async () => {
      const event = new TripBookedEvent('trip-1', 'contact-1', '2025-11-14')

      // Setup: contact exists with no firstBookingDate
      await createContact({ id: 'contact-1', firstBookingDate: null })

      await service.handleTripBooked(event)

      const contact = await service.findOne('contact-1')
      expect(contact.firstBookingDate).toBe('2025-11-14')
    })

    it('should NOT change first booking date if already set', async () => {
      const event = new TripBookedEvent('trip-2', 'contact-1', '2025-12-01')

      // Setup: contact already has firstBookingDate
      await createContact({
        id: 'contact-1',
        firstBookingDate: '2025-11-14'
      })

      await service.handleTripBooked(event)

      const contact = await service.findOne('contact-1')
      expect(contact.firstBookingDate).toBe('2025-11-14') // Unchanged
    })

    it('should handle missing contact gracefully', async () => {
      const event = new TripBookedEvent('trip-3', 'missing', '2025-11-14')

      // Should not throw
      await expect(
        service.handleTripBooked(event)
      ).resolves.not.toThrow()
    })
  })
})
```

### Integration Testing with Events

For integration tests, add EventEmitterModule and wait for async handlers:

```typescript
describe('Trips Workflow (Integration)', () => {
  let tripsService: TripsService
  let contactsService: ContactsService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),  // ← Required!
        DatabaseModule,
        ContactsModule,
        TripsModule,
      ],
    }).compile()

    tripsService = module.get(TripsService)
    contactsService = module.get(ContactsService)
  })

  it('should set first booking date when trip booked', async () => {
    const trip = await tripsService.create({
      name: 'Test Trip',
      primaryContactId: 'contact-1',
      status: 'booked',
    }, 'owner-1')

    // Wait for async event handlers to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const contact = await contactsService.findOne('contact-1')
    expect(contact.firstBookingDate).toBe(trip.bookingDate)
  })
})
```

**Note:** The 100ms wait ensures async event handlers complete. In production, events are fast (<10ms typically), but tests may need a small buffer.

---

## Troubleshooting

### Event Not Firing

**Symptom:** Event emitted but listener not called

**Checklist:**
1. ✅ EventEmitterModule.forRoot() in app.module.ts?
2. ✅ Event name matches exactly? (`'trip.booked'` not `'tripBooked'`)
3. ✅ Listener service is instantiated? (Check it's in module providers)
4. ✅ @OnEvent decorator present on handler method?
5. ✅ Event actually being emitted? (Add console.log to verify)

**Debug:**
```typescript
// In emitting service
this.eventEmitter.emit('trip.booked', event)
console.log('Emitted trip.booked event:', event)

// In listening service
@OnEvent('trip.booked')
async handleTripBooked(event: TripBookedEvent) {
  console.log('Received trip.booked event:', event)
  // ...
}
```

### Test Failures: "Can't resolve EventEmitter2"

**Error:**
```
Nest can't resolve dependencies of the TripsService (DatabaseService, ?).
Please make sure that the argument EventEmitter at index [1] is available
```

**Fix:** Add EventEmitterModule to test setup:

```typescript
const module = await Test.createTestingModule({
  imports: [
    EventEmitterModule.forRoot(),  // ← Add this!
    DatabaseModule,
    TripsModule,
  ],
}).compile()
```

### Race Conditions in Tests

**Symptom:** Integration tests sometimes pass, sometimes fail

**Cause:** Event handlers run asynchronously; test checks database before handler completes

**Fix:** Add explicit wait for events:

```typescript
const waitForEvents = () => new Promise(resolve => setTimeout(resolve, 100))

it('should update contact after trip booked', async () => {
  await tripsService.update(tripId, { status: 'booked' })

  await waitForEvents()  // ← Wait for handlers

  const contact = await contactsService.findOne(contactId)
  expect(contact.firstBookingDate).toBeDefined()
})
```

### Event Handler Errors Breaking Operations

**Symptom:** Trip update fails because contact update failed

**Cause:** Event handler throws error, which propagates to original operation

**Fix:** Decide if handler errors should fail the operation:

```typescript
@OnEvent('trip.booked')
async handleTripBooked(event: TripBookedEvent) {
  try {
    await this.setFirstBookingDate(...)
  } catch (error) {
    this.logger.error('Non-critical: failed to set first booking date', error)
    // Don't rethrow - allow trip update to succeed even if this fails
  }
}
```

---

## Future Enhancements

### Potential New Events

- `contact.created` - Initialize default preferences, send welcome email
- `trip.cancelled` - Update contact status, notify travelers
- `payment.received` - Update trip balance, send receipt
- `traveler.added` - Send invitation email, create account

### Event Sourcing

If we need full audit trails and time-travel capabilities, consider:
- Storing all domain events in an `events` table
- Rebuilding entity state from event history
- Using CQRS pattern for read/write separation

### External Event Bus

For microservices or distributed systems, replace EventEmitter2 with:
- **RabbitMQ** - Reliable message queue
- **AWS EventBridge** - Cloud-native event bus
- **Kafka** - High-throughput event streaming

Migration would be minimal - event classes and handlers stay the same, only the emitter changes.

---

## FAQ

### Do domain events affect the REST API or Swagger documentation?

**No.** Domain events are internal implementation details for service-to-service communication. They are not exposed through HTTP endpoints and therefore don't affect:
- REST API contracts (request/response schemas)
- Swagger/OpenAPI documentation
- API versioning or backwards compatibility

**When Swagger DOES need updates:**
- Adding/removing/modifying controller endpoints
- Changing DTO schemas (request/response types)
- Modifying HTTP methods or status codes
- Adding new API features visible to clients

**When Swagger does NOT need updates:**
- Internal refactoring (like domain events)
- Service layer changes (like adding interfaces)
- Database schema changes (if DTOs remain the same)
- Architecture documentation updates

**Example from Sprint 2.1 Phase 2:**
We implemented `TripBookedEvent` and event-driven architecture to break circular dependencies. This was purely internal - controllers, endpoints, and DTOs remained unchanged, so Swagger documentation stayed accurate without any updates.

---

## References

- [NestJS EventEmitter Documentation](https://docs.nestjs.com/techniques/events)
- [Domain Events Pattern (Martin Fowler)](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Event-Driven Architecture Guide](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven)
- Internal: `SERVICE_LAYER_AUDIT.md` - Service architecture audit
- Internal: `src/trips/events/trip-booked.event.ts` - Example event class
- Internal: `src/trips/__tests__/trips-workflow.spec.ts` - Integration test examples
- Internal: `API_DOCUMENTATION_TODO.md` - Swagger improvement backlog
