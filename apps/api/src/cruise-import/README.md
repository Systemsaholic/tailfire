# Cruise Import Module (FTP Catalogue)

This module handles importing cruise catalogue data from the Traveltek FTP server into the Tailfire database. It provides the static cruise data (ships, itineraries, ports, base pricing) that powers search and browse functionality.

> **Note:** This module works alongside the [Cruise Booking Module](../cruise-booking/README.md) which handles real-time availability, live pricing, and booking creation via the Traveltek FusionAPI.

## Features

- **FTP Connection Pooling**: Maintains a pool of FTP connections for concurrent file downloads
- **Delta Sync**: Skip unchanged files based on metadata comparison (size + modification time)
- **Content Hashing**: MD5 hash verification for additional change detection
- **Concurrent Processing**: Configurable concurrency for parallel file processing
- **Cancellation Support**: Sync jobs can be cancelled mid-operation
- **Comprehensive Metrics**: Detailed tracking of processed files, skipped files, and errors
- **Dynamic Year Discovery**: Automatically discovers all year folders on FTP (no hardcoded years)

## Year Handling

By default, the sync process **dynamically discovers all available year folders** from the FTP root and scans current year + all future years. This means:

- When Traveltek adds a new year folder (e.g., 2029), it will be automatically discovered
- No code changes required when new years become available
- Only current year and future years are scanned (historical years skipped unless `includeHistorical: true`)

To force a specific year only:
```json
{
  "year": 2027  // Only sync this specific year
}
```

## Delta Sync

Delta sync is enabled by default and significantly reduces sync time by skipping files that haven't changed since the last sync.

### How it works

1. **Pre-load tracking data**: At sync start, all existing file tracking records are loaded into memory
2. **Metadata comparison**: For each FTP file, compare `size` and `modifiedAt` against tracked values
3. **Skip unchanged**: If both match, skip the file entirely (counted in `skipReasons.unchanged`)
4. **Content hash**: After successful processing, compute MD5 hash and store with metadata
5. **UPSERT pattern**: Use `ON CONFLICT DO UPDATE` for concurrent worker safety

### Database Table

The `cruise_ftp_file_sync` table tracks sync state:

```sql
CREATE TABLE cruise_ftp_file_sync (
  file_path VARCHAR(500) PRIMARY KEY,  -- FTP path as unique key
  file_size INTEGER NOT NULL,           -- File size in bytes
  ftp_modified_at TIMESTAMPTZ,          -- FTP modification time
  content_hash VARCHAR(32),             -- MD5 hash for verification
  last_synced_at TIMESTAMPTZ NOT NULL,  -- When last synced
  sync_status VARCHAR(20) NOT NULL,     -- 'success' or 'failed'
  last_error TEXT                       -- Error message if failed
);
```

### API Options

Control delta sync via the sync endpoint:

```json
{
  "deltaSync": true,      // Enable delta sync (default: true)
  "forceFullSync": false  // Force full sync, ignoring tracking (default: false)
}
```

### Metrics

Delta sync adds to the metrics response:

```json
{
  "skipReasons": {
    "unchanged": 150,     // Files skipped due to delta sync
    "oversized": 0,
    "downloadFailed": 0,
    "parseError": 0,
    "missingFields": 0
  }
}
```

## API Endpoints

### Start Sync

```bash
POST /api/v1/cruise-import/sync
Content-Type: application/json

{
  "maxFiles": 100,           # Limit files processed
  "dryRun": false,           # If true, list files without processing
  "concurrency": 4,          # Concurrent downloads
  "deltaSync": true,         # Enable delta sync
  "forceFullSync": false,    # Force full sync
  "year": 2025,              # Optional: filter by year
  "month": 1,                # Optional: filter by month
  "lineId": "PCL",           # Optional: filter by cruise line
  "shipId": "123"            # Optional: filter by ship
}
```

### Check Status

```bash
GET /api/v1/cruise-import/sync/status
```

### Cancel Sync

```bash
POST /api/v1/cruise-import/sync/cancel
```

## Testing Delta Sync

To verify delta sync is working:

1. **First sync**: Run with a small `maxFiles` limit
   ```bash
   curl -X POST http://localhost:3101/api/v1/cruise-import/sync \
     -H "Content-Type: application/json" \
     -d '{"maxFiles": 50}'
   ```

2. **Check tracking table**: Verify records were created
   ```sql
   SELECT COUNT(*) FROM cruise_ftp_file_sync WHERE sync_status = 'success';
   ```

3. **Second sync**: Run again with same parameters
   ```bash
   curl -X POST http://localhost:3101/api/v1/cruise-import/sync \
     -H "Content-Type: application/json" \
     -d '{"maxFiles": 50}'
   ```

4. **Verify skipping**: Check `skipReasons.unchanged` in the response - it should match the count from step 2

## Performance Optimizations

| Optimization | Improvement | Status |
|--------------|-------------|--------|
| FTP Connection Pooling | ~3.5x faster | Implemented |
| Delta Sync | Varies (skip unchanged files) | Implemented |
| Entity Cache | Reduces DB lookups | Implemented |
| Concurrent Processing | Parallel downloads | Implemented |

## Architecture

```
cruise-import/
├── controllers/
│   └── cruise-import.controller.ts    # HTTP endpoints
├── services/
│   ├── import-orchestrator.service.ts # Main sync logic + delta sync
│   ├── ftp-pool.service.ts            # FTP connection pooling
│   ├── ftp-navigator.service.ts       # FTP path traversal
│   ├── entity-cache.service.ts        # In-memory entity caching
│   └── sailing-processor.service.ts   # Sailing data processing
├── cruise-import.types.ts             # TypeScript interfaces
└── cruise-import.module.ts            # NestJS module definition
```
