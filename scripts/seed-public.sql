-- Public Schema Seed (Dev & Prod)
-- Idempotent: safe to run multiple times

BEGIN;

-- 1. Agency (single tenant bootstrap)
INSERT INTO public.agencies (id, name, slug, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Phoenix Voyages',
  'phoenix-voyages',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 2. Amenities (curated list - using valid enum categories)
-- Valid categories: connectivity, facilities, dining, services, parking,
--                   accessibility, room_features, family, pets, other
INSERT INTO public.amenities (name, slug, category, icon, source) VALUES
  ('WiFi', 'wifi', 'connectivity', 'wifi', 'system'),
  ('Pool', 'pool', 'facilities', 'waves', 'system'),
  ('Spa', 'spa', 'facilities', 'sparkles', 'system'),
  ('Fitness Center', 'fitness-center', 'facilities', 'dumbbell', 'system'),
  ('Restaurant', 'restaurant', 'dining', 'utensils', 'system'),
  ('Bar', 'bar', 'dining', 'wine', 'system'),
  ('Room Service', 'room-service', 'dining', 'bell-concierge', 'system'),
  ('Free Parking', 'free-parking', 'parking', 'car', 'system'),
  ('Airport Shuttle', 'airport-shuttle', 'services', 'plane', 'system'),
  ('Concierge', 'concierge', 'services', 'bell-concierge', 'system'),
  ('Laundry Service', 'laundry-service', 'services', 'shirt', 'system'),
  ('Pet Friendly', 'pet-friendly', 'pets', 'paw-print', 'system'),
  ('Wheelchair Accessible', 'wheelchair-accessible', 'accessibility', 'wheelchair', 'system'),
  ('Air Conditioning', 'air-conditioning', 'room_features', 'snowflake', 'system'),
  ('Kitchen', 'kitchen', 'room_features', 'cooking-pot', 'system'),
  ('Balcony', 'balcony', 'room_features', 'door-open', 'system'),
  ('Ocean View', 'ocean-view', 'room_features', 'sunset', 'system'),
  ('Kids Club', 'kids-club', 'family', 'baby', 'system')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- 3. Tags (curated list)
INSERT INTO public.tags (name, category, color) VALUES
  ('VIP', 'client-status', '#FFD700'),
  ('Repeat Client', 'client-status', '#22C55E'),
  ('New Lead', 'client-status', '#3B82F6'),
  ('Hot Lead', 'client-status', '#EF4444'),
  ('Luxury', 'trip-type', '#9333EA'),
  ('Adventure', 'trip-type', '#F97316'),
  ('Family', 'trip-type', '#06B6D4'),
  ('Honeymoon', 'trip-type', '#EC4899'),
  ('Corporate', 'trip-type', '#6B7280'),
  ('Group', 'trip-type', '#8B5CF6'),
  ('Cruise', 'trip-type', '#0EA5E9'),
  ('All-Inclusive', 'trip-type', '#10B981'),
  ('Urgent', 'priority', '#DC2626'),
  ('Follow Up', 'action', '#FBBF24'),
  ('Pending Documents', 'action', '#F59E0B')
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  updated_at = NOW();

COMMIT;
