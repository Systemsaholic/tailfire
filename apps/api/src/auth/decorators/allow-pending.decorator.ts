/**
 * Allow Pending User Decorator
 *
 * Marks a route as accessible to users with 'pending' status.
 * Use on profile completion endpoints, etc.
 */

import { SetMetadata } from '@nestjs/common'

export const ALLOW_PENDING_KEY = 'allowPendingUser'
export const AllowPendingUser = () => SetMetadata(ALLOW_PENDING_KEY, true)
