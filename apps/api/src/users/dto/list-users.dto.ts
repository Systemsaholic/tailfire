/**
 * List Users DTO
 *
 * Validation for user list query parameters.
 */

import { IsOptional, IsString, IsIn, IsBoolean, IsNumber, Min, Max } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class ListUsersDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(['active', 'pending', 'locked'])
  status?: 'active' | 'pending' | 'locked'

  @IsOptional()
  @IsIn(['admin', 'user'])
  role?: 'admin' | 'user'

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20
}
