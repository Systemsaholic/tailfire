# Database Migrations

## Single Source of Truth

All database migrations are managed through **Drizzle ORM**.

```
packages/database/src/migrations/
├── meta/
│   └── _journal.json          # Migration tracker
├── 0000_aberrant_mikhail_rasputin.sql
├── 0001_polite_piledriver.sql
├── ...
└── 20260104205000_setup_catalog_fdw.sql
```

## Running Migrations

### Local Development

```bash
cd apps/api
pnpm db:migrate
```

### CI/CD

Migrations run automatically in the `deploy-api-migrations` job on push to `develop` or `main`.

## Environment-Specific Behavior

### Foreign Data Wrapper (FDW)

The `20260104205000_setup_catalog_fdw.sql` migration contains an environment guard:

- **Dev**: Creates FDW connection to Prod's `catalog` schema
- **Prod**: Skips FDW setup (catalog tables are local)

The guard checks if `catalog.cruise_lines` is a regular table (`relkind='r'`) vs foreign table (`relkind='f'`).

## Database Connection Requirements

Migrations require **session mode** (port 5432). Transaction pooler (port 6543) does **not** support DDL operations.

### Connection Options

| Mode | Port | DDL Support | Notes |
|------|------|-------------|-------|
| Direct connection | 5432 | ✅ | IPv6 only - not available in GitHub Actions |
| Session pooler | 5432 | ✅ | IPv4 compatible - used in CI/CD |
| Transaction pooler | 6543 | ❌ | Does not support migrations |

### CI/CD Connection (GitHub Actions)

GitHub Actions does not support IPv6, so CI uses the **Supavisor session pooler**:

```
postgres://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-ca-central-1.pooler.supabase.com:5432/postgres
```

Get the exact connection string from the Supabase dashboard → Connect → Session pooler.

| Environment | Dashboard |
|-------------|-----------|
| Dev | [gaqacfstpnmwphekjzae](https://supabase.com/dashboard/project/gaqacfstpnmwphekjzae?showConnect=true) |
| Prod | [cmktvanwglszgadjrorm](https://supabase.com/dashboard/project/cmktvanwglszgadjrorm?showConnect=true) |

### Local Development

For local development, you can use either direct connection (if your network supports IPv6) or the session pooler.

The CI pipeline validates connection mode before running migrations.

## Creating New Migrations

### Schema Changes

1. Modify schema in `packages/database/src/schema/`
2. Generate migration:
   ```bash
   cd packages/database
   pnpm drizzle-kit generate
   ```
3. Review generated SQL in `src/migrations/`
4. Commit and push

### Custom SQL Migrations

1. Create SQL file with timestamp prefix: `YYYYMMDDHHMMSS_description.sql`
2. Add entry to `meta/_journal.json`
3. Commit and push

## Deprecated: Supabase CLI Migrations

The `apps/ota/supabase/migrations/` directory is deprecated. All files have been archived to `_archive/`.

**Do not create new migrations in this directory.** The CI pipeline will fail if `.sql` files are found outside `_archive/`.

## Migration History

The `drizzle.__drizzle_migrations` table tracks applied migrations. Never manually insert into this table - let Drizzle manage it.

Historical Supabase migrations are recorded in `supabase_migrations` but are no longer used.
