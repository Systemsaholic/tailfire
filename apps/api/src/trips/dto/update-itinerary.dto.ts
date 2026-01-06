/**
 * UpdateItineraryDto with runtime validation
 */

import { PartialType } from '@nestjs/mapped-types'
import { CreateItineraryDto } from './create-itinerary.dto'
import { IsOptional, IsBoolean } from 'class-validator'

export class UpdateItineraryDto extends PartialType(CreateItineraryDto) {
  @IsOptional()
  @IsBoolean()
  isSelected?: boolean
}
