-- Safely add enum values if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'options' AND enumtypid = 'activity_type'::regtype) THEN
    ALTER TYPE "activity_type" ADD VALUE 'options';
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'custom_cruise' AND enumtypid = 'activity_type'::regtype) THEN
    ALTER TYPE "activity_type" ADD VALUE 'custom_cruise';
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'port_info' AND enumtypid = 'activity_type'::regtype) THEN
    ALTER TYPE "activity_type" ADD VALUE 'port_info';
  END IF;
END $$;--> statement-breakpoint
-- Safely add columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'cover_photo') THEN
    ALTER TABLE "itineraries" ADD COLUMN "cover_photo" text;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'overview') THEN
    ALTER TABLE "itineraries" ADD COLUMN "overview" text;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'start_date') THEN
    ALTER TABLE "itineraries" ADD COLUMN "start_date" date;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'end_date') THEN
    ALTER TABLE "itineraries" ADD COLUMN "end_date" date;
  END IF;
END $$;