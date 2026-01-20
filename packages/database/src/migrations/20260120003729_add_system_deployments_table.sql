-- Migration: Add system_deployments table for tracking deployments
-- This table logs deployment events for audit and debugging purposes

CREATE TABLE IF NOT EXISTS system_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment VARCHAR(50) NOT NULL,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  git_branch VARCHAR(100),
  git_commit VARCHAR(40),
  version VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE system_deployments IS 'Tracks deployment events for audit and debugging';

-- Create index for querying by environment and time
CREATE INDEX idx_system_deployments_env_time ON system_deployments(environment, deployed_at DESC);

-- Enable RLS (table is internal, no user access needed)
ALTER TABLE system_deployments ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role access only" ON system_deployments
  FOR ALL
  USING (auth.role() = 'service_role');
