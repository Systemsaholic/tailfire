/**
 * Roles Decorator
 *
 * Restricts route access to specific roles.
 *
 * @example
 * @Roles('admin')
 * @Get('settings')
 * getSettings() { ... }
 */

import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
