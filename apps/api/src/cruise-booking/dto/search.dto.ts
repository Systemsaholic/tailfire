/**
 * Cruise Search DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsOptional,
  IsInt,
  IsString,
  IsDateString,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'

export class SearchCruisesDto {
  @ApiPropertyOptional({ description: 'Existing session key to reuse' })
  @IsOptional()
  @IsString()
  sessionkey?: string

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  adults?: number

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  children?: number

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
  infants?: number

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiPropertyOptional({ description: 'Departure month (MMYYYY)' })
  @IsOptional()
  @IsString()
  departuremonth?: string

  @ApiPropertyOptional({ description: 'Departure port ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  portid?: number

  @ApiPropertyOptional({ description: 'Region ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  regionid?: number

  @ApiPropertyOptional({ description: 'Cruise line ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cruiselineid?: number

  @ApiPropertyOptional({ description: 'Ship ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  shipid?: number

  @ApiPropertyOptional({ description: 'Minimum nights' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nights_min?: number

  @ApiPropertyOptional({ description: 'Maximum nights' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  nights_max?: number

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pagesize?: number
}

export class SearchResponseDto {
  @ApiProperty()
  sessionKey!: string

  @ApiProperty({ type: [Object] })
  results!: any[]

  @ApiProperty()
  meta!: {
    totalResults: number
    page: number
    pageSize: number
  }
}
