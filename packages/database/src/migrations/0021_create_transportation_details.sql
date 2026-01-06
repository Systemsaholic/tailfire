-- Transportation Details Table
-- Stores component-specific data for transportation activities (car rentals, transfers, trains, etc.)

CREATE TABLE IF NOT EXISTS "transportation_details" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "component_id" uuid NOT NULL UNIQUE,

  -- Transportation type classification
  "subtype" varchar(50), -- transfer, car_rental, private_car, taxi, shuttle, train, ferry, bus, limousine

  -- Provider information
  "provider_name" varchar(255),
  "provider_phone" varchar(50),
  "provider_email" varchar(255),

  -- Vehicle details
  "vehicle_type" varchar(100), -- car, suv, van, bus, etc.
  "vehicle_model" varchar(100),
  "vehicle_capacity" integer,
  "license_plate" varchar(50),

  -- Pickup details (following flight pattern with separate date/time/timezone)
  "pickup_date" date,
  "pickup_time" time,
  "pickup_timezone" varchar(64), -- IANA timezone
  "pickup_address" text,
  "pickup_notes" text,

  -- Dropoff details
  "dropoff_date" date,
  "dropoff_time" time,
  "dropoff_timezone" varchar(64), -- IANA timezone
  "dropoff_address" text,
  "dropoff_notes" text,

  -- Driver information (for private transfers)
  "driver_name" varchar(255),
  "driver_phone" varchar(50),

  -- Car rental specific fields
  "rental_pickup_location" varchar(255),
  "rental_dropoff_location" varchar(255),
  "rental_insurance_type" varchar(100),
  "rental_mileage_limit" varchar(100),

  -- Additional details
  "features" jsonb DEFAULT '[]',
  "special_requests" text,
  "flight_number" varchar(50), -- For airport transfers
  "is_round_trip" integer DEFAULT 0, -- 0 = one way, 1 = round trip

  -- Timestamps
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,

  CONSTRAINT "transportation_details_component_id_fkey"
    FOREIGN KEY ("component_id")
    REFERENCES "itinerary_activities"("id")
    ON DELETE CASCADE,

  -- Validate subtype values
  CONSTRAINT "transportation_details_subtype_check"
    CHECK (subtype IS NULL OR subtype IN (
      'transfer', 'car_rental', 'private_car', 'taxi',
      'shuttle', 'train', 'ferry', 'bus', 'limousine'
    ))
);

-- Create index for faster lookups by component_id
CREATE INDEX IF NOT EXISTS "transportation_details_component_id_idx"
  ON "transportation_details" ("component_id");

-- Create index for pickup date queries
CREATE INDEX IF NOT EXISTS "transportation_details_pickup_date_idx"
  ON "transportation_details" ("pickup_date");
