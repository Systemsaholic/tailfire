# @tailfire/shared-types

Shared TypeScript types for Tailfire Beta monorepo.

## Overview

This package provides shared type definitions for:
- **API contracts** (REST request/response types)
- **Database entities** (inferred from Drizzle schema)

## Usage

### API Types (Frontend ↔ Backend)

```typescript
// apps/admin/lib/api/trips.ts
import type { api } from '@tailfire/shared-types'

async function createTrip(data: api.CreateTripRequest): Promise<api.TripResponse> {
  const response = await fetch('/api/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.json()
}
```

```typescript
// apps/api/src/modules/trips/dto/create-trip.dto.ts
import { api } from '@tailfire/shared-types'

export class CreateTripDto implements api.CreateTripRequest {
  @IsString()
  title: string

  // ... other fields
}
```

### Database Types (Type-safe queries)

```typescript
// apps/api/src/modules/trips/trips.service.ts
import type { database } from '@tailfire/shared-types'

async function findTrip(id: string): Promise<database.Trip | null> {
  return db.query.trips.findFirst({
    where: eq(trips.id, id),
  })
}
```

## Directory Structure

```
packages/shared-types/
├── src/
│   ├── api/              # REST API types
│   │   ├── trips.types.ts
│   │   ├── bookings.types.ts
│   │   ├── contacts.types.ts
│   │   └── index.ts
│   ├── database/         # Database entity types
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Type Generation

- **API types**: Manually defined (request/response contracts)
- **Database types**: Auto-inferred from `@tailfire/database` schema using Drizzle's `InferSelectModel` utility

```typescript
// Example: Infer database types from Drizzle schema
import { InferSelectModel } from 'drizzle-orm'
import { trips } from '@tailfire/database/schema'

export type Trip = InferSelectModel<typeof trips>
```

## Development

Types are defined in `packages/shared-types/src/` and exported via the package's main entry point.
