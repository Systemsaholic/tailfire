-- Create trip_groups table for organizing trips into collections/folders
CREATE TABLE trip_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Add trip_group_id to trips table
ALTER TABLE trips ADD COLUMN trip_group_id UUID REFERENCES trip_groups(id);

-- RLS
ALTER TABLE trip_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_groups_agency_access" ON trip_groups
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles WHERE id = auth.uid()
    )
  );
