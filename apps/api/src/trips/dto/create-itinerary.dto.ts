/**
 * CreateItineraryDto with runtime validation
 */

import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator'

export class CreateItineraryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsIn(['draft', 'proposing', 'approved', 'archived'])
  status?: 'draft' | 'proposing' | 'approved' | 'archived'

  @IsOptional()
  @IsInt()
  sequenceOrder?: number

  @IsOptional()
  @IsString()
  coverPhoto?: string

  @IsOptional()
  @IsString()
  overview?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}
