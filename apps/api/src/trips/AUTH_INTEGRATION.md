# Authentication Integration Requirements

**Status**: Documentation Only - Implementation planned for Phase 4
**Priority**: High
**Created**: Phase 3 - Trips Module Implementation

## Overview

Currently, all Trips module endpoints are **unauthenticated** and use hardcoded placeholder values for multi-tenancy. This document outlines the requirements and implementation plan for integrating JWT authentication and proper request context extraction.

## Current State (Phase 3)

All controllers hardcode the agency identifier and owner identifier:

```typescript
// trips.controller.ts
const agencyId = 'temp-agency-id'
const ownerId = 'temp-owner-id'

// trip-travelers.controller.ts
const agencyId = 'temp-agency-id'

// itineraries.controller.ts
const agencyId = 'temp-agency-id'

// traveler-groups.controller.ts
const agencyId = 'temp-agency-id'
```

**Security Issues**:
- No authentication required to access endpoints
- No authorization checks
- All requests can access/modify all agency data
- No user context for audit trails (createdBy, updatedBy fields)
- Trip ownership (ownerId) is hardcoded and not tied to actual users

## Organizational Hierarchy

The system has the following hierarchy:
- **Agency** → Top-level organization
- **Branch** (future) → Will share commission with their agents, have access to their agents' contacts and trips
- **Travel Advisor** → Individual agent level

Currently implementing agency-level isolation as groundwork for future branch-level segmentation.

## Phase 4 Requirements

### 1. JWT Authentication Guard

**Implement Global Authentication**:
```typescript
// main.ts
import { JwtAuthGuard } from './auth/jwt-auth.guard'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global authentication guard
  app.useGlobalGuards(new JwtAuthGuard())

  // Existing validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  await app.listen(3101)
}
```

### 2. JWT Payload Structure

**Expected JWT Claims**:
```typescript
interface JwtPayload {
  sub: string          // User ID (Travel Advisor ID)
  email: string        // User email
  agencyId: string     // Primary agency association
  branchId?: string    // Branch association (future multi-branch feature)
  role: string         // User role for authorization
  permissions: string[] // Fine-grained permissions
  iat: number          // Issued at
  exp: number          // Expiration
}
```

### 3. Request Context Decorator

**Create Custom Decorator for Auth Context**:
```typescript
// auth/decorators/auth-context.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface AuthContext {
  userId: string       // Travel Advisor ID
  email: string
  agencyId: string
  branchId?: string
  role: string
  permissions: string[]
}

export const GetAuthContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user // Set by JwtAuthGuard

    return {
      userId: user.sub,
      email: user.email,
      agencyId: user.agencyId,
      branchId: user.branchId,
      role: user.role,
      permissions: user.permissions,
    }
  },
)
```

### 4. Controller Migration Pattern

**Before (Phase 3 - Hardcoded)**:
```typescript
@Controller('trips')
export class TripsController {
  @Post()
  async create(@Body() dto: CreateTripDto) {
    const agencyId = 'temp-agency-id' // HARDCODED
    const ownerId = 'temp-owner-id'   // HARDCODED
    return this.tripsService.create(dto, agencyId, ownerId)
  }

  @Get()
  async findAll(@Query() filters: TripFilterDto) {
    const agencyId = 'temp-agency-id' // HARDCODED
    return this.tripsService.findAll(agencyId, filters)
  }
}
```

**After (Phase 4 - JWT Context)**:
```typescript
@Controller('trips')
export class TripsController {
  @Post()
  async create(
    @Body() dto: CreateTripDto,
    @GetAuthContext() auth: AuthContext,
  ) {
    // ownerId is the authenticated user (Travel Advisor)
    return this.tripsService.create(dto, auth.agencyId, auth.userId)
  }

  @Get()
  async findAll(
    @Query() filters: TripFilterDto,
    @GetAuthContext() auth: AuthContext,
  ) {
    return this.tripsService.findAll(auth.agencyId, filters)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
    @GetAuthContext() auth: AuthContext,
  ) {
    return this.tripsService.update(id, auth.agencyId, dto)
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetAuthContext() auth: AuthContext,
  ) {
    return this.tripsService.remove(id, auth.agencyId)
  }
}
```

### 5. Nested Route Ownership Validation

**Trip Travelers Controller**:
```typescript
@Controller('trips/:tripId/travelers')
export class TripTravelersController {
  @Get(':id')
  async findOne(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @GetAuthContext() auth: AuthContext,
  ) {
    // Validates traveler belongs to the trip AND agency
    return this.tripTravelersService.findOne(id, auth.agencyId, tripId)
  }

  @Patch(':id')
  async update(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTripTravelerDto,
    @GetAuthContext() auth: AuthContext,
  ) {
    return this.tripTravelersService.update(id, auth.agencyId, dto, tripId)
  }
}
```

### 6. Service Layer Audit Trail Integration

**Update Services to Track User Context**:
```typescript
// trips.service.ts
async create(
  dto: CreateTripDto,
  agencyId: string,
  ownerId: string, // NEW: from JWT context (auth.userId)
): Promise<TripResponseDto> {
  const [trip] = await this.db.client
    .insert(this.db.schema.trips)
    .values({
      agencyId,
      ownerId, // Travel Advisor who created the trip
      name: dto.name,
      status: dto.status || 'planning',
      departureDate: dto.departureDate,
      returnDate: dto.returnDate,
      budget: dto.budget?.toString(),
      numberOfTravelers: dto.numberOfTravelers,
      destination: dto.destination,
      notes: dto.notes,
    })
    .returning()

  return this.mapToResponseDto(trip)
}

async update(
  id: string,
  agencyId: string,
  dto: UpdateTripDto,
  userId: string, // NEW: from JWT context
): Promise<TripResponseDto> {
  const [trip] = await this.db.client
    .update(this.db.schema.trips)
    .set({
      ...dto,
      budget: dto.budget?.toString(),
      updatedAt: new Date(),
      updatedBy: userId, // NEW: audit trail
    })
    .where(
      and(
        eq(this.db.schema.trips.id, id),
        eq(this.db.schema.trips.agencyId, agencyId),
      ),
    )
    .returning()

  if (!trip) {
    throw new NotFoundException(`Trip with ID ${id} not found`)
  }

  return this.mapToResponseDto(trip)
}
```

### 7. Authorization Levels

**Role-Based Access Control (Phase 4)**:
```typescript
// auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const Roles = (...roles: string[]) => SetMetadata('roles', roles)

// Usage in controllers:
@Post()
@Roles('admin', 'agent')
async create(
  @Body() dto: CreateTripDto,
  @GetAuthContext() auth: AuthContext,
) {
  return this.tripsService.create(dto, auth.agencyId, auth.userId)
}
```

**Permission-Based Access Control (Phase 5+)**:
```typescript
// auth/decorators/permissions.decorator.ts
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions)

// Usage:
@Delete(':id')
@RequirePermissions('trips.delete')
async remove(
  @Param('id') id: string,
  @GetAuthContext() auth: AuthContext,
) {
  return this.tripsService.remove(id, auth.agencyId)
}
```

### 8. Trip Ownership vs Agency Access

**Important Distinction**:
- `ownerId`: The Travel Advisor who created the trip (stored in trips.ownerId)
- `agencyId`: The agency the trip belongs to (trips.agencyId)

**Access Patterns**:
```typescript
// Option 1: Owner-only access (strict)
async findOne(id: string, agencyId: string, userId: string) {
  const [trip] = await this.db.client
    .select()
    .from(this.db.schema.trips)
    .where(
      and(
        eq(this.db.schema.trips.id, id),
        eq(this.db.schema.trips.agencyId, agencyId),
        eq(this.db.schema.trips.ownerId, userId), // Must be owner
      ),
    )
    .limit(1)

  if (!trip) {
    throw new NotFoundException(`Trip with ID ${id} not found`)
  }

  return this.mapToResponseDto(trip)
}

// Option 2: Agency-wide access (collaborative)
// Current implementation - any agent in agency can view/modify trips
// Future: Add trip_collaborators table for explicit sharing
```

### 9. Multi-Branch Support (Future Feature)

**Branch-Level Isolation**:
```typescript
// When branchId is present in JWT:
@Get()
async findAll(
  @Query() filters: TripFilterDto,
  @GetAuthContext() auth: AuthContext,
) {
  // If user has branchId, scope to that branch's agents' trips
  if (auth.branchId) {
    return this.tripsService.findAllByBranch(
      auth.agencyId,
      auth.branchId,
      filters,
    )
  }

  // Otherwise, agency-wide access
  return this.tripsService.findAll(auth.agencyId, filters)
}
```

## Migration Checklist

When implementing Phase 4 authentication:

- [ ] Create JwtAuthGuard and register globally (if not already done in Contacts migration)
- [ ] Create AuthContext interface and GetAuthContext decorator (if not already done)
- [ ] Update TripsController (5 endpoints)
- [ ] Update TripTravelersController (5 endpoints)
- [ ] Update ItinerariesController (5 endpoints)
- [ ] Update TravelerGroupsController (8 endpoints)
- [ ] Update all service methods to accept userId parameter for audit trails
- [ ] Wire createdBy/updatedBy fields in all create/update operations
- [ ] Replace hardcoded ownerId with auth.userId in trip creation
- [ ] Add RolesGuard for role-based authorization (if not already done)
- [ ] Add PermissionsGuard for fine-grained authorization (if not already done)
- [ ] Remove all `const agencyId = 'temp-agency-id'` hardcoded values
- [ ] Remove all `const ownerId = 'temp-owner-id'` hardcoded values
- [ ] Update integration tests to include JWT tokens
- [ ] Update API documentation with authentication requirements
- [ ] Add error handling for missing/invalid JWT claims
- [ ] Decide on trip access model: owner-only vs agency-wide vs collaborator-based

## Files Requiring Updates

### Controllers (6 files)
- `/apps/api/src/trips/trips.controller.ts` (5 endpoints)
- `/apps/api/src/trips/trip-travelers.controller.ts` (5 endpoints)
- `/apps/api/src/trips/itineraries.controller.ts` (5 endpoints)
- `/apps/api/src/trips/traveler-groups.controller.ts` (8 endpoints)
- `/apps/api/src/trips/insurance.controller.ts` (10 endpoints)
- `/apps/api/src/trips/payment-schedules.controller.ts` (10 endpoints)

### Services (6 files)
- `/apps/api/src/trips/trips.service.ts` (7 methods)
- `/apps/api/src/trips/trip-travelers.service.ts` (5 methods)
- `/apps/api/src/trips/itineraries.service.ts` (5 methods)
- `/apps/api/src/trips/traveler-groups.service.ts` (7 methods)
- `/apps/api/src/trips/insurance.service.ts` (10 methods)
- `/apps/api/src/trips/payment-schedules.service.ts` (12 methods)

### New Files Required (if not created in Contacts migration)
- `/apps/api/src/auth/jwt-auth.guard.ts`
- `/apps/api/src/auth/decorators/auth-context.decorator.ts`
- `/apps/api/src/auth/decorators/roles.decorator.ts`
- `/apps/api/src/auth/guards/roles.guard.ts`

## Testing Considerations

### Unit Tests
- Mock AuthContext in controller tests
- Test service methods with valid userId values
- Verify createdBy/updatedBy are populated correctly
- Test nested route tripId validation

### Integration Tests
- Include valid JWT tokens in request headers
- Test unauthorized access (401 responses)
- Test cross-agency access attempts (should fail)
- Test nested route violations (accessing traveler via wrong trip)
- Test role-based restrictions
- Test trip ownership vs agency-wide access scenarios

### Example Test Pattern
```typescript
describe('TripsController (with Auth)', () => {
  it('should create trip with authenticated user as owner', async () => {
    const authContext: AuthContext = {
      userId: 'advisor-123',
      email: 'agent@agency.com',
      agencyId: 'agency-456',
      role: 'agent',
      permissions: ['trips.create'],
    }

    const dto: CreateTripDto = {
      name: 'European Adventure',
      departureDate: '2024-06-01',
      returnDate: '2024-06-15',
    }

    const result = await controller.create(dto, authContext)

    expect(result.id).toBeDefined()
    expect(result.ownerId).toBe('advisor-123') // Owner is authenticated user
    expect(result.agencyId).toBe('agency-456')
  })

  it('should reject unauthenticated requests', async () => {
    await expect(
      request(app.getHttpServer())
        .post('/trips')
        .send(dto)
    ).rejects.toThrow(UnauthorizedException)
  })

  it('should validate nested route ownership', async () => {
    const authContext: AuthContext = {
      userId: 'advisor-123',
      agencyId: 'agency-456',
      // ... other fields
    }

    // Attempt to access traveler from wrong trip
    await expect(
      controller.findTraveler('wrong-trip-id', 'traveler-id', authContext)
    ).rejects.toThrow(NotFoundException)
  })
})
```

## Security Best Practices

1. **Never trust client-provided agencyId/branchId/ownerId** - Always extract from verified JWT
2. **Validate JWT signature** - Ensure tokens are signed by your auth service
3. **Check token expiration** - Reject expired tokens
4. **Implement token refresh** - Use refresh tokens for long-lived sessions
5. **Log authentication failures** - Monitor for suspicious activity
6. **Rate limit auth endpoints** - Prevent brute force attacks
7. **Use HTTPS in production** - Protect JWT tokens in transit
8. **Rotate signing keys** - Periodically update JWT signing secrets
9. **Validate nested route ownership** - Ensure resources belong to parent entities in URL
10. **Implement proper authorization** - Don't just authenticate, authorize access levels

## Trip-Specific Security Considerations

### Trip Ownership Model
Decide on one of these access patterns before Phase 4:

1. **Owner-Only Model**: Only the Travel Advisor who created the trip can access it
   - Strictest security
   - Requires explicit sharing via trip_collaborators table
   - Best for high-privacy scenarios

2. **Agency-Wide Model** (Current Implementation): Any agent in the agency can access any trip
   - Most collaborative
   - Simplest to implement
   - Good for small teams with full trust

3. **Collaborator-Based Model**: Owner + explicitly added collaborators
   - Balanced approach
   - Requires trip_collaborators table (already in schema)
   - Best for larger agencies with selective sharing

### Nested Resource Authorization
All nested routes (`/trips/:tripId/...`) must validate:
1. Trip belongs to authenticated user's agency
2. Nested resource (traveler/itinerary/group) belongs to the trip in URL
3. User has permission to access the trip (based on chosen ownership model)

## Related Documentation

- Phase 4 Planning Document (to be created)
- Authentication Service Implementation Guide (to be created)
- Multi-Tenancy Architecture Document (ULTIMATE_TAILFIRE_DATA_MODEL.md)
- Contacts Module AUTH_INTEGRATION.md (similar patterns)
- API Security Audit Report (to be created)

---

**Last Updated**: Phase 3 - Trips Module Implementation
**Next Review**: Before Phase 4 Implementation Kickoff
