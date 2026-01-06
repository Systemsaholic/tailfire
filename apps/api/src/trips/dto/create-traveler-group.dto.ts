/**
 * CreateTravelerGroupDto with runtime validation
 */

import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator'

export class CreateTravelerGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string

  @IsIn(['room', 'dining', 'activity', 'transfer', 'custom'])
  groupType!: 'room' | 'dining' | 'activity' | 'transfer' | 'custom'

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  sequenceOrder?: number
}
