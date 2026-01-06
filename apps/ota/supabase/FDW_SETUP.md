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

## Migration Placeholders

Edit the FDW migration file:
`tailfire/apps/ota/supabase/migrations/20260104205000_setup_catalog_fdw.sql`

Replace:
- `<PROD_DB_HOST>` with `db.<prod-project-ref>.supabase.co`
- `<PROD_FDW_USER>` with `fdw_catalog_ro` (or your chosen read-only user)

## Apply the Migration

Use your standard Supabase migration workflow for `apps/ota`.
The migration:
- Skips FDW setup if `catalog` already exists locally.
- Otherwise recreates `catalog` as a foreign schema with the allowlisted tables.

## Notes

- If catalog queries are slow in Dev, consider adding materialized views in
  the Dev project for hot tables.
