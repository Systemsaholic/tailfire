/**
 * Update User Status DTO
 *
 * Validation for changing user status (lock/unlock/activate).
 * Note: 'pending' status is only set via invite flow, not manual status changes.
 */

import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator'

export class UpdateUserStatusDto {
  @IsIn(['active', 'locked'], {
    message: 'Status must be either "active" or "locked". Pending status is set via invite flow only.',
  })
  status!: 'active' | 'locked'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lockedReason?: string
}
