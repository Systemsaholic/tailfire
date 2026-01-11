# Archived Supabase Migrations

**DEPRECATED**: These migrations are no longer active.

## Migration Status

All database migrations are now managed exclusively through **Drizzle ORM**.

- **Single Source of Truth**: `packages/database/src/migrations/`
- **Migration Tracker**: `packages/database/src/migrations/meta/_journal.json`
- **Run Command**: `pnpm db:migrate` (from `apps/api`)

## Archived Files

| File | Status | Notes |
|------|--------|-------|
| `20260104205000_setup_catalog_fdw.sql` | Moved to Drizzle | Now at `packages/database/src/migrations/` |
| `20260109161006_sync_activity_tables.sql` | Retired | Duplicate of Drizzle migration idx 44 |

## Why Archived?

1. **Consolidation**: Single migration system reduces complexity
2. **CI Simplification**: Only `pnpm db:migrate` runs in CI
3. **Consistency**: All environments use the same migration tooling

## Historical Context

These migrations were created during the OTA app development before the decision to consolidate all migrations under Drizzle. The `supabase_migrations` table in the database retains historical records but is no longer used for tracking.

---

*Archived: January 2026*
