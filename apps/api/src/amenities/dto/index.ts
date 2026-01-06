/**
 * Amenities DTOs
 *
 * Request validation schemas using class-validator.
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator'
import { Transform } from 'class-transformer'
import type { AmenityCategory, AmenitySource } from '@tailfire/shared-types'

const AMENITY_CATEGORIES = [
  'connectivity',
  'facilities',
  'dining',
  'services',
  'parking',
  'accessibility',
  'room_features',
  'family',
  'pets',
  'other',
] as const

const AMENITY_SOURCES = [
  'google_places',
  'booking_com',
  'amadeus',
  'manual',
  'system',
] as const

export class CreateAmenityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name!: string

  @IsOptional()
  @IsEnum(AMENITY_CATEGORIES)
  category?: AmenityCategory

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  icon?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description?: string
}

export class UpdateAmenityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsEnum(AMENITY_CATEGORIES)
  category?: AmenityCategory

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null
}

export class AmenityFilterDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsEnum(AMENITY_CATEGORIES)
  category?: AmenityCategory

  @IsOptional()
  @IsEnum(AMENITY_SOURCES)
  source?: AmenitySource
}

export class UpdateActivityAmenitiesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  amenityIds!: string[]
}

export class BulkUpsertAmenitiesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100) // Limit bulk operations
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v: unknown) => typeof v === 'string' ? v.trim() : v).filter((v: unknown) => v)
      : value
  )
  names!: string[]

  @IsEnum(AMENITY_SOURCES)
  source!: AmenitySource
}
