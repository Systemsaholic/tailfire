/**
 * Activity Log API Types
 *
 * Shared types for activity log API contracts between frontend and backend.
 */

export interface ActivityLogDto {
  id: string
  entityType: string
  entityId: string
  action: string
  actorId: string | null
  actorType: string | null
  actorName: string | null
  description: string | null
  metadata: Record<string, any> | null
  tripId: string | null
  createdAt: string
}
