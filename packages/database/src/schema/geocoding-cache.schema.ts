/**
 * Geocoding Cache Schema
 *
 * Caches geocoding results to avoid repeated API calls for the same cities.
 * Used by tour import sync to geocode tour start/end cities and itinerary overnight cities.
 */

import { uuid, text, numeric, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'

export const geocodingCache = catalogSchema.table(
  'geocoding_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Normalized location key (lowercase, trimmed city name)
    locationKey: text('location_key').notNull().unique(),

    // Original formatted name from geocoding response
    displayName: text('display_name'),

    // Coordinates
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),

    // Location details
    country: text('country'),
    countryCode: text('country_code'),
    region: text('region'), // State/Province

    // Provider info
    provider: text('provider').default('google'), // google, mapbox, etc.

    // Raw response for debugging
    rawResponse: jsonb('raw_response'),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Index for fast key lookup
    keyIndex: index('idx_geocoding_cache_key').on(table.locationKey),
    // Index for filtering by country
    countryIndex: index('idx_geocoding_cache_country').on(table.countryCode),
  })
)

// TypeScript types
export type GeocodingCache = typeof geocodingCache.$inferSelect
export type NewGeocodingCache = typeof geocodingCache.$inferInsert
