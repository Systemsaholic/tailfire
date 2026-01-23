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

## Storage System (Multi-Provider)

The application supports multiple storage providers with automatic failover:
- **Cloudflare R2** (primary) - S3-compatible, cost-effective
- **Backblaze B2** - S3-compatible, very low storage costs
- **Supabase Storage** - Integrated with Supabase

### Buckets
- **Documents**: `tailfire-documents` (PDFs, contracts - private, signed URLs)
- **Media**: `tailfire-media` / `tailfire-media-stg` (images, cover photos - public URLs)

### Key Files
- `apps/api/src/storage/providers/storage-provider.interface.ts` - Provider interface
- `apps/api/src/storage/providers/storage-provider.factory.ts` - Creates and caches providers
- `apps/api/src/trips/storage.service.ts` - High-level storage operations
- `apps/api/src/api-credentials/credential-resolver.service.ts` - Resolves credentials from Doppler

### Provider-Aware URL Generation
Each provider implements `getPublicUrl(path)` to generate URLs appropriate for that provider:
- **Supabase**: `{supabaseUrl}/storage/v1/object/public/{bucket}/{path}`
- **R2**: `{publicUrl}/{path}` (requires R2_MEDIA_PUBLIC_URL)
- **B2**: `{publicUrl}/{path}` (requires B2 public URL config)

The `StorageService` uses the active provider's `getPublicUrl()` method, ensuring URLs match where files are actually stored.

### Important: Module Initialization Order
The `StorageProviderFactory` must NOT call `credentialResolver.isAvailable()` before creating providers. This is because `CredentialResolverService.onModuleInit()` may not have run yet when `StorageService.onModuleInit()` executes. The `resolve()` method already handles missing credentials by throwing `ConfigurationError`.

### Unsplash Integration
Stock photos are provided via Unsplash API. Credentials are managed through Doppler as a shared credential across environments.
