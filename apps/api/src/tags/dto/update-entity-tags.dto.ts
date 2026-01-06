/**
 * UpdateEntityTagsDto with runtime validation
 */

import { IsArray, IsUUID } from 'class-validator'

export class UpdateEntityTagsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds!: string[]
}
