/**
 * AddTravelerToGroupDto with runtime validation
 */

import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

export class AddTravelerToGroupDto {
  @IsUUID()
  tripTravelerId!: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string

  @IsOptional()
  @IsString()
  notes?: string
}
