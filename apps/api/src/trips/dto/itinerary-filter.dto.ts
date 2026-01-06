/**
 * ItineraryFilterDto with runtime validation
 */

import {
  IsOptional,
  IsUUID,
  IsBoolean,
  IsIn,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class ItineraryFilterDto {
  @IsOptional()
  @IsUUID()
  tripId?: string

  @IsOptional()
  @IsIn(['draft', 'proposing', 'approved', 'archived'])
  status?: 'draft' | 'proposing' | 'approved' | 'archived'

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSelected?: boolean
}
