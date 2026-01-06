/**
 * UpdateTravelerGroupDto with runtime validation
 */

import { PartialType } from '@nestjs/mapped-types'
import { CreateTravelerGroupDto } from './create-traveler-group.dto'

export class UpdateTravelerGroupDto extends PartialType(CreateTravelerGroupDto) {}
