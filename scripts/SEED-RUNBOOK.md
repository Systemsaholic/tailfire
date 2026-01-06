# Public Schema Seed Runbook

## Files

| File | Purpose |
|------|---------|
| `seed-public.sql` | Agencies, amenities, tags (idempotent) |
| `seed-admin.sql` | Admin user bootstrap template |

## Dev Environment

```bash
# 1. Run public seed via Supabase MCP or psql
psql $DATABASE_URL < scripts/seed-public.sql

# 2. Create admin user in Supabase Dashboard
#    Dashboard → Authentication → Users → Invite user
#    Copy the user's UUID after creation

# 3. Update seed-admin.sql with actual values
#    Replace __AUTH_USER_UUID__ and __ADMIN_EMAIL__

# 4. Run admin seed
psql $DATABASE_URL < scripts/seed-admin.sql
```

## Prod Environment

```bash
# Requires manual approval before running

# 1. Review seed script
cat scripts/seed-public.sql

# 2. Run on Prod
psql $PROD_DATABASE_URL < scripts/seed-public.sql

# 3. Create admin user (separate email from Dev)
# 4. Run seed-admin.sql with Prod admin credentials
```

## Validation Queries

```sql
-- Verify counts
SELECT
  (SELECT COUNT(*) FROM agencies) as agencies,      -- expect: 1
  (SELECT COUNT(*) FROM amenities) as amenities,    -- expect: 18
  (SELECT COUNT(*) FROM tags) as tags;              -- expect: 15

-- Verify agency
SELECT id, name, slug FROM agencies;

-- Verify admin user
SELECT id, email, role, status FROM user_profiles WHERE role = 'admin';

-- Verify catalog FDW (Dev only)
SELECT COUNT(*) FROM catalog.cruise_lines;
```

## Idempotency

All seed scripts use `ON CONFLICT ... DO UPDATE` and are safe to run multiple times.

## Notes

- Agency ID `00000000-0000-0000-0000-000000000001` is reserved for Phoenix Voyages
- Amenity categories must match enum: `connectivity`, `facilities`, `dining`, `services`, `parking`, `accessibility`, `room_features`, `family`, `pets`, `other`
- Admin user requires Supabase Auth user created first (UUID must match)
