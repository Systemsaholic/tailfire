# Authentication Integration Requirements

**Status**: Documentation Only - Implementation planned for Phase 4
**Priority**: High
**Created**: Phase 3 - Contact Module Implementation

## Overview

Currently, all Contact module endpoints are **unauthenticated** and use hardcoded placeholder values for multi-tenancy. This document outlines the requirements and implementation plan for integrating JWT authentication and proper request context extraction.

## Current State (Phase 3)

All controllers hardcode the agency identifier:

```typescript
// contacts.controller.ts
const agencyId = 'temp-agency-id'

// contact-relationships.controller.ts
const agencyId = 'temp-agency-id'

// contact-groups.controller.ts
const agencyId = 'temp-agency-id'
```

**Security Issues**:
- No authentication required to access endpoints
- No authorization checks
- All requests can access/modify all agency data
- No user context for audit trails (createdBy, updatedBy fields)

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
  sub: string          // User ID
  email: string        // User email
  agencyId: string     // Primary agency association
  branchId?: string    // Branch association (Phase 2 multi-branch)
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
  userId: string
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
@Controller('contacts')
export class ContactsController {
  @Post()
  async create(@Body() dto: CreateContactDto) {
    const agencyId = 'temp-agency-id' // HARDCODED
    return this.contactsService.create(dto, agencyId)
  }

  @Get()
  async findAll(@Query() filters: ContactFilterDto) {
    const agencyId = 'temp-agency-id' // HARDCODED
    return this.contactsService.findAll(agencyId, filters)
  }
}
```

**After (Phase 4 - JWT Context)**:
```typescript
@Controller('contacts')
export class ContactsController {
  @Post()
  async create(
    @Body() dto: CreateContactDto,
    @GetAuthContext() auth: AuthContext,
  ) {
    return this.contactsService.create(dto, auth.agencyId)
  }

  @Get()
  async findAll(
    @Query() filters: ContactFilterDto,
    @GetAuthContext() auth: AuthContext,
  ) {
    return this.contactsService.findAll(auth.agencyId, filters)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @GetAuthContext() auth: AuthContext,
  ) {
    return this.contactsService.update(id, auth.agencyId, dto)
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetAuthContext() auth: AuthContext,
  ) {
    return this.contactsService.remove(id, auth.agencyId)
  }
}
```

### 5. Service Layer Audit Trail Integration

**Update Services to Track User Context**:
```typescript
// contact-relationships.service.ts
async create(
  contactId1: string,
  dto: CreateContactRelationshipDto,
  agencyId: string,
  userId: string, // NEW: from JWT context
): Promise<ContactRelationshipResponseDto> {
  // ... existing validation logic ...

  const [relationship] = await this.db.client
    .insert(this.db.schema.contactRelationships)
    .values({
      agencyId,
      contactId1,
      contactId2: dto.contactId2,
      labelForContact1: dto.labelForContact1,
      labelForContact2: dto.labelForContact2,
      category: dto.category,
      customLabel: dto.customLabel,
      notes: dto.notes,
      createdBy: userId, // NEW: audit trail
    })
    .returning()

  return this.mapToResponseDto(relationship)
}

async update(
  id: string,
  agencyId: string,
  dto: UpdateContactRelationshipDto,
  userId: string, // NEW: from JWT context
): Promise<ContactRelationshipResponseDto> {
  const [relationship] = await this.db.client
    .update(this.db.schema.contactRelationships)
    .set({
      ...dto,
      updatedAt: new Date(),
      updatedBy: userId, // NEW: audit trail
    })
    .where(
      and(
        eq(this.db.schema.contactRelationships.id, id),
        eq(this.db.schema.contactRelationships.agencyId, agencyId),
      ),
    )
    .returning()

  if (!relationship) {
    throw new NotFoundException(`Relationship with ID ${id} not found`)
  }

  return this.mapToResponseDto(relationship)
}
```

### 6. Authorization Levels

**Role-Based Access Control (Phase 4)**:
```typescript
// auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const Roles = (...roles: string[]) => SetMetadata('roles', roles)

// Usage in controllers:
@Post()
@Roles('admin', 'agent')
async create(
  @Body() dto: CreateContactDto,
  @GetAuthContext() auth: AuthContext,
) {
  return this.contactsService.create(dto, auth.agencyId)
}
```

**Permission-Based Access Control (Phase 5+)**:
```typescript
// auth/decorators/permissions.decorator.ts
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions)

// Usage:
@Delete(':id')
@RequirePermissions('contacts.delete')
async remove(
  @Param('id') id: string,
  @GetAuthContext() auth: AuthContext,
) {
  return this.contactsService.remove(id, auth.agencyId)
}
```

### 7. Multi-Branch Support (Phase 2 Feature)

**Branch-Level Isolation**:
```typescript
// When branchId is present in JWT:
@Get()
async findAll(
  @Query() filters: ContactFilterDto,
  @GetAuthContext() auth: AuthContext,
) {
  // If user has branchId, scope to that branch
  if (auth.branchId) {
    return this.contactsService.findAllByBranch(
      auth.agencyId,
      auth.branchId,
      filters,
    )
  }

  // Otherwise, agency-wide access
  return this.contactsService.findAll(auth.agencyId, filters)
}
```

## Migration Checklist

When implementing Phase 4 authentication:

- [ ] Create JwtAuthGuard and register globally
- [ ] Create AuthContext interface and GetAuthContext decorator
- [ ] Update ContactsController (8 endpoints)
- [ ] Update ContactRelationshipsController (6 endpoints)
- [ ] Update ContactGroupsController (8 endpoints)
- [ ] Update all service methods to accept userId parameter
- [ ] Wire createdBy/updatedBy fields in all create/update operations
- [ ] Add RolesGuard for role-based authorization
- [ ] Add PermissionsGuard for fine-grained authorization
- [ ] Remove all `const agencyId = 'temp-agency-id'` hardcoded values
- [ ] Update integration tests to include JWT tokens
- [ ] Update API documentation with authentication requirements
- [ ] Add error handling for missing/invalid JWT claims

## Files Requiring Updates

### Controllers (3 files)
- `/apps/api/src/contacts/contacts.controller.ts` (8 endpoints)
- `/apps/api/src/contacts/contact-relationships.controller.ts` (6 endpoints)
- `/apps/api/src/contacts/contact-groups.controller.ts` (8 endpoints)

### Services (3 files)
- `/apps/api/src/contacts/contacts.service.ts` (5 methods)
- `/apps/api/src/contacts/contact-relationships.service.ts` (5 methods)
- `/apps/api/src/contacts/contact-groups.service.ts` (7 methods)

### New Files Required
- `/apps/api/src/auth/jwt-auth.guard.ts`
- `/apps/api/src/auth/decorators/auth-context.decorator.ts`
- `/apps/api/src/auth/decorators/roles.decorator.ts`
- `/apps/api/src/auth/guards/roles.guard.ts`

## Testing Considerations

### Unit Tests
- Mock AuthContext in controller tests
- Test service methods with valid userId values
- Verify createdBy/updatedBy are populated correctly

### Integration Tests
- Include valid JWT tokens in request headers
- Test unauthorized access (401 responses)
- Test cross-agency access attempts (should fail)
- Test role-based restrictions

### Example Test Pattern
```typescript
describe('ContactsController (with Auth)', () => {
  it('should create contact with authenticated user context', async () => {
    const authContext: AuthContext = {
      userId: 'user-123',
      email: 'agent@agency.com',
      agencyId: 'agency-456',
      role: 'agent',
      permissions: ['contacts.create'],
    }

    const dto: CreateContactDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    }

    const result = await controller.create(dto, authContext)

    expect(result.id).toBeDefined()
    // Verify audit trail when querying database directly
  })

  it('should reject unauthenticated requests', async () => {
    // Test without JWT token
    await expect(
      request(app.getHttpServer())
        .post('/contacts')
        .send(dto)
    ).rejects.toThrow(UnauthorizedException)
  })
})
```

## Security Best Practices

1. **Never trust client-provided agencyId/branchId** - Always extract from verified JWT
2. **Validate JWT signature** - Ensure tokens are signed by your auth service
3. **Check token expiration** - Reject expired tokens
4. **Implement token refresh** - Use refresh tokens for long-lived sessions
5. **Log authentication failures** - Monitor for suspicious activity
6. **Rate limit auth endpoints** - Prevent brute force attacks
7. **Use HTTPS in production** - Protect JWT tokens in transit
8. **Rotate signing keys** - Periodically update JWT signing secrets

## Related Documentation

- Phase 4 Planning Document (to be created)
- Authentication Service Implementation Guide (to be created)
- Multi-Tenancy Architecture Document (ULTIMATE_TAILFIRE_DATA_MODEL.md)
- API Security Audit Report (to be created)

---

**Last Updated**: Phase 3 - Contact Module Implementation
**Next Review**: Before Phase 4 Implementation Kickoff
