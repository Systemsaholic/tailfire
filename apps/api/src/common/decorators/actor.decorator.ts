/**
 * Actor Decorator / Helper
 *
 * Utilities for extracting the actor (user) from request context
 * for audit logging purposes.
 */

import { Request } from 'express'

/**
 * Extended Request type that may include user info from JWT auth
 */
interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string
    userId?: string
    id?: string
  }
}

/**
 * Extract actor ID from a request
 *
 * Checks multiple sources in order of preference:
 * 1. JWT user subject (from Supabase/Auth)
 * 2. User ID from authenticated session
 * 3. API key indicator (for system/external calls)
 * 4. Background job context
 *
 * @param req - Express request object
 * @returns Actor ID string or null for unauthenticated requests
 */
export function getActorId(req: AuthenticatedRequest): string | null {
  // From JWT auth (Supabase typically uses 'sub')
  if (req.user?.sub) {
    return req.user.sub
  }

  // Alternative user ID fields
  if (req.user?.userId) {
    return req.user.userId
  }

  if (req.user?.id) {
    return req.user.id
  }

  // From API key header (indicates system/external actor)
  const apiKey = req.headers['x-api-key']
  if (apiKey) {
    return 'system:api-key'
  }

  // From background job context
  const jobId = req.headers['x-job-id']
  if (jobId) {
    return `system:job:${jobId}`
  }

  // From internal service calls
  const serviceId = req.headers['x-service-id']
  if (serviceId) {
    return `system:service:${serviceId}`
  }

  return null
}

/**
 * Get actor type based on actor ID
 *
 * @param actorId - The actor ID
 * @returns 'user' | 'system' | 'api'
 */
export function getActorType(actorId: string | null): 'user' | 'system' | 'api' {
  if (!actorId) return 'system'
  if (actorId.startsWith('system:')) return 'system'
  if (actorId.startsWith('api:')) return 'api'
  return 'user'
}

/**
 * System actor ID for background jobs and internal processes
 */
export const SYSTEM_ACTOR = 'system:internal'

/**
 * Create actor ID for a specific background job
 */
export function createJobActorId(jobName: string): string {
  return `system:job:${jobName}`
}

/**
 * Create actor ID for a specific service
 */
export function createServiceActorId(serviceName: string): string {
  return `system:service:${serviceName}`
}
