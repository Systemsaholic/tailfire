/**
 * Email Logs Filter DTO
 * Query parameters for listing email logs
 */

import {
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import type { EmailStatus } from '@tailfire/shared-types'

export class EmailLogsFilterDto {
  // Filters
  @IsOptional()
  @IsIn(['pending', 'sent', 'failed', 'filtered'])
  status?: EmailStatus

  @IsOptional()
  @IsUUID()
  tripId?: string

  @IsOptional()
  @IsUUID()
  contactId?: string

  @IsOptional()
  @IsString()
  templateSlug?: string

  @IsOptional()
  @IsString()
  search?: string

  // Date range
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @IsOptional()
  @IsDateString()
  toDate?: string

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

  // Sorting
  @IsOptional()
  @IsIn(['createdAt', 'sentAt', 'status'])
  sortBy?: 'createdAt' | 'sentAt' | 'status'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc'
}
