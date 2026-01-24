/**
 * Cabin DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
} from 'class-validator'
import { Type } from 'class-transformer'

export class GetCabinsDto {
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

  @ApiProperty({ description: 'Grade number from cabin grades' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  gradeno!: number

  @ApiPropertyOptional({ description: 'Rate code' })
  @IsOptional()
  @IsString()
  farecode?: string
}

export class DeckPlanDto {
  @ApiProperty({ description: 'Deck ID' })
  id!: number

  @ApiProperty({ description: 'Deck name (e.g., "Deck 10")' })
  name!: string

  @ApiProperty({ description: 'URL to deck plan image' })
  imageurl!: string
}

export class CabinCoordinatesDto {
  @ApiProperty({ description: 'Left edge (pixels)' })
  x1!: number

  @ApiProperty({ description: 'Right edge (pixels)' })
  x2!: number

  @ApiProperty({ description: 'Top edge (pixels)' })
  y1!: number

  @ApiProperty({ description: 'Bottom edge (pixels)' })
  y2!: number
}

export class CabinDto {
  @ApiProperty({ description: 'Cabin number' })
  cabinno!: string

  @ApiProperty({ description: 'Deck name' })
  deckname!: string

  @ApiProperty({ description: 'Deck code' })
  deckcode!: string

  @ApiProperty({ description: 'Position on deck plan image', type: CabinCoordinatesDto })
  coordinates!: CabinCoordinatesDto

  @ApiProperty({ description: 'Bed configuration code' })
  bedcode!: string

  @ApiProperty({ description: 'Bed configuration description' })
  beddescription!: string

  @ApiProperty({ description: 'Maximum guests' })
  maxguests!: number

  @ApiProperty({ description: 'Whether cabin is available' })
  available!: boolean

  @ApiProperty({ description: 'Internal: Use as cabinresult in basket add' })
  cabinResult!: string
}

export class CabinsResponseDto {
  @ApiProperty({ type: [DeckPlanDto], description: 'Deck plan images' })
  deckPlans!: DeckPlanDto[]

  @ApiProperty({ type: [CabinDto], description: 'Available cabins with positions' })
  cabins!: CabinDto[]
}
