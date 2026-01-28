#!/bin/bash
# Migrate cruise data from Dev catalog to Prod catalog
# Usage: ./migrate_cruise_to_prod.sh

# Get connection strings from Doppler or set manually
# DEV_DB="postgresql://postgres.hplioumsywqgtnhwcivw:[PASSWORD]@aws-0-ca-central-1.pooler.supabase.com:5432/postgres"
# PROD_DB="postgresql://postgres.cmktvanwglszgadjrorm:[PASSWORD]@aws-0-ca-central-1.pooler.supabase.com:5432/postgres"

if [ -z "$DEV_DB" ] || [ -z "$PROD_DB" ]; then
  echo "Set DEV_DB and PROD_DB environment variables with connection strings"
  exit 1
fi

echo "=== Exporting cruise data from Dev ==="
pg_dump "$DEV_DB" \
  --schema=catalog \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  -t 'catalog.cruise_*' \
  > cruise_data_export.sql

echo "=== Importing cruise data to Prod ==="
psql "$PROD_DB" < cruise_data_export.sql

echo "=== Verifying row counts in Prod ==="
psql "$PROD_DB" -c "
SELECT 
  'cruise_lines' as tbl, COUNT(*) FROM catalog.cruise_lines
UNION ALL SELECT 'cruise_ships', COUNT(*) FROM catalog.cruise_ships
UNION ALL SELECT 'cruise_sailings', COUNT(*) FROM catalog.cruise_sailings
UNION ALL SELECT 'cruise_ports', COUNT(*) FROM catalog.cruise_ports
UNION ALL SELECT 'cruise_sailing_stops', COUNT(*) FROM catalog.cruise_sailing_stops;
"

echo "=== Done ==="
