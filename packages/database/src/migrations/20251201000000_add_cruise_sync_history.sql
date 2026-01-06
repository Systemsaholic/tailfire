-- Add cruise_sync_history table for tracking sync runs
-- Used by admin dashboard to show sync history and error logs

CREATE TABLE IF NOT EXISTS cruise_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status: 'running' | 'completed' | 'cancelled' | 'failed'
  status VARCHAR(20) NOT NULL DEFAULT 'running',

  -- Sync options used (FtpSyncOptions)
  options JSONB,

  -- Metrics from ImportMetrics
  metrics JSONB,

  -- Denormalized error count for quick queries
  error_count INTEGER NOT NULL DEFAULT 0,

  -- Bounded error array (max 100 entries)
  -- Each error: { filePath, error, errorType }
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Audit timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing history by date (newest first)
CREATE INDEX IF NOT EXISTS idx_sync_history_started
  ON cruise_sync_history(started_at DESC);

-- Partial index for finding running syncs quickly
CREATE INDEX IF NOT EXISTS idx_sync_history_running
  ON cruise_sync_history(status)
  WHERE status = 'running';

-- Comment on table
COMMENT ON TABLE cruise_sync_history IS 'Tracks cruise data sync runs with metrics and errors for admin dashboard';
