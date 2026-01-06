# @tailfire/database

Shared Drizzle ORM database layer for Tailfire Beta monorepo.

## Overview

This package provides:
- **Drizzle schema definitions** for all database tables
- **Database client factory** (`createDbClient`)
- **Migration runner** (`runMigrations` - apps/api only)
- **TypeScript types** for database entities

## Usage

### In NestJS Backend (`apps/api`)

```typescript
// apps/api/src/db/index.ts
import { createDbClient } from '@tailfire/database'

export const db = createDbClient(process.env.DATABASE_URL!)
```

### In Scripts

```typescript
// scripts/seed-database.ts
import { createDbClient } from '@tailfire/database'

const db = createDbClient(process.env.DATABASE_URL!)
await db.insert(schema.agencies).values({ name: 'Demo Agency' })
```

## Migrations

See [MIGRATIONS.md](./MIGRATIONS.md) for full conventions and workflow.

### Quick Reference

| Command | Description |
|---------|-------------|
| `cd apps/api && pnpm db:migrate` | Apply pending migrations |
| `pnpm --filter @tailfire/database migrations:validate` | Check naming and duplicates |
| `pnpm --filter @tailfire/database migrations:list` | List migration files |

### Key Rules

- **Run migrations from `apps/api` only** (requires direct TCP connection)
- **Naming format**: `YYYYMMDDHHMMSS_snake_case_description.sql`
- **Source of truth**: Supabase migrations table (not Drizzle journal)

## Directory Structure

```
packages/database/
├── src/
│   ├── schema/              # Drizzle schema files
│   │   ├── auth.schema.ts
│   │   ├── agencies.schema.ts
│   │   ├── trips.schema.ts
│   │   └── index.ts
│   ├── migrations/          # Generated SQL migrations
│   │   └── YYYYMMDD_*.sql
│   ├── client.ts            # Database client factory
│   ├── migrate.ts           # Migration runner
│   └── index.ts             # Package exports
├── drizzle.config.ts        # Drizzle Kit configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

Required in `apps/api/.env`:

```bash
# Direct TCP connection (Supabase provides this)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Service role key (bypasses RLS, for migrations only)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Schema Organization

| File | Tables | Description |
|------|--------|-------------|
| `auth.schema.ts` | users, sessions, roles | Authentication & RBAC |
| `agencies.schema.ts` | agencies, branches | Agency structure |
| `contacts.schema.ts` | contacts, relationships, groups | Contact management |
| `trips.schema.ts` | trips, travelers, itineraries | Trip management |
| `bookings.schema.ts` | bookings, booking_* | All 7 booking types |
| `financials.schema.ts` | payments, commissions, trust ledger | Financial management |
| `tasks.schema.ts` | tasks | Task management |
| `cruise.schema.ts` | cruise_catalogue, ships, ports | Cruise catalogue |
| `lookups.schema.ts` | countries, currencies, etc. | Lookup tables |

## Development

Schema files will be created during Sprint 1.2+ following the roadmap in `docs/planning/MONTH_BY_MONTH_ROADMAP.md`.
