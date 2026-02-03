import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { GlobusBrand } from '../types/globus-api.types'

export class GlobusFiltersQueryDto {
  @ApiPropertyOptional({ enum: GlobusBrand, description: 'Filter by brand. Omit to get all.' })
  @IsOptional()
  @IsEnum(GlobusBrand, { message: 'brand must be Globus, Cosmos, or Monograms (Avalon is not supported)' })
  brand?: GlobusBrand
}

export class GlobusPromotionsQueryDto {
  @ApiPropertyOptional({ enum: GlobusBrand, description: 'Filter by brand. Omit to get all.' })
  @IsOptional()
  @IsEnum(GlobusBrand, { message: 'brand must be Globus, Cosmos, or Monograms (Avalon is not supported)' })
  brand?: GlobusBrand

  @ApiPropertyOptional({ description: 'Season year (defaults to current year)', example: '2026' })
  @IsOptional()
  @IsString()
  season?: string
}
