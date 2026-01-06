-- Migration Down: Rollback API Credentials System
-- Description: Drops api_credentials table and related types
-- Author: System
-- Date: 2025-11-20

-- Drop table (cascade will handle foreign key constraints)
DROP TABLE IF EXISTS api_credentials CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS credential_status;
DROP TYPE IF EXISTS api_provider;
