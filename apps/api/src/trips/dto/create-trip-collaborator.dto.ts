/**
 * CreateTripCollaboratorDto with runtime validation
 */

import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator'

export class CreateTripCollaboratorDto {
  @IsUUID()
  userId!: string

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage!: number

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string
}
