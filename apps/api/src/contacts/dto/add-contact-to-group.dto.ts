/**
 * Add Contact to Group DTO with runtime validation
 */

import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator'

export class AddContactToGroupDto {
  @IsUUID()
  contactId!: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}
