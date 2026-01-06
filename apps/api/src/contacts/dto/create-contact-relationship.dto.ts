/**
 * Create Contact Relationship DTO with runtime validation
 */

import { IsString, IsOptional, IsUUID, IsIn, MaxLength } from 'class-validator'

export class CreateContactRelationshipDto {
  @IsUUID()
  contactId2!: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  labelForContact1?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  labelForContact2?: string

  @IsIn([
    'family',
    'business',
    'travel_companions',
    'group',
    'other',
    'custom',
  ])
  category!: 'family' | 'business' | 'travel_companions' | 'group' | 'other' | 'custom'

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customLabel?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}
