-- Add share_token column for public trip sharing
ALTER TABLE trips ADD COLUMN share_token VARCHAR(64) UNIQUE;
