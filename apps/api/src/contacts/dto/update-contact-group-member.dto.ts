/**
 * Update Contact Group Member DTO with runtime validation
 */

import { IsString, IsOptional, MaxLength } from 'class-validator'

export class UpdateContactGroupMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}
