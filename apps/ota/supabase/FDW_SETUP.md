# FDW Setup (Catalog Access)

This document describes how to configure the Dev Supabase project to read
catalog data from the Prod Supabase project using Postgres FDW.

## Prerequisites

Create a read-only user in Prod (catalog only) and store the password in
Supabase Vault for the Dev project.

### 1) Create a read-only FDW user on Prod

Run in the **Prod** database:

```sql
CREATE USER fdw_catalog_ro WITH PASSWORD '<STRONG_PASSWORD>';

GRANT USAGE ON SCHEMA catalog TO fdw_catalog_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO fdw_catalog_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA catalog
  GRANT SELECT ON TABLES TO fdw_catalog_ro;
```

### 2) Store the password in Vault (Dev)

Run in the **Dev** database:

```sql
SELECT vault.create_secret('fdw_password', '<STRONG_PASSWORD>');
```

## Migration Location

The FDW migration is now managed by **Drizzle ORM**:

```
packages/database/src/migrations/20260104205000_setup_catalog_fdw.sql
```

**Password Injection**: The migration contains a `__FDW_PASSWORD__` placeholder.
- CI automatically injects from Doppler secret `FDW_CATALOG_PASSWORD` (dev only)
- Production skips FDW setup via environment guard (catalog is local)

## Apply the Migration

Run from project root:

```bash
cd apps/api && pnpm db:migrate
```

The migration:
- Skips FDW setup if `catalog.cruise_lines` is a local table (Production)
- Otherwise recreates `catalog` as a foreign schema with the allowlisted tables (Dev)

## Notes

- If catalog queries are slow in Dev, consider adding materialized views in
  the Dev project for hot tables.
