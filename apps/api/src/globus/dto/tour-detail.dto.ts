import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'
import { GlobusBrand } from '../types/globus-api.types'

/**
 * Normalize brand to title case (Globus API returns uppercase).
 * e.g., "COSMOS" → "Cosmos", "globus" → "Globus"
 */
function normalizeBrand(value: string): string {
  if (!value || typeof value !== 'string') return value
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export class GlobusDeparturesQueryDto {
  @ApiProperty({ enum: GlobusBrand, description: 'Brand (required for departure lookup)' })
  @Transform(({ value }) => normalizeBrand(value))
  @IsEnum(GlobusBrand, { message: 'brand must be Globus, Cosmos, or Monograms (Avalon is not supported)' })
  brand!: GlobusBrand

  @ApiPropertyOptional({ description: 'Currency code (defaults to Canada)', example: 'Canada' })
  @IsOptional()
  @IsString()
  currency?: string
}
