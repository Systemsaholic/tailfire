/**
 * TripTravelerFilterDto with runtime validation
 */

import {
  IsOptional,
  IsUUID,
  IsBoolean,
  IsIn,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class TripTravelerFilterDto {
  @IsOptional()
  @IsUUID()
  tripId?: string

  @IsOptional()
  @IsUUID()
  contactId?: string

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPrimaryTraveler?: boolean

  @IsOptional()
  @IsIn(['adult', 'child', 'infant'])
  travelerType?: 'adult' | 'child' | 'infant'
}
