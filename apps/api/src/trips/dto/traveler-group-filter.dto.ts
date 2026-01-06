/**
 * TravelerGroupFilterDto with runtime validation
 */

import {
  IsOptional,
  IsUUID,
  IsIn,
} from 'class-validator'

export class TravelerGroupFilterDto {
  @IsOptional()
  @IsUUID()
  tripId?: string

  @IsOptional()
  @IsIn(['room', 'dining', 'activity', 'transfer', 'custom'])
  groupType?: 'room' | 'dining' | 'activity' | 'transfer' | 'custom'
}
