/**
 * Basket DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  IsEnum,
} from 'class-validator'
import { Type } from 'class-transformer'

export class AddToBasketDto {
  @ApiProperty({ description: 'Activity ID to link the booking session' })
  @IsNotEmpty()
  @IsUUID()
  activityId!: string

  @ApiProperty({
    description: 'Session key from search step - REQUIRED for FusionAPI session continuity',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  @IsNotEmpty()
  @IsString()
  sessionKey!: string

  @ApiPropertyOptional({ description: 'Trip ID for session authorization' })
  @IsOptional()
  @IsUUID()
  tripId?: string

  @ApiPropertyOptional({ description: 'Trip traveler ID for handoff authorization' })
  @IsOptional()
  @IsUUID()
  tripTravelerId?: string

  @ApiProperty({ description: 'Booking flow type', enum: ['agent', 'client_handoff', 'ota'] })
  @IsNotEmpty()
  @IsEnum(['agent', 'client_handoff', 'ota'])
  flowType!: 'agent' | 'client_handoff' | 'ota'

  @ApiProperty({ description: 'Cruise ID from search results' })
  @IsNotEmpty()
  @IsString()
  codetocruiseid!: string

  @ApiProperty({ description: 'Result number from search' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  resultno!: number

  @ApiProperty({ description: 'Cabin grade number' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  gradeno!: number

  @ApiProperty({ description: 'Fare code (rate code)' })
  @IsNotEmpty()
  @IsString()
  farecode!: string

  @ApiPropertyOptional({ description: 'Specific cabin result from cruisecabins.pl' })
  @IsOptional()
  @IsString()
  cabinresult?: string

  @ApiPropertyOptional({ description: 'Specific cabin number' })
  @IsOptional()
  @IsString()
  cabinno?: string
}

export class BasketItemDto {
  @ApiProperty()
  itemkey!: string

  @ApiProperty()
  producttype!: string

  @ApiProperty()
  cruiselinename!: string

  @ApiProperty()
  shipname!: string

  @ApiProperty()
  itineraryname!: string

  @ApiProperty()
  departuredate!: string

  @ApiProperty()
  nights!: number

  @ApiPropertyOptional()
  cabinno?: string

  @ApiProperty()
  cabingrade!: string

  @ApiProperty()
  farecode!: string

  @ApiProperty()
  pricepp!: number

  @ApiProperty()
  pricetotal!: number

  @ApiPropertyOptional()
  holdcabin?: {
    holdtime: string
    releasetime: string
  }
}

export class BasketResponseDto {
  @ApiProperty({ type: [BasketItemDto] })
  items!: BasketItemDto[]

  @ApiProperty()
  totalprice!: number

  @ApiProperty()
  currency!: string

  @ApiProperty()
  session!: {
    id: string
    status: string
    flowType: string
    sessionKey: string
    holdExpiresAt: string | null
  }

  @ApiProperty()
  holdStatus!: {
    isHeld: boolean
    expiresAt?: string
    remainingMinutes?: number
    isWarning: boolean
  }
}
