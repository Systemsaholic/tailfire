# Service Layer Architecture

**Last Updated:** 2025-11-14
**Status:** Active Development
**Related Docs:** [Domain Events](./DOMAIN_EVENTS.md), [Service Layer Audit](../../SERVICE_LAYER_AUDIT.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Service Responsibilities](#service-responsibilities)
3. [Service Interfaces](#service-interfaces)
4. [Dependency Management](#dependency-management)
5. [Patterns and Practices](#patterns-and-practices)
6. [Testing Services](#testing-services)

---

## Overview

The service layer is the heart of business logic in Tailfire. Services encapsulate domain operations, coordinate between data access and controllers, and enforce business rules.

### Core Principles

1. **Single Responsibility:** Each service manages one domain aggregate
2. **Interface Contracts:** Public APIs defined through TypeScript interfaces
3. **Event-Driven Communication:** Cross-domain interactions via domain events
4. **Dependency Injection:** All dependencies injected via NestJS DI container
5. **Testability:** Services designed for easy unit and integration testing

### Service Domains

```
┌─────────────────────────────────────────────────────────┐
│                    Tailfire Service Layer                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Contacts Domain         │  Trips Domain                │
│  ├─ ContactsService      │  ├─ TripsService             │
│  ├─ ContactGroupsService │  ├─ TripTravelersService     │
│  └─ ContactRelationships │  ├─ ItinerariesService       │
│                          │  └─ TravelerGroupsService     │
│                                                          │
│  Infrastructure                                          │
│  ├─ DatabaseService                                      │
│  └─ EventEmitter2 (via @nestjs/event-emitter)           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Service Responsibilities

### What Services SHOULD Do

✅ **Encapsulate Business Logic**
```typescript
// ✅ Good - business rule in service
async promoteToClient(id: string): Promise<ContactResponseDto> {
  const [contact] = await this.db.client
    .update(this.db.schema.contacts)
    .set({
      contactType: 'client',
      becameClientAt: new Date(),
      contactStatus: 'prospecting', // Business rule: clients start prospecting
    })
    .where(eq(this.db.schema.contacts.id, id))
    .returning()

  return this.mapToResponseDto(contact)
}
```

✅ **Validate Business Rules**
```typescript
// ✅ Good - validation before state change
async updateStatus(id: string, status: string): Promise<ContactResponseDto> {
  const existing = await this.findOne(id)

  // Business rule: leads can only be prospecting
  if (existing.contactType === 'lead' && status !== 'prospecting') {
    throw new Error('Leads can only have status "prospecting". Promote to client first.')
  }

  // ... perform update
}
```

✅ **Coordinate Domain Operations**
```typescript
// ✅ Good - emit events for cross-domain coordination
async update(id: string, dto: UpdateTripDto): Promise<TripResponseDto> {
  // Update trip
  const trip = await this.updateTrip(id, dto)

  // Emit event for other domains to react
  if (isTransitioningToBooked) {
    this.eventEmitter.emit('trip.booked', new TripBookedEvent(...))
  }

  return trip
}
```

✅ **Handle Data Transformation**
```typescript
// ✅ Good - map database entity to API response
private mapToResponseDto(contact: any): ContactResponseDto {
  return {
    id: contact.id,
    displayName: contact.preferredName ?? contact.firstName,
    legalFullName: this.buildLegalName(contact),
    // ... rest of mapping
  }
}
```

### What Services SHOULD NOT Do

❌ **HTTP/Transport Concerns**
```typescript
// ❌ Bad - HTTP logic in service
async findAll(req: Request, res: Response) {
  const page = parseInt(req.query.page) // Controller responsibility
  const data = await this.query(page)
  res.json({ data }) // Controller responsibility
}

// ✅ Good - pure business logic
async findAll(filters: ContactFilterDto): Promise<PaginatedContactsResponseDto> {
  // Service just handles data, controller handles HTTP
}
```

❌ **Direct Service-to-Service Calls (Cross-Domain)**
```typescript
// ❌ Bad - direct cross-domain dependency
@Injectable()
export class TripsService {
  constructor(
    private readonly contactsService: ContactsService, // Creates coupling
  ) {}

  async book(id: string) {
    // ... book trip
    await this.contactsService.setFirstBookingDate(...)  // Tight coupling
  }
}

// ✅ Good - event-driven cross-domain interaction
@Injectable()
export class TripsService {
  constructor(
    private readonly eventEmitter: EventEmitter2, // No coupling
  ) {}

  async book(id: string) {
    // ... book trip
    this.eventEmitter.emit('trip.booked', new TripBookedEvent(...))
  }
}
```

❌ **Complex Business Logic in Controllers**
```typescript
// ❌ Bad - business logic in controller
@Post()
async create(@Body() dto: CreateContactDto) {
  const contact = await this.contactsService.create(dto)

  // Business logic leaking into controller
  if (dto.email && dto.marketingEmailOptIn) {
    await this.emailService.sendWelcome(contact.email)
  }

  return contact
}

// ✅ Good - business logic in service
// Service emits 'contact.created' event
// Email service listens and sends welcome email
```

### Note on API Contracts and Internal Changes

**Internal service layer changes do NOT affect the REST API contract.**

When you refactor services (add events, create interfaces, extract helpers), the public API stays unchanged as long as:
- Controller endpoints remain the same
- Request/Response DTOs are unchanged
- HTTP methods and status codes are preserved

**Example:** Sprint 2.1 Phase 2 implemented event-driven architecture (`TripBookedEvent`), service interfaces, and domain events documentation. None of these changes affected controllers or DTOs, so the REST API contract remained stable and Swagger documentation stayed accurate without updates.

**What DOES require API documentation updates:**
- Adding/removing controller endpoints
- Changing DTO schemas (request/response types)
- Modifying HTTP methods, status codes, or headers
- Adding new public API features

See [API_DOCUMENTATION_TODO.md](./API_DOCUMENTATION_TODO.md) for Swagger improvement backlog.

---

## Service Interfaces

All core services define interface contracts in `interfaces/` subdirectories.

### Why Interfaces?

1. **Testability:** Easy to create mocks and test doubles
2. **Loose Coupling:** Depend on abstractions, not implementations
3. **Documentation:** Clear API contract for consumers
4. **Flexibility:** Swap implementations without breaking consumers

### Interface Structure

```
src/
├── contacts/
│   ├── interfaces/
│   │   ├── index.ts                              # Export barrel
│   │   ├── contacts-service.interface.ts         # IContactsService
│   │   └── contact-groups-service.interface.ts   # IContactGroupsService
│   ├── contacts.service.ts                       # Implementation
│   └── contact-groups.service.ts                 # Implementation
├── trips/
│   ├── interfaces/
│   │   ├── index.ts
│   │   ├── trips-service.interface.ts
│   │   ├── trip-travelers-service.interface.ts
│   │   ├── itineraries-service.interface.ts
│   │   └── traveler-groups-service.interface.ts
│   └── ... (implementations)
```

### Example Interface

```typescript
// src/contacts/interfaces/contacts-service.interface.ts

import type {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterDto,
  ContactResponseDto,
  PaginatedContactsResponseDto,
} from '@tailfire/shared-types/api'

export interface IContactsService {
  /**
   * Create a new contact
   */
  create(dto: CreateContactDto): Promise<ContactResponseDto>

  /**
   * Find all contacts with filtering and pagination
   */
  findAll(filters: ContactFilterDto): Promise<PaginatedContactsResponseDto>

  /**
   * Find one contact by ID
   * @throws NotFoundException if contact not found
   */
  findOne(id: string): Promise<ContactResponseDto>

  /**
   * Update a contact
   * @throws NotFoundException if contact not found
   */
  update(id: string, dto: UpdateContactDto): Promise<ContactResponseDto>

  /**
   * Soft delete a contact
   * @throws NotFoundException if contact not found
   */
  remove(id: string): Promise<void>
}
```

### Using Interfaces (Future)

*Note: Currently we use concrete classes. Future refactoring will use interface-based injection:*

```typescript
// Future pattern
@Injectable()
export class SomeService {
  constructor(
    @Inject('IContactsService')
    private readonly contacts: IContactsService,
  ) {}
}

// Module provides implementation
@Module({
  providers: [
    {
      provide: 'IContactsService',
      useClass: ContactsService,
    },
  ],
})
export class ContactsModule {}
```

---

## Dependency Management

### Allowed Dependencies

Services may depend on:

1. **DatabaseService** - For data access
2. **EventEmitter2** - For emitting domain events
3. **ConfigService** - For configuration (use sparingly)
4. **Services within same domain** - But consider splitting if needed

### Forbidden Dependencies

Services MUST NOT depend on:

1. **Services from other domains** - Use events instead
2. **Controllers** - Services are called by controllers, not vice versa
3. **HTTP libraries** - No Express, Fastify, etc. in services
4. **UI concerns** - No view rendering, HTML generation, etc.

### Dependency Injection Pattern

```typescript
@Injectable()
export class TripsService {
  constructor(
    private readonly db: DatabaseService,          // ✅ Data access
    private readonly eventEmitter: EventEmitter2,  // ✅ Events
  ) {}
}
```

### Circular Dependency Prevention

**Problem:**
```
TripsModule imports ContactsModule
ContactsModule imports TripsModule
❌ Circular dependency!
```

**Solution: Domain Events**
```
TripsService emits 'trip.booked' event
ContactsService listens for 'trip.booked'
✅ No circular import!
```

See [DOMAIN_EVENTS.md](./DOMAIN_EVENTS.md) for full guide.

---

## Patterns and Practices

### Standard CRUD Pattern

All domain services follow a consistent CRUD structure:

```typescript
@Injectable()
export class EntityService {
  constructor(private readonly db: DatabaseService) {}

  // CREATE
  async create(dto: CreateEntityDto): Promise<EntityResponseDto> {
    // 1. Validate relationships (foreign keys exist)
    // 2. Insert into database
    // 3. Emit events if needed
    // 4. Map to response DTO
    // 5. Return
  }

  // READ (list)
  async findAll(filters: EntityFilterDto): Promise<PaginatedEntitiesResponseDto> {
    // 1. Build WHERE conditions from filters
    // 2. Apply sorting
    // 3. Apply pagination
    // 4. Execute query
    // 5. Get total count
    // 6. Map to response DTOs
    // 7. Return with pagination metadata
  }

  // READ (single)
  async findOne(id: string): Promise<EntityResponseDto> {
    // 1. Query by ID
    // 2. Throw NotFoundException if not found
    // 3. Map to response DTO
    // 4. Return
  }

  // UPDATE
  async update(id: string, dto: UpdateEntityDto): Promise<EntityResponseDto> {
    // 1. Validate entity exists
    // 2. Validate business rules
    // 3. Update in database
    // 4. Emit events if needed
    // 5. Map to response DTO
    // 6. Return
  }

  // DELETE
  async remove(id: string): Promise<void> {
    // 1. Delete from database (or soft delete)
    // 2. Throw NotFoundException if not found
    // 3. Emit events if needed
  }

  // PRIVATE HELPERS
  private mapToResponseDto(entity: any): EntityResponseDto {
    // Database entity → API response transformation
  }
}
```

### Event-Driven Side Effects

When an operation triggers cross-domain effects, use events:

```typescript
async update(id: string, dto: UpdateTripDto): Promise<TripResponseDto> {
  // Core business logic
  const trip = await this.performUpdate(id, dto)

  // Side effect: notify other domains
  if (shouldNotifyBooking(trip, dto)) {
    this.eventEmitter.emit(
      'trip.booked',
      new TripBookedEvent(trip.id, trip.primaryContactId, trip.bookingDate)
    )
  }

  return trip
}
```

### Pagination Pattern

All `findAll` methods support pagination:

```typescript
async findAll(filters: EntityFilterDto): Promise<PaginatedEntitiesResponseDto> {
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  // Query with limit/offset
  const entities = await this.db.client
    .select()
    .from(this.db.schema.entities)
    .where(conditions)
    .limit(limit)
    .offset(offset)

  // Get total count
  const [{ count }] = await this.db.client
    .select({ count: sql<number>`count(*)::int` })
    .from(this.db.schema.entities)
    .where(conditions)

  return {
    data: entities.map(e => this.mapToResponseDto(e)),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  }
}
```

### Filtering Pattern

Build dynamic WHERE clauses based on filter DTO:

```typescript
async findAll(filters: ContactFilterDto): Promise<PaginatedContactsResponseDto> {
  const conditions = []

  // Build conditions array
  if (filters.search) {
    conditions.push(
      or(
        ilike(this.db.schema.contacts.firstName, `%${filters.search}%`),
        ilike(this.db.schema.contacts.email, `%${filters.search}%`)
      )
    )
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(
      sql`${this.db.schema.contacts.tags} && ARRAY[${sql.join(
        filters.tags.map(tag => sql`${tag}`),
        sql`, `
      )}]::text[]`
    )
  }

  // Apply to query
  const entities = await this.db.client
    .select()
    .from(this.db.schema.contacts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
}
```

### Error Handling Pattern

Services throw domain-specific exceptions:

```typescript
async findOne(id: string): Promise<ContactResponseDto> {
  const [contact] = await this.db.client
    .select()
    .from(this.db.schema.contacts)
    .where(eq(this.db.schema.contacts.id, id))
    .limit(1)

  if (!contact) {
    throw new NotFoundException(`Contact with ID ${id} not found`)
  }

  return this.mapToResponseDto(contact)
}
```

**Standard Exceptions:**
- `NotFoundException` - Entity not found
- `BadRequestException` - Invalid input or business rule violation
- `ConflictException` - Duplicate or conflicting state
- `UnauthorizedException` - Permission denied

---

## Testing Services

### Unit Testing

Test services in isolation with mocked dependencies:

```typescript
describe('ContactsService', () => {
  let service: ContactsService
  let mockDb: jest.Mocked<DatabaseService>

  beforeEach(() => {
    mockDb = {
      client: {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        // ... mock other methods
      },
    } as any

    service = new ContactsService(mockDb)
  })

  describe('create', () => {
    it('should create a contact', async () => {
      const dto = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }

      mockDb.client.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }]),
      } as any)

      const result = await service.create(dto)

      expect(result.firstName).toBe('John')
      expect(mockDb.client.insert).toHaveBeenCalled()
    })
  })
})
```

### Integration Testing

Test services with real database and dependencies:

```typescript
describe('ContactsService (Integration)', () => {
  let app: INestApplication
  let service: ContactsService
  let db: DatabaseService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        EventEmitterModule.forRoot(),
        DatabaseModule,
        ContactsModule,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    service = module.get<ContactsService>(ContactsService)
    db = module.get<DatabaseService>(DatabaseService)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Clean database before each test
    await db.client.execute(sql`DELETE FROM contacts`)
  })

  it('should create and retrieve a contact', async () => {
    const created = await service.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    })

    const retrieved = await service.findOne(created.id)

    expect(retrieved.id).toBe(created.id)
    expect(retrieved.firstName).toBe('Jane')
  })
})
```

### Testing with Events

For services that emit or listen to events:

```typescript
describe('TripsService - Events', () => {
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

  it('should emit trip.booked event on booking', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit')

    await service.update(tripId, { status: 'booked' })

    expect(spy).toHaveBeenCalledWith(
      'trip.booked',
      expect.any(TripBookedEvent)
    )
  })
})
```

---

## Best Practices Summary

### Do's ✅

- Define interface contracts for all public service APIs
- Use dependency injection for all dependencies
- Emit domain events for cross-domain interactions
- Keep services focused on single domain/aggregate
- Return DTOs, not database entities
- Validate business rules before state changes
- Use pagination for list endpoints
- Throw descriptive exceptions with context

### Don'ts ❌

- Don't inject services from other domains
- Don't put HTTP logic in services
- Don't return raw database entities
- Don't mix business logic into controllers
- Don't create God objects (services with 20+ methods)
- Don't ignore error handling
- Don't skip interface definitions

---

## Related Documentation

- [Domain Events Architecture](./DOMAIN_EVENTS.md) - Event-driven patterns
- [Service Layer Audit](../../SERVICE_LAYER_AUDIT.md) - Current state analysis
- [Database Schema](../database/SCHEMA.md) - Database design (if exists)
- [API Documentation](../api/README.md) - Controller/endpoint docs (if exists)
