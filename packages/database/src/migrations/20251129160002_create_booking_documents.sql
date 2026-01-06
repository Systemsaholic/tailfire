-- Create booking_documents table for package-specific file uploads
CREATE TABLE booking_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size_bytes INTEGER CHECK (file_size_bytes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient document lookups by booking
CREATE INDEX idx_booking_documents_booking ON booking_documents(booking_id);
