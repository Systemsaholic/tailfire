/**
 * UpdateTravelerGroupMemberDto with runtime validation
 */

import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

export class UpdateTravelerGroupMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string

  @IsOptional()
  @IsString()
  notes?: string
}
