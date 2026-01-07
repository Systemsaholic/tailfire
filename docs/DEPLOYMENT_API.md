# API Deployment (Railway)

This document describes Railway-specific configuration for deploying the NestJS API.

## Overview

The Tailfire API is deployed to Railway with the following environments:

| Environment | Domain | Purpose |
|-------------|--------|---------|
| **Production** | `api.tailfire.ca` | Live production API |
| **Development** | `api-dev.tailfire.ca` | Development/staging API |

---

## Build Strategy

Railway uses **Railpack** (or the project Dockerfile) to build the API. The build runs from the **repository root**, not `apps/api`.

### Dockerfile Build (Recommended)

The project includes a multi-stage Dockerfile optimized for the pnpm monorepo:

| Stage | Purpose |
|-------|---------|
| **base** | Node 20 with pnpm enabled |
| **deps** | Install dependencies for workspace packages |
| **builder** | Build @tailfire/database, @tailfire/shared-types, @tailfire/api |
| **runner** | Production image with only built artifacts |

```dockerfile
# Key build steps
RUN pnpm --filter @tailfire/database build
RUN pnpm --filter @tailfire/shared-types build
RUN pnpm --filter @tailfire/api build

# Production start
CMD ["node", "apps/api/dist/main.js"]
```

### Railway Configuration

| Setting | Value |
|---------|-------|
| **Root Directory** | `/` (repository root) |
| **Builder** | Dockerfile (or Railpack auto-detect) |
| **Watch Paths** | `apps/api/**`, `packages/**`, `Dockerfile` |

> **Note:** If using Railpack instead of Dockerfile, Railway will auto-detect the build configuration from package.json files.

---

## Health Check

| Setting | Value |
|---------|-------|
| **Path** | `/api/v1/health` |
| **Timeout** | 300 seconds |
| **Interval** | 30 seconds |

The health endpoint returns:

```json
{
  "status": "ok",
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

### Dockerfile Health Check

The Dockerfile includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3101/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

---

## Required Environment Variables

### Core Application

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Railway assigns automatically) | `${{RAILWAY_PORT}}` |
| `API_PREFIX` | API route prefix | `api/v1` |

### Database

| Variable | Description | Notes |
|----------|-------------|-------|
| `DATABASE_URL` | Supabase PostgreSQL connection | Use pooler URL for runtime |
| `SUPABASE_URL` | Supabase project URL | `https://[ref].supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Public, safe for client |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | **Secret**, bypasses RLS |
| `SUPABASE_JWT_SECRET` | JWT verification secret | From Supabase dashboard |

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Internal JWT signing key | Generate secure random string |
| `JWT_EXPIRATION` | Token expiration | `7d` |
| `ADMIN_URL` | Admin frontend URL | `https://tailfire.phoenixvoyages.ca` |

### CORS

| Variable | Description | Example |
|----------|-------------|---------|
| `CORS_ORIGINS` | Allowed origins (comma-separated) | See [Environments](./ENVIRONMENTS.md) |

### External Services

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Email service API key | Yes |
| `EMAIL_FROM_ADDRESS` | Sender email | Yes |
| `EMAIL_FROM_NAME` | Sender name | Yes |
| `TRAVELTEK_API_URL` | Cruise API endpoint | Optional |
| `TRAVELTEK_API_KEY` | Cruise API key | Optional |

### Feature Flags

| Variable | Description | Production Value |
|----------|-------------|------------------|
| `ENABLE_SWAGGER_DOCS` | Enable Swagger UI | `false` |
| `ENABLE_API_THROTTLING` | Enable rate limiting | `true` |
| `THROTTLE_TTL` | Rate limit window (seconds) | `60` |
| `THROTTLE_LIMIT` | Requests per window | `100` |
| `RUN_MIGRATIONS_ON_STARTUP` | Run migrations on boot | `false` |

---

## Migration Guard Behavior

The API includes a migration guard to prevent accidental migration runs in production:

```typescript
const shouldRunMigrations =
  process.env.NODE_ENV === 'development' ||
  process.env.RUN_MIGRATIONS_ON_STARTUP === 'true'
```

### Production Behavior

- `RUN_MIGRATIONS_ON_STARTUP` should be `false` (or unset)
- Migrations run via CI/CD **before** API deployment
- API logs: `"Skipping migrations (CI/CD handles production migrations)"`

### Development Behavior

- Migrations run automatically on startup
- Safe because dev database allows `ALLOW_DATABASE_RESET=true`

### Emergency Migration Run

If you need to run migrations from a running production instance:

1. **Temporarily** set `RUN_MIGRATIONS_ON_STARTUP=true`
2. Redeploy or restart the service
3. **Immediately** set back to `false` after success

> **Warning:** Prefer CI/CD migrations. Manual runs risk schema drift between instances.

---

## Deployment Workflow

### Automatic (Railway Auto-Deploy)

Railway automatically deploys when code is pushed to configured branches:

1. Push to `main` or `develop` triggers Railway
2. Railway can wait for GitHub Actions to complete ("Wait for CI")
3. Railway builds using Dockerfile
4. New version deploys with health check validation

### CI/CD Integration

For production deployments, Railway should be configured to "Wait for CI":

1. Push to `main` triggers both:
   - GitHub Actions `deploy-prod.yml` (runs migrations)
   - Railway deployment (waits for CI)
2. CI completes migrations successfully
3. Railway proceeds with deployment
4. Health check validates deployment

See [CI/CD Pipeline](./CI_CD.md) for full details.

### Manual Deployment

```bash
# Railway CLI
railway up

# Or trigger via Railway dashboard
```

---

## Railway CLI Commands

```bash
# Login
railway login

# Link to project
railway link

# Deploy current directory
railway up

# View logs
railway logs

# Open dashboard
railway open

# Set environment variable
railway variables set KEY=value

# List variables
railway variables
```

---

## Monitoring & Logs

### Railway Dashboard

- **Metrics**: CPU, memory, network
- **Logs**: Real-time and historical
- **Deployments**: History and rollback

### Log Levels

Set `LOG_LEVEL` environment variable:

| Level | Description |
|-------|-------------|
| `error` | Errors only |
| `warn` | Warnings and errors |
| `info` | Standard logging (recommended for production) |
| `debug` | Verbose debugging |

---

## Scaling Configuration

### Horizontal Scaling

Railway supports multiple instances. Ensure:
- Sessions are stateless (JWT-based auth)
- No in-memory state (use Redis for caching)
- Database connections use pooler

### Resource Limits

| Setting | Recommended |
|---------|-------------|
| **Memory** | 512MB - 1GB |
| **CPU** | 0.5 - 1 vCPU |
| **Instances** | 1-2 (scale as needed) |

---

## Troubleshooting

### Deployment Fails

1. Check build logs for errors
2. Verify all required env vars are set
3. Check Dockerfile builds successfully locally

### Health Check Fails

1. Verify `/api/v1/health` returns 200
2. Check `PORT` is correctly set (Railway auto-assigns)
3. Review startup logs for errors

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check if using pooler URL (recommended) vs direct
3. Verify SSL mode if required

### Migration Drift

If production schema is out of sync:

1. Check `supabase_migrations` table for applied migrations
2. Compare with `packages/database/src/migrations/`
3. Apply missing migrations via CI/CD

---

## Environment Variable Template

Copy this template for Railway environment configuration:

```bash
# Core
NODE_ENV=production
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Auth
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRATION=7d
ADMIN_URL=https://tailfire.phoenixvoyages.ca

# CORS
CORS_ORIGINS=https://tailfire.phoenixvoyages.ca,https://ota.phoenixvoyages.ca,https://client.phoenixvoyages.ca,https://phoenixvoyages.ca,https://www.phoenixvoyages.ca

# Email
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=noreply@phoenixvoyages.ca
EMAIL_FROM_NAME=Phoenix Voyages

# Features
ENABLE_SWAGGER_DOCS=false
ENABLE_API_THROTTLING=true
THROTTLE_TTL=60
THROTTLE_LIMIT=100
RUN_MIGRATIONS_ON_STARTUP=false
LOG_LEVEL=info
```

---

## Related Documentation

- [Environment Configuration](./ENVIRONMENTS.md) - Domain and variable mapping
- [CI/CD Pipeline](./CI_CD.md) - Deployment workflows
- [Local Development](./LOCAL_DEV.md) - Running locally
- [API README](../apps/api/README.md) - Full API documentation
