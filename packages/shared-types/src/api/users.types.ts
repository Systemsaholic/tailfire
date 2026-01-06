/**
 * User Management Types
 *
 * API contracts for admin user management endpoints.
 * Used by both NestJS backend and React frontend.
 */

import type { CommissionSettingsDto } from './user-profiles.types.js'

// ============================================================================
// ENUMS
// ============================================================================

export type UserStatus = 'active' | 'pending' | 'locked'
export type UserRole = 'admin' | 'user'

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * User list item for table display
 * Used by: GET /users
 */
export interface UserListItemDto {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  status: UserStatus
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

/**
 * Full user details for admin view/edit
 * Used by: GET /users/:id
 */
export interface UserDetailDto extends UserListItemDto {
  phone: string | null
  avatarUrl: string | null
  commissionSettings: CommissionSettingsDto | null
  invitedAt: string | null
  invitedBy: string | null
  lockedAt: string | null
  lockedReason: string | null
  updatedAt: string
}

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * Create user with full account (direct creation)
 * Used by: POST /users
 */
export interface CreateUserRequestDto {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  commissionSplit?: number // Maps to commissionSettings.splitValue
}

/**
 * Invite user via email
 * Used by: POST /users/invite
 */
export interface InviteUserRequestDto {
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

/**
 * Update user profile (admin editing user)
 * Used by: PATCH /users/:id
 */
export interface UpdateUserRequestDto {
  firstName?: string
  lastName?: string
  phone?: string
  role?: UserRole
  commissionSettings?: CommissionSettingsDto
}

/**
 * Change user status (lock/unlock/activate)
 * Used by: PATCH /users/:id/status
 * Note: 'pending' status is only set via invite flow, not manual status changes.
 */
export interface UpdateUserStatusRequestDto {
  status: 'active' | 'locked'
  lockedReason?: string // Optional reason when locking
}

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * List users query parameters
 * Used by: GET /users
 */
export interface ListUsersParamsDto {
  search?: string // name/email search
  status?: UserStatus // filter by status
  role?: UserRole // filter by role
  includeDeleted?: boolean // include isActive=false
  page?: number
  limit?: number
}

// ============================================================================
// Operation Responses
// ============================================================================

/**
 * Response after creating or inviting a user
 */
export interface UserCreatedResponseDto {
  userId: string
  email: string
}

/**
 * Response after inviting a user
 */
export interface UserInviteResponseDto {
  userId: string
  email: string
  inviteSent: boolean
}

/**
 * Paginated list response
 */
export interface UserListResponseDto {
  users: UserListItemDto[]
  total: number
  page: number
  limit: number
  totalPages: number
}
