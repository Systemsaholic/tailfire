/**
 * Cabin Grade DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
} from 'class-validator'
import { Type } from 'class-transformer'

export class GetCabinGradesDto {
  @ApiProperty({ description: 'Session key from search' })
  @IsNotEmpty()
  @IsString()
  sessionkey!: string

  @ApiProperty({ description: 'Cruise ID from search results' })
  @IsNotEmpty()
  @IsString()
  codetocruiseid!: string

  @ApiProperty({ description: 'Result number from search' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  resultno!: number

  @ApiPropertyOptional({ description: 'Rate code to filter grades by' })
  @IsOptional()
  @IsString()
  farecode?: string
}

export class CabinGradeDto {
  @ApiProperty({ description: 'Grade number (used for cabin lookup)' })
  gradeno!: number

  @ApiProperty({ description: 'Grade name' })
  gradename!: string

  @ApiPropertyOptional({ description: 'Grade description' })
  gradedescription?: string

  @ApiProperty({ description: 'Category: suite, balcony, oceanview, inside' })
  category!: string

  @ApiPropertyOptional({ description: 'Price per person' })
  pricepp?: number

  @ApiPropertyOptional({ description: 'Total price' })
  pricetotal?: number

  @ApiProperty({ description: 'Whether this grade is available' })
  available!: boolean
}

export class CabinGradesResponseDto {
  @ApiProperty({ type: [CabinGradeDto] })
  grades!: CabinGradeDto[]
}
