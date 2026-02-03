/**
 * Tour Search DTOs
 *
 * Request and response types for tour search and filter endpoints.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * Tour search query parameters
 */
export class TourSearchDto {
  @ApiPropertyOptional({ description: 'Search by tour name or description' })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({ description: 'Filter by operator code (e.g., globus, cosmos, monograms)' })
  @IsOptional()
  @IsString()
  operator?: string

  @ApiPropertyOptional({ description: 'Filter by season (e.g., 2026)' })
  @IsOptional()
  @IsString()
  season?: string

  @ApiPropertyOptional({ description: 'Minimum trip days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minDays?: number

  @ApiPropertyOptional({ description: 'Maximum trip days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(90)
  maxDays?: number

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Items per page (max 50)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20

  @ApiPropertyOptional({ description: 'Sort field', enum: ['name', 'days', 'createdAt'] })
  @IsOptional()
  @IsIn(['name', 'days', 'createdAt'])
  sortBy?: 'name' | 'days' | 'createdAt' = 'name'

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'asc'
}

/**
 * Tour summary (for search results)
 */
export class TourSummaryDto {
  @ApiProperty({ description: 'Tour UUID' })
  id!: string

  @ApiProperty({ description: 'Provider (e.g., globus)' })
  provider!: string

  @ApiProperty({ description: 'Provider identifier (tour code)' })
  providerIdentifier!: string

  @ApiProperty({ description: 'Operator code (e.g., globus, cosmos)' })
  operatorCode!: string

  @ApiProperty({ description: 'Tour name' })
  name!: string

  @ApiPropertyOptional({ description: 'Season year' })
  season?: string

  @ApiPropertyOptional({ description: 'Trip duration in days' })
  days?: number

  @ApiPropertyOptional({ description: 'Number of nights' })
  nights?: number

  @ApiPropertyOptional({ description: 'Short description' })
  description?: string

  @ApiPropertyOptional({ description: 'Primary image URL' })
  imageUrl?: string

  @ApiPropertyOptional({ description: 'Lowest price in cents' })
  lowestPriceCents?: number

  @ApiPropertyOptional({ description: 'Number of available departures' })
  departureCount?: number
}

/**
 * Tour search response with pagination
 */
export class TourSearchResponseDto {
  @ApiProperty({ type: [TourSummaryDto] })
  tours!: TourSummaryDto[]

  @ApiProperty({ description: 'Total matching tours' })
  total!: number

  @ApiProperty({ description: 'Current page' })
  page!: number

  @ApiProperty({ description: 'Items per page' })
  pageSize!: number

  @ApiProperty({ description: 'Total pages' })
  totalPages!: number
}

/**
 * Operator option for filters
 */
export class OperatorOptionDto {
  @ApiProperty({ description: 'Operator code' })
  code!: string

  @ApiProperty({ description: 'Operator name' })
  name!: string

  @ApiProperty({ description: 'Number of tours' })
  count!: number
}

/**
 * Season option for filters
 */
export class SeasonOptionDto {
  @ApiProperty({ description: 'Season year' })
  season!: string

  @ApiProperty({ description: 'Number of tours' })
  count!: number
}

/**
 * Tour filter options response
 */
export class TourFiltersResponseDto {
  @ApiProperty({ type: [OperatorOptionDto] })
  operators!: OperatorOptionDto[]

  @ApiProperty({ type: [SeasonOptionDto] })
  seasons!: SeasonOptionDto[]

  @ApiProperty({ description: 'Minimum trip days available' })
  minDays!: number

  @ApiProperty({ description: 'Maximum trip days available' })
  maxDays!: number
}
