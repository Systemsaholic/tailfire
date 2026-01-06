# API Documentation Improvement Backlog

**Created:** 2025-11-14
**Status:** Backlog (Pre-existing gap, predates Sprint 2.1 Phase 2)
**Priority:** Medium

---

## Overview

This document tracks the identified gap in Swagger/OpenAPI documentation for the Tailfire API. This gap **predates Sprint 2.1 Phase 2** and is unrelated to the event-driven architecture refactoring completed in that sprint.

**Important Context:**
- Sprint 2.1 Phase 2 implemented domain events, service interfaces, and architecture documentation
- Those changes were purely internal and did not affect API contracts
- This Swagger improvement task is a separate, pre-existing gap

---

## Current State

### What's Working ✅

- Swagger UI is accessible at `/api-docs` (if configured)
- Basic endpoint discovery via NestJS metadata
- Controllers and DTOs are properly typed with TypeScript

### What's Missing ❌

**No Swagger Decorators on Controllers:**
```typescript
// Current state - no decorators
@Controller('contacts')
export class ContactsController {
  @Post()
  async create(@Body() dto: CreateContactDto) { ... }
}
```

**Missing Documentation Elements:**
- `@ApiTags()` - No controller grouping
- `@ApiOperation()` - No endpoint descriptions
- `@ApiResponse()` - No response documentation
- `@ApiBearerAuth()` - No auth documentation
- `@ApiProperty()` on DTOs - Limited schema documentation

**Result:** Swagger UI shows endpoints but with minimal or no descriptions, making it hard for frontend developers or API consumers to understand usage.

---

## Improvement Plan

### Phase 1: Core Controller Documentation

Add Swagger decorators to all controllers:

```typescript
@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  @Post()
  @ApiOperation({
    summary: 'Create a new contact',
    description: 'Creates a new contact record. Contacts can be leads or clients.'
  })
  @ApiResponse({
    status: 201,
    description: 'Contact created successfully',
    type: ContactResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  @ApiBearerAuth()
  async create(@Body() dto: CreateContactDto) { ... }
}
```

**Controllers to Document:**
- [ ] `ContactsController`
- [ ] `ContactGroupsController`
- [ ] `TripsController`
- [ ] `TripTravelersController`
- [ ] `ItinerariesController`
- [ ] `TravelerGroupsController`

### Phase 2: DTO Schema Documentation

Enhance DTOs with `@ApiProperty()` decorators:

```typescript
export class CreateContactDto {
  @ApiProperty({
    description: 'Contact first name',
    example: 'John',
    minLength: 1,
    maxLength: 100
  })
  firstName: string

  @ApiProperty({
    description: 'Contact email address',
    example: 'john@example.com',
    format: 'email',
    required: false
  })
  email?: string
}
```

**DTOs to Document:**
- [ ] Contact DTOs (Create, Update, Filter, Response)
- [ ] Trip DTOs
- [ ] Traveler DTOs
- [ ] Group DTOs
- [ ] Itinerary DTOs

### Phase 3: Authentication Documentation

Add auth documentation:

```typescript
// In main.ts or app setup
const config = new DocumentBuilder()
  .setTitle('Tailfire API')
  .setDescription('Travel agency management API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
```

### Phase 4: Response Examples

Add realistic examples to response DTOs:

```typescript
@ApiResponse({
  status: 200,
  description: 'Paginated list of contacts',
  schema: {
    example: {
      data: [
        {
          id: 'uuid-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          contactType: 'client',
          becameClientAt: '2025-01-15T10:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 150,
        totalPages: 8
      }
    }
  }
})
```

---

## Acceptance Criteria

When this backlog item is complete, the Swagger UI should:

1. ✅ Group endpoints by domain using `@ApiTags()`
2. ✅ Show clear descriptions for each endpoint
3. ✅ Document request/response schemas with examples
4. ✅ Document all possible HTTP status codes
5. ✅ Show authentication requirements
6. ✅ Provide realistic example requests/responses
7. ✅ Make it easy for frontend developers to discover and test endpoints

---

## Resources

- [NestJS OpenAPI Documentation](https://docs.nestjs.com/openapi/introduction)
- [Swagger Decorators Reference](https://docs.nestjs.com/openapi/decorators)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)

---

## Notes

### Why This Wasn't Done in Sprint 2.1 Phase 2

Sprint 2.1 Phase 2 focused on internal architecture improvements:
- Domain events implementation
- Service interface contracts
- Architecture documentation

None of these changes affected the public REST API contract (controllers, DTOs, endpoints). Therefore, there was no need to update Swagger documentation as part of that sprint.

### When to Update Swagger in Future Sprints

Update Swagger documentation when you make changes that affect the public API:
- Adding/removing controller endpoints
- Changing DTO schemas
- Modifying HTTP methods or status codes
- Adding new query parameters or headers

**Do NOT update Swagger for:**
- Internal service refactoring
- Database schema changes (unless DTOs change)
- Event-driven architecture updates
- Adding service interfaces or documentation

---

## Related Documentation

- [Domain Events Architecture](./DOMAIN_EVENTS.md)
- [Service Layer Architecture](./SERVICE_LAYER.md)
