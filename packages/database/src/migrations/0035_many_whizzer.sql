DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'total' AND enumtypid = 'pricing_type'::regtype) THEN
    ALTER TYPE "pricing_type" ADD VALUE 'total';
  END IF;
END
$$;