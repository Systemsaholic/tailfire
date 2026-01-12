# Architecture Overview

This document describes the high-level architecture and key design decisions in Tailfire.

## System Overview

Tailfire is a **single-agency, multi-branch** travel management platform built as a monorepo:

```
tailfire/
├── apps/                    # Deployable applications
│   ├── admin/              # B2B Admin Dashboard (Next.js)
│   ├── api/                # Backend API (NestJS)
│   ├── client/             # Customer-facing app (Next.js)
│   └── ota/                # OTA booking platform (Next.js)
├── packages/               # Shared libraries
│   ├── database/           # Drizzle ORM schema & migrations
│   ├── shared-types/       # TypeScript type definitions
│   ├── api-client/         # API client library
│   ├── ui-public/          # Shared UI components
│   └── config/             # ESLint & TypeScript configs
└── docs/                   # Project documentation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Backend** | NestJS 10+, Drizzle ORM |
| **Frontend** | Next.js 15, shadcn/ui, TanStack Query |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth + JWT |
| **Storage** | Cloudflare R2, Backblaze B2, Supabase Storage |

---

## Data Flow: API-First Architecture

All data operations flow through the API layer:

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend Apps                            │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │  Admin  │    │   OTA   │    │ Client  │    │ (Future)│   │
│  │  :3100  │    │  :3102  │    │  :3103  │    │         │   │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘   │
│       │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┘         │
│                          │                                   │
│                   Supabase Auth                              │
│                   (Login/Signup)                             │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │     API (NestJS)      │
               │        :3101          │
               │                       │
               │  - JWT Validation     │
               │  - Authorization      │
               │  - Business Logic     │
               │  - Data Validation    │
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │  Database (Supabase)  │
               │                       │
               │  ┌─────────────────┐  │
               │  │ public schema   │  │
               │  │ (app data)      │  │
               │  └─────────────────┘  │
               │  ┌─────────────────┐  │
               │  │ catalog schema  │  │
               │  │ (cruise data)   │  │
               │  └─────────────────┘  │
               └───────────────────────┘
```

**Why API-First?**
- Frontend apps use Supabase Auth for login/signup only
- All data queries go through the API (not direct to database)
- RLS "lockdown" blocks direct database access from frontends
- Centralized authorization, validation, and business logic

---

## Multi-Tenancy Model

Tailfire is designed for a **single agency with multiple branches**:

- **Single Agency**: One travel agency organization (Phoenix Voyages)
- **Multiple Branches**: Future support for physical/virtual branch locations
- **Centralized Management**: Admin dashboard manages all branches
- **Shared Catalog**: All branches access the same cruise/tour data
- **Branch-Scoped Data**: Bookings, clients, transactions scoped to branches

**This is NOT a multi-tenant SaaS platform.** The codebase serves one agency with the flexibility to scale across branches while maintaining centralized control.

### Data Isolation

Every row in core tables includes `agency_id`:
- Enables future multi-agency support if needed
- RLS policies enforce agency-scoped access
- JWT tokens carry `agency_id` claim

---

## The Catalog Split: Dev FDW vs Prod Local

This is the most distinctive part of the architecture.

### The Problem

Cruise catalog data (ships, sailings, prices) is:
- Large and complex (16 tables, millions of rows)
- Updated from external providers (Traveltek)
- Read-only for the application
- Needed in both Dev and Prod environments

### The Solution: Schema Split + FDW

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DATABASE                       │
│                 (cmktvanwglszgadjrorm)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐       ┌─────────────────────────────┐  │
│  │ public schema   │       │ catalog schema              │  │
│  │                 │       │                             │  │
│  │ - agencies      │       │ - cruise_lines      (LOCAL) │  │
│  │ - user_profiles │       │ - cruise_ships      (LOCAL) │  │
│  │ - trips         │       │ - cruise_sailings   (LOCAL) │  │
│  │ - contacts      │       │ - cruise_ports      (LOCAL) │  │
│  │ - activities    │       │ - ... 12 more tables        │  │
│  │ - ...           │       │                             │  │
│  └─────────────────┘       └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT DATABASE                       │
│                  (gaqacfstpnmwphekjzae)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐       ┌─────────────────────────────┐  │
│  │ public schema   │       │ catalog schema              │  │
│  │                 │       │                             │  │
│  │ - agencies      │       │ - cruise_lines    (FOREIGN) │  │
│  │ - user_profiles │       │ - cruise_ships    (FOREIGN) │  │
│  │ - trips         │  FDW  │ - cruise_sailings (FOREIGN) │  │
│  │ - contacts      │ ───── │ - cruise_ports    (FOREIGN) │  │
│  │ - activities    │       │ - ... 12 more tables        │  │
│  │ - ...           │       │                    ↓        │  │
│  └─────────────────┘       │            Points to Prod   │  │
│                            └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### How It Works

| Environment | catalog Schema | Data Source |
|-------------|---------------|-------------|
| **Production** | Local PostgreSQL tables | Traveltek sync writes here |
| **Development** | Foreign tables via FDW | Reads from Prod (read-only) |

**Benefits**:
- Single source of truth for catalog data
- No need to sync catalog between environments
- Dev always has real, current catalog data
- Catalog updates only happen in Prod

**Implementation**:
- `postgres_fdw` extension creates foreign server
- Read-only user (`fdw_catalog_ro`) for Dev access
- Guard clause in migration detects environment
- See [Database Architecture](./DATABASE_ARCHITECTURE.md) for details

---

## Key Design Decisions

### 1. Provider-Agnostic Catalog

Every catalog table includes:
```typescript
provider: varchar('provider').notNull().default('traveltek'),
providerIdentifier: varchar('provider_identifier').notNull(),
```

**Why**: Enables switching cruise data providers without schema changes.

### 2. Canonical Currency (CAD)

All prices stored in cents (integers):
```typescript
cheapestInsideCents: integer('cheapest_inside_cents'),
cheapestOceanviewCents: integer('cheapest_oceanview_cents'),
```

**Why**: Avoids floating-point precision issues; exchange handled in app layer.

### 3. Polymorphic Activities

Activities support 10 component types:
- Flight, Cruise, Lodging, Transportation, Dining
- Entertainment, Excursion, Insurance, Custom, Port Info

Each type has a dedicated detail table (e.g., `flight_details`, `lodging_details`).

**Why**: Clean separation of type-specific data while maintaining common fields.

### 4. Drizzle-Only Migrations

All schema changes use Drizzle ORM:
- Single source of truth for schema
- TypeScript type safety
- Migration tracking via `_journal.json`

Supabase CLI migrations are deprecated (archived in `_archive/`).

---

## Application Responsibilities

| App | Purpose | Users |
|-----|---------|-------|
| **Admin** | Agency management, user admin, trip oversight | Agency staff |
| **OTA** | Public booking platform, cruise search | End customers |
| **Client** | Customer portal, trip details, documents | Booked travelers |
| **API** | Business logic, auth, data access | All apps |

### Package Responsibilities

| Package | Purpose |
|---------|---------|
| **database** | Drizzle schema, migrations, DB client |
| **shared-types** | TypeScript interfaces shared across apps |
| **api-client** | Generated API client for frontend apps |
| **ui-public** | Shared React components |
| **config** | ESLint, TypeScript, Prettier configs |

---

## Related Documentation

- [Security Model](./SECURITY.md) - Authentication, authorization, RLS
- [Database Architecture](./DATABASE_ARCHITECTURE.md) - Schema details, FDW setup
- [Environment Configuration](./ENVIRONMENTS.md) - Domains, CORS, env vars
- [CI/CD Pipeline](./CI_CD.md) - Deployment workflows
