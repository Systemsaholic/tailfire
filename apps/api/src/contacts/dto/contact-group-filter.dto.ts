/**
 * Contact Group Filter DTO with runtime validation
 */

import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

export class ContactGroupFilterDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number

  // Search
  @IsOptional()
  @IsString()
  search?: string

  // Filters
  @IsOptional()
  @IsIn(['family', 'corporate', 'wedding', 'friends', 'custom'])
  groupType?: 'family' | 'corporate' | 'wedding' | 'friends' | 'custom'

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean

  // Sorting
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc'
}
