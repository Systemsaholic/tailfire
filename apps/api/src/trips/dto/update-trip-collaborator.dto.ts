/**
 * UpdateTripCollaboratorDto with runtime validation
 */

import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator'

export class UpdateTripCollaboratorDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage?: number

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
