/**
 * Public Decorator
 *
 * Marks a route as public - no authentication required.
 * Use on health check endpoints, etc.
 */

import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
