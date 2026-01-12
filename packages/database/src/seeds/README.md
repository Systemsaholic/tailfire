# Database Seeds

Seed scripts for populating test data in development and QA environments.

## Available Seeds

| Script | Description |
|--------|-------------|
| `test-users.sql` | Creates test users with @phoenixvoyages.ca emails |

## Usage

### Via psql (recommended)

```bash
# From project root
psql $DATABASE_URL -f packages/database/src/seeds/test-users.sql
```

### Via Supabase MCP

For dev environments only, you can run seeds via Supabase MCP `execute_sql`.
Copy the content of the seed file and execute it.

## Test Users

After running `test-users.sql`:

| Email | Password | Role |
|-------|----------|------|
| `admin@phoenixvoyages.ca` | `Phoenix2026!` | admin |
| `agent@phoenixvoyages.ca` | `Phoenix2026!` | user |
| `test@phoenixvoyages.ca` | `Phoenix2026!` | user |

All users belong to the Phoenix Voyages agency (`00000000-0000-0000-0000-000000000001`).

User IDs are deterministic:
- admin: `aaaa0001-0000-0000-0000-000000000001`
- agent: `aaaa0002-0000-0000-0000-000000000002`
- test: `aaaa0003-0000-0000-0000-000000000003`

## Important Notes

- **Never run seeds on production** - these are for development/QA only
- Seeds are **idempotent** - safe to run multiple times (they delete and recreate)
- UUIDs are **deterministic** - same UUIDs every time for consistent testing
