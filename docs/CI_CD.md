# CI/CD Pipeline

This document describes the GitHub Actions workflows for deploying Tailfire applications.

## Overview

Tailfire uses two primary deployment workflows:

| Workflow | Trigger | Target | Purpose |
|----------|---------|--------|---------|
| `deploy-dev.yml` | Push to `develop` | Dev/Preview environments | Development testing |
| `deploy-prod.yml` | Push to `main` | Production environments | Production release |

---

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        deploy-dev.yml                           │
│                     (push to develop)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Deploy API Migrations (Drizzle → Dev Supabase)              │
│     └─ Builds database package, runs pnpm db:migrate            │
│  2. Deploy OTA Migrations (Supabase CLI → Dev project)          │
│     └─ Pushes FDW schema, verifies catalog access               │
│  3. Deploy Admin to Vercel Preview (after migrations)           │
│  4. Deploy OTA to Vercel Preview (after migrations)             │
│  5. Deploy Client to Vercel Preview (after migrations)          │
│                                                                 │
│  Note: API deploys separately via Railway auto-deploy           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       deploy-prod.yml                           │
│                       (push to main)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Deploy API Migrations (Drizzle → Prod Supabase)             │
│     └─ Builds database package, runs pnpm db:migrate            │
│  2. Deploy OTA Migrations (Supabase CLI → Prod project)         │
│     └─ FDW guard logic no-ops in Prod (local catalog exists)    │
│     └─ Verifies catalog access                                  │
│  3. Deploy Admin to Vercel Production (after migrations)        │
│  4. Deploy OTA to Vercel Production (after migrations)          │
│  5. Deploy Client to Vercel Production (after migrations)       │
│                                                                 │
│  Note: API deploys separately via Railway auto-deploy           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### Two Migration Systems

Tailfire uses two separate migration systems for different purposes:

| System | Tool | Database | Purpose |
|--------|------|----------|---------|
| **API Migrations** | Drizzle ORM | Supabase PostgreSQL | Core application schema |
| **OTA Migrations** | Supabase CLI | Supabase PostgreSQL | FDW for catalog data access |

### API Migrations (Drizzle)

Drizzle migrations handle the core application schema:

```yaml
# CI migration step
- name: Run Drizzle migrations
  working-directory: apps/api
  env:
    DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
  run: pnpm db:migrate
```

### OTA Migrations (Supabase CLI)

Supabase CLI migrations handle the Foreign Data Wrapper setup for catalog access:

```yaml
# CI migration step
- name: Push OTA migrations
  working-directory: apps/ota
  env:
    SUPABASE_DB_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}
  run: supabase db push --linked

- name: Verify catalog access
  run: supabase db query "SELECT 1 FROM catalog.cruise_lines LIMIT 1"
```

### FDW Guard Logic

The OTA migrations include guard logic for environment-specific behavior:

- **Development**: FDW migration activates (connects to Prod catalog)
- **Production**: FDW migration no-ops (local catalog schema exists)

This allows the same migration files to work across environments while keeping `supabase_migrations` table in sync.

### Migration Guard Behavior (API Runtime)

In `apps/api/src/main.ts`:

```typescript
const shouldRunMigrations =
  process.env.NODE_ENV === 'development' ||
  process.env.RUN_MIGRATIONS_ON_STARTUP === 'true'

if (shouldRunMigrations) {
  await runMigrations(databaseUrl)
} else {
  console.info('Skipping migrations (CI/CD handles production migrations)')
}
```

---

## Railway API Deployment

The API is deployed via Railway's automatic deployment feature, not through GitHub Actions.

### How It Works

1. Railway monitors the repository for pushes to configured branches
2. When a push occurs, Railway:
   - Pulls the latest code
   - Builds using Railpack/Docker
   - Deploys the new version
3. Railway can be configured to "Wait for CI" - blocking deployment until GitHub Actions pass

### "Wait for CI" Configuration

In Railway project settings:
- **Enable GitHub CI check**: Link the repository
- **Wait for CI**: Enable "Wait for GitHub Actions to pass before deploying"

### Why This Matters

- Migrations run in CI **before** Railway deployment starts
- Railway waits for CI to pass, ensuring schema is updated first
- Prevents deploying API code that expects new schema before migrations complete

---

## Workflow Jobs Summary

### `deploy-dev.yml`

| Job | Purpose | Dependencies |
|-----|---------|--------------|
| `deploy-api-migrations` | Run Drizzle migrations to Dev Supabase | - |
| `deploy-ota-migrations` | Run Supabase CLI migrations for FDW | - |
| `deploy-admin` | Deploy Admin to Vercel Preview | `deploy-api-migrations`, `deploy-ota-migrations` |
| `deploy-ota` | Deploy OTA to Vercel Preview | `deploy-api-migrations`, `deploy-ota-migrations` |
| `deploy-client` | Deploy Client to Vercel Preview | `deploy-api-migrations`, `deploy-ota-migrations` |

### `deploy-prod.yml`

| Job | Purpose | Dependencies |
|-----|---------|--------------|
| `deploy-api-migrations` | Run Drizzle migrations to Prod Supabase | - |
| `deploy-ota-migrations` | Run Supabase CLI migrations (FDW no-op) | - |
| `deploy-admin` | Deploy Admin to Vercel Production | `deploy-api-migrations`, `deploy-ota-migrations` |
| `deploy-ota` | Deploy OTA to Vercel Production | `deploy-api-migrations`, `deploy-ota-migrations` |
| `deploy-client` | Deploy Client to Vercel Production | `deploy-api-migrations`, `deploy-ota-migrations` |

---

## GitHub Secrets Required

### Supabase

| Secret | Used For |
|--------|----------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI authentication |
| `DEV_SUPABASE_PROJECT_REF` | Development project reference |
| `PROD_SUPABASE_PROJECT_REF` | Production project reference |
| `DEV_DATABASE_URL` | Dev Supabase direct connection (Drizzle migrations) |
| `PROD_DATABASE_URL` | Prod Supabase direct connection (Drizzle migrations) |
| `DEV_DB_PASSWORD` | Dev database password (Supabase CLI) |
| `PROD_DB_PASSWORD` | Prod database password (Supabase CLI) |

### Vercel

| Secret | Used For |
|--------|----------|
| `VERCEL_TOKEN` | Vercel API authentication |
| `VERCEL_ORG_ID` | Vercel organization identifier |
| `VERCEL_ADMIN_PROJECT_ID` | Vercel project ID for Admin app |
| `VERCEL_OTA_PROJECT_ID` | Vercel project ID for OTA app |
| `VERCEL_CLIENT_PROJECT_ID` | Vercel project ID for Client app |

---

## Deployment Targets

| App | Platform | Dev Environment | Prod Environment |
|-----|----------|-----------------|------------------|
| **API** | Railway | `api-dev.tailfire.ca` | `api.tailfire.ca` |
| **Admin** | Vercel | Preview URLs | `tailfire.phoenixvoyages.ca` |
| **OTA** | Vercel | Preview URLs | `ota.phoenixvoyages.ca` |
| **Client** | Vercel | Preview URLs | `client.phoenixvoyages.ca` |

---

## Rollback Procedures

### API (Railway)

1. Go to Railway dashboard > Deployments
2. Select the previous successful deployment
3. Click "Rollback to this deployment"

> **Warning:** Database migrations are not automatically rolled back. If a migration caused issues, create a new migration to revert changes.

### Frontend (Vercel)

1. Go to Vercel dashboard > Deployments
2. Find the previous production deployment
3. Click "..." > "Promote to Production"

---

## Related Documentation

- [Environment Configuration](./ENVIRONMENTS.md) - Domain and environment variables
- [Local Development](./LOCAL_DEV.md) - Running apps locally
- [API Deployment](./DEPLOYMENT_API.md) - Railway-specific settings
- [FDW Setup](../apps/ota/supabase/FDW_SETUP.md) - Foreign Data Wrapper configuration
