-- ============================================================================
-- Migration 0006: Marketing Compliance (CASL/GDPR)
-- ============================================================================
-- Description: Add marketing consent tracking with audit trail
-- Author: Tailfire Development Team
-- Date: 2025-01-13

-- Step 1: Add consent flags (default false for privacy-first approach)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_email_opt_in BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_sms_opt_in BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_phone_opt_in BOOLEAN DEFAULT FALSE;

-- Step 2: Add consent timestamps (audit trail)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_email_opt_in_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_sms_opt_in_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_phone_opt_in_at TIMESTAMPTZ;

-- Step 3: Add consent metadata
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_opt_in_source TEXT;
-- Examples: 'signup_form', 'phone_call', 'in_person', 'email_request'

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_opt_out_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_opt_out_reason TEXT;

-- Step 4: Auto-timestamp trigger for consent changes
CREATE OR REPLACE FUNCTION update_consent_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Email opt-in timestamp (only set when transitioning false → true)
  IF NEW.marketing_email_opt_in != OLD.marketing_email_opt_in THEN
    IF NEW.marketing_email_opt_in THEN
      NEW.marketing_email_opt_in_at := NOW();
    END IF;
  END IF;

  -- SMS opt-in timestamp
  IF NEW.marketing_sms_opt_in != OLD.marketing_sms_opt_in THEN
    IF NEW.marketing_sms_opt_in THEN
      NEW.marketing_sms_opt_in_at := NOW();
    END IF;
  END IF;

  -- Phone opt-in timestamp
  IF NEW.marketing_phone_opt_in != OLD.marketing_phone_opt_in THEN
    IF NEW.marketing_phone_opt_in THEN
      NEW.marketing_phone_opt_in_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_consent_timestamps ON contacts;
CREATE TRIGGER track_consent_timestamps
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_timestamps();

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS track_consent_timestamps ON contacts;
DROP FUNCTION IF EXISTS update_consent_timestamps();
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_opt_out_reason;
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_opt_out_at;
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_opt_in_source;
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_phone_opt_in_at;
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_sms_opt_in_at;
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_email_opt_in_at;
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_phone_opt_in;
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_sms_opt_in;
ALTER TABLE contacts DROP COLUMN IF EXISTS marketing_email_opt_in;
*/
