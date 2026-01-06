/**
 * Update User DTO
 *
 * Validation for admin updating a user's profile.
 */

import {
  IsString,
  IsOptional,
  MaxLength,
  IsIn,
  IsObject,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CommissionSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  defaultRate?: number

  @IsOptional()
  @IsIn(['fixed', 'percentage'])
  splitType?: 'fixed' | 'percentage'

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  splitValue?: number

  /**
   * Custom validation: splitValue must be <= 100 when splitType is 'percentage'.
   * This is enforced in UsersService.updateUser() since class-validator
   * doesn't support conditional max validation elegantly.
   */
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string

  @IsOptional()
  @IsIn(['admin', 'user'])
  role?: 'admin' | 'user'

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CommissionSettingsDto)
  commissionSettings?: CommissionSettingsDto
}
