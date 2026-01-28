# Repository Guidelines

## Project Structure & Module Organization
- `apps/` holds the runnable products: `admin` (Next.js B2B dashboard), `api` (NestJS), `client` (Next.js), `ota` (Next.js).
- `packages/` contains shared libraries/config: `config/` (ESLint/TS config), `database/` (Drizzle schema + migrations), `shared-types/`, `api-client/`, `ui-public/`.
- `docs/` is the canonical reference for architecture, environments, CI/CD, and testing.
- `scripts/` contains operational runbooks and tooling.

## Build, Test, and Development Commands
- `pnpm install` installs workspace dependencies (Node >= 20, pnpm 10).
- `pnpm dev` runs all apps via Turborepo.
- `pnpm build` builds all apps/packages; `pnpm lint` and `pnpm typecheck` run monorepo checks.
- `pnpm test` runs all tests; target a workspace with `pnpm --filter @tailfire/api test`.
- API-specific examples: `pnpm --filter @tailfire/api build`, `pnpm --filter @tailfire/api start`.

## Coding Style & Naming Conventions
- TypeScript-first codebase (Next.js + NestJS). Follow ESLint rules and Prettier defaults from `packages/config/`.
- Prefer explicit, domain-focused names (`trip`, `booking`, `itinerary`) over generic terms.
- Test naming conventions:
  - Unit/Integration: `*.test.ts` (often in `tests/unit` or `tests/integration`, or co-located).
  - E2E: `*.spec.ts` under `tests/e2e/`.
  - Helpers: `*-helper.ts`, factories: `*-factories.ts` in `tests/helpers/`.

## Testing Guidelines
- Frameworks: Jest for unit/integration, Playwright for E2E.
- Coverage targets are 70% for lines/branches/functions/statements.
- App-level examples:
  - `cd apps/api && pnpm test:e2e`
  - `cd apps/admin && pnpm test:e2e`

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (e.g., `fix(api): ...`, `docs: ...`).
- PRs should include a clear description, linked issue (if applicable), and screenshots/GIFs for UI changes.
- Add or update tests when behavior changes; update docs in `docs/` if workflows or architecture shift.

## Security & Configuration Tips
- Use the provided `.env.example` files for local setup; keep secrets out of git.
- For environment details and ports, reference `docs/LOCAL_DEV.md` and `docs/ENVIRONMENTS.md`.

## Agent-Specific Instructions
- Act as a Senior Systems Architect focused on scalable travel agency back office, OTA, B2C, and B2B platforms.
- Provide critical feedback and recommendations on plans, refactors, and code structure; do not modify files or code unless explicitly requested.
