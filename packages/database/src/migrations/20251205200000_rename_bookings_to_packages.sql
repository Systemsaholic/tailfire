-- Migration: Rename bookings to packages
-- This migration renames the "bookings" concept to "packages" throughout the database
-- to correctly distinguish between:
-- - Package: A grouping wrapper for activities that owns pricing, payments, travelers, documents
-- - Booking: A STATUS (not an entity) indicating something is confirmed with a supplier

-- ============================================================================
-- Step 1: Drop dependent indexes and constraints first
-- ============================================================================

-- Drop indexes on booking_id column in activities
DROP INDEX IF EXISTS idx_itinerary_activities_booking;

-- Drop unique constraint on bookings
DROP INDEX IF EXISTS idx_bookings_confirmation_unique;

-- ============================================================================
-- Step 2: Rename the main bookings table to packages
-- ============================================================================
ALTER TABLE bookings RENAME TO packages;

-- ============================================================================
-- Step 3: Rename related tables
-- ============================================================================
ALTER TABLE booking_travelers RENAME TO package_travelers;
ALTER TABLE booking_documents RENAME TO package_documents;
ALTER TABLE booking_installments RENAME TO package_installments;

-- ============================================================================
-- Step 4: Rename foreign key columns
-- ============================================================================

-- In itinerary_activities table: booking_id → package_id
ALTER TABLE itinerary_activities RENAME COLUMN booking_id TO package_id;

-- In package_travelers (formerly booking_travelers): booking_id → package_id
ALTER TABLE package_travelers RENAME COLUMN booking_id TO package_id;

-- In package_documents (formerly booking_documents): booking_id → package_id
ALTER TABLE package_documents RENAME COLUMN booking_id TO package_id;

-- In package_installments (formerly booking_installments): booking_id → package_id
ALTER TABLE package_installments RENAME COLUMN booking_id TO package_id;

-- ============================================================================
-- Step 5: Recreate indexes with new names
-- ============================================================================

-- Packages table indexes
CREATE INDEX idx_packages_trip ON packages(trip_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_supplier ON packages(supplier_id);
CREATE INDEX idx_packages_payment_status ON packages(payment_status);
CREATE INDEX idx_packages_date_booked ON packages(date_booked);
CREATE UNIQUE INDEX idx_packages_confirmation_unique ON packages(trip_id, confirmation_number);

-- Package ID index on activities
CREATE INDEX idx_itinerary_activities_package ON itinerary_activities(package_id);

-- Package travelers indexes
CREATE INDEX idx_package_travelers_package ON package_travelers(package_id);
CREATE INDEX idx_package_travelers_traveler ON package_travelers(trip_traveler_id);

-- Package documents indexes
CREATE INDEX idx_package_documents_package ON package_documents(package_id);
CREATE INDEX idx_package_documents_type ON package_documents(document_type);

-- Package installments indexes
CREATE INDEX idx_package_installments_package ON package_installments(package_id);
CREATE INDEX idx_package_installments_status ON package_installments(status);
CREATE INDEX idx_package_installments_due_date ON package_installments(due_date);

-- ============================================================================
-- Step 6: Drop old indexes (if they still exist after table rename)
-- ============================================================================
DROP INDEX IF EXISTS idx_bookings_trip;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_supplier;
DROP INDEX IF EXISTS idx_bookings_payment_status;
DROP INDEX IF EXISTS idx_bookings_date_booked;
DROP INDEX IF EXISTS idx_booking_travelers_booking;
DROP INDEX IF EXISTS idx_booking_travelers_traveler;
DROP INDEX IF EXISTS idx_booking_documents_booking;
DROP INDEX IF EXISTS idx_booking_documents_type;
DROP INDEX IF EXISTS idx_booking_installments_booking;
DROP INDEX IF EXISTS idx_booking_installments_status;
DROP INDEX IF EXISTS idx_booking_installments_due_date;

-- ============================================================================
-- Note: Enums are NOT renamed to avoid breaking existing data
-- The following enums remain unchanged:
-- - booking_status (still valid for package workflow)
-- - booking_payment_status
-- - booking_pricing_type
-- - installment_status
-- - booking_document_type
-- ============================================================================

-- Migration complete
