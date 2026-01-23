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

## Doppler CLI

Environment secrets are managed via Doppler. The CLI is available for managing secrets.

### Project and Configs
- **Project**: `tailfire`
- **Configs**: `dev`, `stg` (staging/preview), `prd` (production)

### Common Commands
```bash
# List all projects
doppler projects

# List configs for tailfire
doppler configs -p tailfire

# View secrets (masked)
doppler secrets -p tailfire -c dev

# Set a secret
doppler secrets set KEY="value" -p tailfire -c dev

# Set multiple secrets
doppler secrets set KEY1="value1" KEY2="value2" -p tailfire -c prd

# Delete a secret
doppler secrets delete KEY -p tailfire -c dev
```

### Key Secrets
| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `INTERNAL_API_KEY` | API key for internal endpoints (cruise-import) |
| `ENABLE_SCHEDULED_CRUISE_SYNC` | Enable daily cruise sync cron (`true`/`false`) |

## Environment URLs

### Production
- **API**: https://api.tailfire.ca
- **Admin**: https://tailfire.phoenixvoyages.ca
- **OTA**: https://ota.phoenixvoyages.ca
- **Client**: https://client.phoenixvoyages.ca

### Dev/Preview
- **API**: https://api-dev.tailfire.ca
- **Admin**: https://tf-demo.phoenixvoyages.ca

### Local Development (Turbo Repo)
- **Admin**: http://localhost:3100
- **API**: http://localhost:3101 (prefix: `api/v1`)
- **API Docs**: http://localhost:3101/api/v1/docs (when `ENABLE_SWAGGER_DOCS=true`)

Start all services: `turbo dev` from project root

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

## Cruise Catalog (FDW Architecture)

The cruise catalog data is synchronized from Traveltek FTP and uses Foreign Data Wrapper (FDW) to share data across environments.

### Architecture

| Environment | Database | Cruise Data Source | Notes |
|-------------|----------|-------------------|-------|
| **Local Dev** | tailfire-Dev | Local `catalog` schema | For offline development |
| **Preview** | Tailfire-Preview | FDW → Prod `catalog` | Reads from production |
| **Prod** | Tailfire-Prod | Local `catalog` schema | **Source of truth** |

### Data Flow
- **Production**: Traveltek FTP sync runs daily at 2 AM → populates `catalog.*` tables
- **Preview**: FDW queries routed to Production → always has current data
- **Local Dev**: Has local copy for development isolation (may drift from Prod)

### Key Points
- **DO NOT sync cruise data to dev/preview databases** - they should use FDW to production
- The FDW migration (`20260104205000_setup_catalog_fdw.sql`) auto-detects environment
- If local `catalog` tables exist, FDW setup is skipped (guard clause)
- Production has 16 catalog tables; other environments import them as foreign tables

### Sync Endpoints (Protected by Internal API Key)
```bash
# Test connection
curl https://api.tailfire.ca/api/v1/cruise-import/test-connection \
  -H "x-internal-api-key: <key>"

# Trigger sync
curl -X POST https://api.tailfire.ca/api/v1/cruise-import/sync \
  -H "x-internal-api-key: <key>" \
  -H "Content-Type: application/json" \
  -d '{"concurrency": 4}'

# Check status
curl https://api.tailfire.ca/api/v1/cruise-import/sync/status \
  -H "x-internal-api-key: <key>"
```

### Cruise Repository API (Tiered Auth)
- **JWT auth** (admin/client portal): No rate limiting
- **API key auth** (`x-catalog-api-key`): 30 req/min rate limit
- Both auth types work for `/cruise-repository/*` endpoints
