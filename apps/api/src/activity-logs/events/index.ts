/**
 * Activity Log Events
 *
 * Central export for all domain events tracked by the activity log system.
 */

// Legacy trip/traveler events (kept for backward compatibility)
export * from './trip-created.event'
export * from './trip-updated.event'
export * from './trip-deleted.event'
export * from './traveler-created.event'
export * from './traveler-updated.event'
export * from './traveler-deleted.event'

// Generic audit event (Phase 1: all new entity types)
export * from './audit.event'
