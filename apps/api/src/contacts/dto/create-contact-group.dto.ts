/**
 * Create Contact Group DTO with runtime validation
 */

import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateContactGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string

  @IsIn(['family', 'corporate', 'wedding', 'friends', 'custom'])
  groupType!: 'family' | 'corporate' | 'wedding' | 'friends' | 'custom'

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @IsOptional()
  @IsUUID()
  primaryContactId?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  tags?: string[]
}
