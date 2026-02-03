import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum, IsNotEmpty, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'
import { GlobusBrand } from '../types/globus-api.types'

/**
 * Normalize brand to title case (Globus API returns uppercase).
 */
function normalizeBrand(value: string | undefined): string | undefined {
  if (!value || typeof value !== 'string') return value
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export class GlobusSearchQueryDto {
  @ApiProperty({ description: 'Search keywords (e.g. "Danube", "Italy")' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  keywords!: string

  @ApiPropertyOptional({ enum: GlobusBrand, description: 'Filter by brand. Omit to search all 3.' })
  @IsOptional()
  @Transform(({ value }) => normalizeBrand(value))
  @IsEnum(GlobusBrand, { message: 'brand must be Globus, Cosmos, or Monograms (Avalon is not supported)' })
  brand?: GlobusBrand

  @ApiPropertyOptional({ description: 'Season year (defaults to current year)', example: '2026' })
  @IsOptional()
  @IsString()
  season?: string

  @ApiPropertyOptional({ description: 'Currency code (defaults to Canada)', example: 'Canada' })
  @IsOptional()
  @IsString()
  currency?: string
}

export class GlobusToursQueryDto {
  @ApiPropertyOptional({ enum: GlobusBrand, description: 'Filter by brand. Omit to list all 3.' })
  @IsOptional()
  @Transform(({ value }) => normalizeBrand(value))
  @IsEnum(GlobusBrand, { message: 'brand must be Globus, Cosmos, or Monograms (Avalon is not supported)' })
  brand?: GlobusBrand

  @ApiPropertyOptional({ description: 'Season year (defaults to current year)', example: '2026' })
  @IsOptional()
  @IsString()
  season?: string

  @ApiPropertyOptional({ description: 'Currency code (defaults to Canada)', example: 'Canada' })
  @IsOptional()
  @IsString()
  currency?: string
}
