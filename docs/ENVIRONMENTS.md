# Environment Configuration

This document describes the domain mapping, CORS allowlists, and environment-specific URLs for Tailfire.

## Environment Inventory

### Dev (Local)

- **Supabase project:** Tailfire-Preview (`gaqacfstpnmwphekjzae`) (shared with Preview)
- **Admin:** `http://localhost:3100`
- **API:** `http://localhost:3101`
- **OTA:** `http://localhost:3103`
- **Client:** `http://localhost:3102`

### Preview (Cloud)

- **Supabase project:** Tailfire-Preview (`gaqacfstpnmwphekjzae`)
- **Admin:** `https://tailfire-dev.phoenixvoyages.ca` (alias: `https://tf-demo.phoenixvoyages.ca`)
- **OTA:** `https://ota-dev.phoenixvoyages.ca`
- **Client:** `https://client-dev.phoenixvoyages.ca`
- **API:** `https://api-dev.tailfire.ca`
- **Railway service:** `api-dev`
- **Branch:** `preview`

### Production (Cloud)

- **Supabase project:** Tailfire-Prod (`cmktvanwglszgadjrorm`)
- **Admin:** `https://tailfire.phoenixvoyages.ca`
- **OTA:** `https://ota.phoenixvoyages.ca`
- **OTA root:** `https://phoenixvoyages.ca`, `https://www.phoenixvoyages.ca`
- **Client:** `https://client.phoenixvoyages.ca`
- **API:** `https://api.tailfire.ca`
- **Railway service:** `api-prod`
- **Branch:** `main`

## Domain Mapping

### Production Domains

| App | Domain | Platform | Purpose |
|-----|--------|----------|---------|
| **API** | `api.tailfire.ca` | Railway | Production NestJS API |
| **Admin** | `tailfire.phoenixvoyages.ca` | Vercel | B2B admin dashboard |
| **OTA** | `ota.phoenixvoyages.ca` | Vercel | OTA booking platform |
| **Client** | `client.phoenixvoyages.ca` | Vercel | Customer-facing app |
| **Marketing** | `phoenixvoyages.ca`, `www.phoenixvoyages.ca` | External | Main agency website (OTA may run here) |

### Preview Domains

| App | Domain | Platform | Purpose |
|-----|--------|----------|---------|
| **API (Dev)** | `api-dev.tailfire.ca` | Railway | Development API |
| **Admin (Dev)** | `tailfire-dev.phoenixvoyages.ca` | Vercel | Development admin |
| **OTA (Dev)** | `ota-dev.phoenixvoyages.ca` | Vercel | Development OTA |
| **Client (Dev)** | `client-dev.phoenixvoyages.ca` | Vercel | Development client |

### Local Development

| App | URL | Port |
|-----|-----|------|
| **Admin** | `http://localhost:3100` | 3100 |
| **API** | `http://localhost:3101/api/v1` | 3101 |
| **OTA** | `http://localhost:3103` | 3103 |
| **Client** | `http://localhost:3102` | 3102 |

---

## CORS Configuration

CORS is configured in `apps/api/src/main.ts` via the `CORS_ORIGINS` environment variable.

### Local Development (Default)

When `CORS_ORIGINS` is not set, the API allows:
```
http://localhost:3100
http://localhost:3101
http://localhost:3102
http://localhost:3103
```

### Production CORS Allowlist

```bash
CORS_ORIGINS=https://tailfire.phoenixvoyages.ca,https://ota.phoenixvoyages.ca,https://client.phoenixvoyages.ca,https://phoenixvoyages.ca,https://www.phoenixvoyages.ca
```

> **Note:** The root domain (`phoenixvoyages.ca` and `www.phoenixvoyages.ca`) must be included because OTA may run at the root domain.

### Preview CORS Allowlist

```bash
CORS_ORIGINS=https://tailfire-dev.phoenixvoyages.ca,https://ota-dev.phoenixvoyages.ca,https://client-dev.phoenixvoyages.ca
```

### Preview Deployments (Vercel)

For Vercel preview deployments, you have two options:

1. **Add explicit preview URLs** to the allowlist as they're created
2. **Implement dynamic origin checking** in the API (the default CORS middleware does not support wildcards like `*.vercel.app`)

Example dynamic origin checker pattern:
```typescript
origin: (origin, callback) => {
  const allowed = process.env.CORS_ORIGINS?.split(',') || []
  if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
    callback(null, true)
  } else {
    callback(new Error('Not allowed by CORS'))
  }
}
```

---

## Environment Variable Matrix

### API (`apps/api`) - Railway

| Variable | Local | Railway Dev | Railway Prod |
|----------|-------|-------------|--------------|
| `NODE_ENV` | `development` | `development` | `production` |
| `PORT` | `3101` | (Railway assigns) | (Railway assigns) |
| `DATABASE_URL` | Preview Supabase | Preview Supabase | Prod Supabase |
| `SUPABASE_URL` | Preview project URL | Preview project URL | Prod project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview key | Preview key | Prod key |
| `CORS_ORIGINS` | (default localhost) | Preview allowlist | Prod allowlist |
| `ADMIN_URL` | `http://localhost:3100` | `https://tailfire-dev.phoenixvoyages.ca` | `https://tailfire.phoenixvoyages.ca` |
| `RUN_MIGRATIONS_ON_STARTUP` | `true` (implicit) | `false` | `false` |
| `ENABLE_SWAGGER_DOCS` | `true` | `true` | `false` |

### Admin (`apps/admin`) - Vercel

| Variable | Local | Vercel Dev | Vercel Prod |
|----------|-------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3101/api/v1` | `https://api-dev.tailfire.ca/api/v1` | `https://api.tailfire.ca/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview project URL | Preview project URL | Prod project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview anon key | Preview anon key | Prod anon key |

### OTA (`apps/ota`) - Vercel

| Variable | Local | Vercel Dev | Vercel Prod |
|----------|-------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3101/api/v1` | `https://api-dev.tailfire.ca/api/v1` | `https://api.tailfire.ca/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview project URL | Preview project URL | Prod project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview anon key | Preview anon key | Prod anon key |

### Client (`apps/client`) - Vercel

| Variable | Local | Vercel Dev | Vercel Prod |
|----------|-------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3101/api/v1` | `https://api-dev.tailfire.ca/api/v1` | `https://api.tailfire.ca/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview project URL | Preview project URL | Prod project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview anon key | Preview anon key | Prod anon key |

---

## Supabase Projects

| Environment | Project Ref | Purpose |
|-------------|-------------|---------|
| **Dev (Beta)** | `hplioumsywqgtnhwcivw` | Legacy beta project (separate purpose) |
| **Preview** | `gaqacfstpnmwphekjzae` | Preview database, shared with Local Dev |
| **Production** | `cmktvanwglszgadjrorm` | Production database, catalog source |

### Database Connection Types

| Type | Format | Usage |
|------|--------|-------|
| **Direct TCP** | `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres` | Migrations (requires service role) |
| **Pooler** | `postgresql://postgres.[ref]:[password]@aws-1-ca-central-1.pooler.supabase.com:6543/postgres` | Application runtime |

---

## Railway Quick Reference

Quick reference for Railway API deployment configuration:

| Setting | Development | Production |
|---------|-------------|------------|
| **Domain** | `api-dev.tailfire.ca` | `api.tailfire.ca` |
| **Git Branch** | `preview` | `main` |
| **NODE_ENV** | `development` | `production` |
| **Supabase Project** | `gaqacfstpnmwphekjzae` | `cmktvanwglszgadjrorm` |
| **Health Check** | `/api/v1/health` | `/api/v1/health` |
| **Migrations** | CI/CD (not runtime) | CI/CD (not runtime) |

### Key Differences Between Environments

| Variable | Must Differ? | Notes |
|----------|--------------|-------|
| `NODE_ENV` | Yes | `development` vs `production` |
| `DATABASE_URL` | Yes | Different Supabase projects |
| `SUPABASE_*` keys | Yes | Different Supabase projects |
| `JWT_SECRET` | Yes | Security: unique per environment |
| `CORS_ORIGINS` | Yes | Different frontend domains |
| `ADMIN_URL` | Yes | Different admin domains |
| `ENABLE_SWAGGER_DOCS` | Yes | `true` in dev, `false` in prod |
| `RUN_MIGRATIONS_ON_STARTUP` | No | `false` in both (CI/CD handles) |

See [API Deployment](./DEPLOYMENT_API.md) for full Railway configuration details.

---

## Supabase Auth URL Configuration

For each environment, configure in Supabase Dashboard > Authentication > URL Configuration:

### Production
- **Site URL:** `https://tailfire.phoenixvoyages.ca`
- **Redirect URLs:**
  - `https://tailfire.phoenixvoyages.ca/auth/callback`
  - `https://tailfire.phoenixvoyages.ca/auth/reset-password`

### Development
- **Site URL:** `https://tailfire-dev.phoenixvoyages.ca`
- **Redirect URLs:**
  - `https://tailfire-dev.phoenixvoyages.ca/auth/callback`
  - `https://tailfire-dev.phoenixvoyages.ca/auth/reset-password`
  - `http://localhost:3100/auth/callback`
  - `http://localhost:3100/auth/reset-password`

---

## Related Documentation

- [Local Development](./LOCAL_DEV.md) - Port assignments and startup commands
- [CI/CD Pipeline](./CI_CD.md) - Deployment workflows
- [API Deployment](./DEPLOYMENT_API.md) - Railway configuration
