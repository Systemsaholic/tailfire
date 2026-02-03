-- Tour Catalog Tables Migration
-- Part 2 of Tour Library: Operator-agnostic catalog tables for tour data

-- ============================================================================
-- Tour Operators (Globus, Cosmos, Monograms)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tour_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial operators
INSERT INTO catalog.tour_operators (code, name, provider) VALUES
  ('globus', 'Globus', 'globus'),
  ('cosmos', 'Cosmos', 'globus'),
  ('monograms', 'Monograms', 'globus')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Tours
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_identifier TEXT NOT NULL,
  operator_id UUID REFERENCES catalog.tour_operators(id),
  operator_code TEXT NOT NULL,
  name TEXT NOT NULL,
  season TEXT,
  days INTEGER,
  nights INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_identifier, season)
);

CREATE INDEX IF NOT EXISTS idx_tours_provider ON catalog.tours(provider);
CREATE INDEX IF NOT EXISTS idx_tours_operator ON catalog.tours(operator_id);
CREATE INDEX IF NOT EXISTS idx_tours_operator_code ON catalog.tours(operator_code);
CREATE INDEX IF NOT EXISTS idx_tours_season ON catalog.tours(season);
CREATE INDEX IF NOT EXISTS idx_tours_is_active ON catalog.tours(is_active) WHERE is_active = true;

-- ============================================================================
-- Tour Departures
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tour_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES catalog.tours(id) ON DELETE CASCADE,
  departure_code TEXT NOT NULL,
  season TEXT,
  land_start_date DATE,
  land_end_date DATE,
  status TEXT,
  base_price_cents INTEGER,
  currency TEXT DEFAULT 'CAD',
  guaranteed_departure BOOLEAN DEFAULT false,
  ship_name TEXT,
  start_city TEXT,
  end_city TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tour_id, departure_code, season, land_start_date)
);

CREATE INDEX IF NOT EXISTS idx_tour_departures_tour ON catalog.tour_departures(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_departures_date ON catalog.tour_departures(land_start_date);
CREATE INDEX IF NOT EXISTS idx_tour_departures_season ON catalog.tour_departures(season);
CREATE INDEX IF NOT EXISTS idx_tour_departures_is_active ON catalog.tour_departures(is_active) WHERE is_active = true;

-- ============================================================================
-- Tour Departure Pricing (per-cabin pricing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tour_departure_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_id UUID NOT NULL REFERENCES catalog.tour_departures(id) ON DELETE CASCADE,
  cabin_category TEXT,
  price_cents INTEGER NOT NULL,
  discount_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'CAD',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_departure_pricing_departure ON catalog.tour_departure_pricing(departure_id);

-- ============================================================================
-- Tour Itinerary Days
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tour_itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES catalog.tours(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  overnight_city TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tour_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_tour_itinerary_days_tour ON catalog.tour_itinerary_days(tour_id);

-- ============================================================================
-- Tour Hotels
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tour_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES catalog.tours(id) ON DELETE CASCADE,
  day_number INTEGER,
  hotel_name TEXT NOT NULL,
  city TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_hotels_tour ON catalog.tour_hotels(tour_id);

-- ============================================================================
-- Tour Media (images, brochures, videos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tour_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES catalog.tours(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'brochure', 'video', 'map')),
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_media_tour ON catalog.tour_media(tour_id);

-- ============================================================================
-- Tour Inclusions (included, excluded, highlights)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tour_inclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES catalog.tours(id) ON DELETE CASCADE,
  inclusion_type TEXT NOT NULL CHECK (inclusion_type IN ('included', 'excluded', 'highlight')),
  category TEXT,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_inclusions_tour ON catalog.tour_inclusions(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_inclusions_type ON catalog.tour_inclusions(inclusion_type);

-- ============================================================================
-- Tour Sync History (per-brand tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.tour_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  brand TEXT,
  currency TEXT DEFAULT 'CAD',
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  tours_synced INTEGER DEFAULT 0,
  departures_synced INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_sync_history_provider ON catalog.tour_sync_history(provider);
CREATE INDEX IF NOT EXISTS idx_tour_sync_history_brand ON catalog.tour_sync_history(brand);
CREATE INDEX IF NOT EXISTS idx_tour_sync_history_status ON catalog.tour_sync_history(status);
