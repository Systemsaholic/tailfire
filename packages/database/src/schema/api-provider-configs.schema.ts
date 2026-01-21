/**
 * API Provider Configs Schema
 *
 * Runtime configuration for API providers including RapidAPI integrations.
 * Stores provider-specific settings, credentials, and booking type mappings.
 */

import { pgTable, uuid, text, jsonb, boolean, integer, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================================================
// TABLE: api_provider_configs
// ============================================================================

/**
 * API Provider Configs Table
 * Stores configuration for various API providers used in the application.
 * Supports RapidAPI integrations and custom provider configurations.
 */
export const apiProviderConfigs = pgTable('api_provider_configs', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // Provider Identity
  providerName: text('provider_name').notNull(),
  bookingType: text('booking_type'), // e.g., 'hotel', 'flight', 'car'

  // Configuration
  config: jsonb('config').default(sql`'{}'::jsonb`),
  encryptedCredentials: jsonb('encrypted_credentials'),

  // Status & Priority
  isActive: boolean('is_active').default(true),
  isGlobal: boolean('is_global').default(false), // System-wide vs user-specific
  priority: integer('priority').default(10), // Lower = higher priority

  // RapidAPI Integration
  rapidapiHost: text('rapidapi_host'),
  rapidapiKey: text('rapidapi_key'),

  // Owner (null for global configs)
  userId: uuid('user_id'), // References auth.users

  // Audit Fields
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes
  providerIdx: index('idx_api_provider_configs_provider').on(table.providerName),
  bookingTypeIdx: index('idx_api_provider_configs_booking_type').on(table.bookingType),
  activeIdx: index('idx_api_provider_configs_active').on(table.isActive).where(sql`${table.isActive} = true`),
  // Unique constraint on provider + booking_type combination
  uniqueProviderBookingType: unique('idx_api_provider_configs_unique').on(
    table.providerName,
    sql`COALESCE(${table.bookingType}, '')`
  ),
}))
