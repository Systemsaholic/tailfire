/**
 * Create User DTO
 *
 * Validation for full user account creation (direct creation, not invite).
 */

import { IsString, IsEmail, MaxLength, IsIn, IsOptional, IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email!: string

  @IsString()
  @MaxLength(100)
  firstName!: string

  @IsString()
  @MaxLength(100)
  lastName!: string

  @IsIn(['admin', 'user'])
  role!: 'admin' | 'user'

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  commissionSplit?: number // Maps to commissionSettings.splitValue with splitType='percentage'
}
