# Tailfire Monorepo

Travel management platform built with Turborepo, pnpm workspaces, and modern tooling.

## Structure

- `apps/admin` - B2B Admin Dashboard (Next.js)
- `apps/api` - Backend API (NestJS)
- `apps/client` - Customer-facing app (Next.js)
- `apps/ota` - OTA booking platform (Next.js)
- `packages/` - Shared libraries (config, types, database, UI)

## Getting Started

```bash
pnpm install
pnpm dev
```

## Deployment

- **Dev**: Push to `develop` → GitHub Actions → Vercel Preview
- **Prod**: Push to `main` → GitHub Actions → Vercel Production
