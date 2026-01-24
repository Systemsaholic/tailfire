/**
 * Rate Code DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  IsInt,
} from 'class-validator'
import { Type } from 'class-transformer'

export class GetRateCodesDto {
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
}

export class RateCodeDto {
  @ApiProperty({ description: 'Rate code identifier' })
  code!: string

  @ApiProperty({ description: 'Display name' })
  name!: string

  @ApiPropertyOptional({ description: 'Rate description/promotional details' })
  description?: string

  @ApiProperty({ description: 'Whether this rate requires a non-refundable deposit' })
  nonrefundabledeposit!: boolean
}

export class RateCodesResponseDto {
  @ApiProperty({ type: [RateCodeDto] })
  rateCodes!: RateCodeDto[]
}
