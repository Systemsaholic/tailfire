# Claude Code Project Guidelines - Tailfire

## Critical Rules

### 1. NEVER Apply Database Changes Directly to Production

**DO NOT:**
- Use Supabase MCP `execute_sql` for DDL or data changes on production
- Use Supabase MCP `apply_migration` on production
- Manually fix sequences, constraints, or schema on production

**ALWAYS:**
- Let CI/CD (`deploy-prod.yml`) handle all production database changes
- Only use `execute_sql` for READ-ONLY validation queries (SELECT only)

### 2. NEVER Push Directly to Main Without Preview

**DO NOT:**
- Commit and push directly to `main` branch
- Skip the dev/preview deployment step

**ALWAYS:**
1. Create a feature branch (e.g., `feature/phase-12-storage`)
2. Push to feature branch to trigger `deploy-dev.yml`
3. Verify changes work on preview environment
4. Create PR and merge to `main` for production deployment

## Migration Workflow

See `packages/database/MIGRATIONS.md` for detailed migration conventions.

Quick reference:
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Create migration with timestamp
TIMESTAMP=$(date -u +%Y%m%d%H%M%S)
touch packages/database/src/migrations/${TIMESTAMP}_description.sql

# 3. Register in meta/_journal.json

# 4. Push to feature branch (triggers dev deployment)
git push -u origin feature/your-feature

# 5. Verify on dev environment

# 6. Create PR to main (triggers prod deployment after merge)
```

## Supabase MCP Usage

| Tool | Allowed Usage | Forbidden Usage |
|------|---------------|-----------------|
| `execute_sql` | SELECT queries for validation | INSERT, UPDATE, DELETE, DDL |
| `apply_migration` | Never use | All usage |
| `list_tables` | Always allowed | - |
| `list_migrations` | Always allowed | - |
| `get_logs` | Always allowed | - |

## Environment URLs

### Production
- **API**: https://api.tailfire.ca
- **Admin**: https://tailfire.phoenixvoyages.ca
- **OTA**: https://ota.phoenixvoyages.ca
- **Client**: https://client.phoenixvoyages.ca

### Dev/Preview
- **API**: https://api-dev.tailfire.ca
- **Admin**: https://tf-demo.phoenixvoyages.ca

## Storage System (Cloudflare R2)

The application uses Cloudflare R2 for file storage with two buckets:
- **Documents**: `tailfire-documents` (PDFs, contracts, etc.)
- **Media**: `tailfire-media` / `tailfire-media-stg` (images, cover photos, gallery)

### Key Files
- `apps/api/src/storage/providers/storage-provider.factory.ts` - Creates storage providers
- `apps/api/src/api-credentials/credential-resolver.service.ts` - Resolves credentials from Doppler

### Important: Module Initialization Order
The `StorageProviderFactory` must NOT call `credentialResolver.isAvailable()` before creating providers. This is because `CredentialResolverService.onModuleInit()` may not have run yet when `StorageService.onModuleInit()` executes. The `resolve()` method already handles missing credentials by throwing `ConfigurationError`.

### Unsplash Integration
Stock photos are provided via Unsplash API. Credentials are managed through Doppler as a shared credential across environments.
