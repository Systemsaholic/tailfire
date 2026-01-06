/**
 * Sailing Search DTOs
 *
 * Request/response DTOs for sailing search API.
 * Includes input validation, pagination, and response shaping.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsUUID,
  IsArray,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

// ============================================================================
// ENUMS
// ============================================================================

export enum SortField {
  SAIL_DATE = 'sailDate',
  PRICE = 'price',
  NIGHTS = 'nights',
  SHIP_NAME = 'shipName',
  LINE_NAME = 'lineName',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export enum CabinCategory {
  INSIDE = 'inside',
  OCEANVIEW = 'oceanview',
  BALCONY = 'balcony',
  SUITE = 'suite',
}

// ============================================================================
// SEARCH REQUEST DTO
// ============================================================================

export class SailingSearchDto {
  @ApiPropertyOptional({ description: 'Search text (ship name, cruise name, port)' })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({ description: 'Filter by cruise line ID' })
  @IsOptional()
  @IsUUID()
  cruiseLineId?: string

  @ApiPropertyOptional({ description: 'Filter by ship ID' })
  @IsOptional()
  @IsUUID()
  shipId?: string

  @ApiPropertyOptional({ description: 'Filter by region ID' })
  @IsOptional()
  @IsUUID()
  regionId?: string

  @ApiPropertyOptional({ description: 'Filter by embark port ID' })
  @IsOptional()
  @IsUUID()
  embarkPortId?: string

  @ApiPropertyOptional({ description: 'Filter by disembark port ID' })
  @IsOptional()
  @IsUUID()
  disembarkPortId?: string

  @ApiPropertyOptional({ description: 'Filter by ports visited during cruise (comma-separated UUIDs)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => {
    // Handle single value or array from query string
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  portOfCallIds?: string[]

  @ApiPropertyOptional({ description: 'Minimum sail date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  sailDateFrom?: string

  @ApiPropertyOptional({ description: 'Maximum sail date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  sailDateTo?: string

  @ApiPropertyOptional({ description: 'Minimum nights', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  nightsMin?: number

  @ApiPropertyOptional({ description: 'Maximum nights', maximum: 365 })
  @IsOptional()
  @IsInt()
  @Max(365)
  @Type(() => Number)
  nightsMax?: number

  @ApiPropertyOptional({ description: 'Minimum price (CAD cents)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  priceMinCents?: number

  @ApiPropertyOptional({ description: 'Maximum price (CAD cents)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  priceMaxCents?: number

  @ApiPropertyOptional({
    description: 'Cabin category for price filter',
    enum: CabinCategory,
    default: CabinCategory.INSIDE,
  })
  @IsOptional()
  @IsEnum(CabinCategory)
  cabinCategory?: CabinCategory

  @ApiPropertyOptional({ description: 'Sort field', enum: SortField, default: SortField.SAIL_DATE })
  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: SortDirection,
    default: SortDirection.ASC,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDir?: SortDirection

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({
    description: 'Results per page (max 50)',
    minimum: 1,
    maximum: 50,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50) // Cap page size to prevent overload
  @Type(() => Number)
  pageSize?: number
}

// ============================================================================
// SEARCH RESPONSE DTOs
// ============================================================================

export class SailingSearchItemDto {
  @ApiProperty({ description: 'Sailing UUID' })
  id!: string

  @ApiProperty({ description: 'Sailing name/title' })
  name!: string

  @ApiProperty({ description: 'Sail date (YYYY-MM-DD)' })
  sailDate!: string

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  endDate!: string

  @ApiProperty({ description: 'Number of nights' })
  nights!: number

  @ApiProperty({ description: 'Ship information' })
  ship!: {
    id: string
    name: string
    imageUrl: string | null
  }

  @ApiProperty({ description: 'Cruise line information' })
  cruiseLine!: {
    id: string
    name: string
    logoUrl: string | null
  }

  @ApiProperty({ description: 'Embark port' })
  embarkPort!: {
    id: string | null
    name: string
  }

  @ApiProperty({ description: 'Disembark port' })
  disembarkPort!: {
    id: string | null
    name: string
  }

  @ApiProperty({ description: 'Price summary (CAD cents, NULL if not available)' })
  prices!: {
    inside: number | null
    oceanview: number | null
    balcony: number | null
    suite: number | null
  }

  @ApiProperty({ description: 'Last sync timestamp' })
  lastSyncedAt!: string

  @ApiPropertyOptional({ description: 'Is pricing currently being updated' })
  pricesUpdating?: boolean
}

export class SailingSearchResponseDto {
  @ApiProperty({ type: [SailingSearchItemDto] })
  items!: SailingSearchItemDto[]

  @ApiProperty({ description: 'Pagination metadata' })
  pagination!: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasMore: boolean
  }

  @ApiProperty({ description: 'Sync metadata' })
  sync!: {
    /** Global sync in progress (FTP import currently running) */
    syncInProgress: boolean
    /** @deprecated Use syncInProgress - kept for backwards compatibility */
    pricesUpdating: boolean
    /** Last successful sync timestamp (ISO 8601) */
    lastSyncedAt: string | null
  }

  @ApiProperty({ description: 'Applied filters (for debugging/display)' })
  filters!: Record<string, unknown>
}

// ============================================================================
// FILTER OPTIONS RESPONSE
// ============================================================================

export class FilterOptionDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  name!: string

  @ApiPropertyOptional()
  count?: number

  @ApiPropertyOptional({ description: 'All IDs with this name (for deduped ports)' })
  allIds?: string[]
}

export class SailingFiltersResponseDto {
  @ApiProperty({ type: [FilterOptionDto], description: 'Available cruise lines' })
  cruiseLines!: FilterOptionDto[]

  @ApiProperty({ type: [FilterOptionDto], description: 'Available ships' })
  ships!: FilterOptionDto[]

  @ApiProperty({ type: [FilterOptionDto], description: 'Available regions' })
  regions!: FilterOptionDto[]

  @ApiProperty({ type: [FilterOptionDto], description: 'Available embark ports' })
  embarkPorts!: FilterOptionDto[]

  @ApiProperty({ type: [FilterOptionDto], description: 'Available disembark ports' })
  disembarkPorts!: FilterOptionDto[]

  @ApiProperty({ type: [FilterOptionDto], description: 'Ports visited during cruises (ports of call)' })
  portsOfCall!: FilterOptionDto[]

  @ApiProperty({ description: 'Date range of available sailings' })
  dateRange!: {
    min: string | null
    max: string | null
  }

  @ApiProperty({ description: 'Nights range of available sailings' })
  nightsRange!: {
    min: number | null
    max: number | null
  }

  @ApiProperty({ description: 'Price range (CAD cents) for inside cabins' })
  priceRange!: {
    min: number | null
    max: number | null
  }
}
