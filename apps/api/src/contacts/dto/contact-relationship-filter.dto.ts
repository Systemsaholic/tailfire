/**
 * Contact Relationship Filter DTO with runtime validation
 */

import { IsOptional, IsUUID, IsIn } from 'class-validator'

export class ContactRelationshipFilterDto {
  @IsOptional()
  @IsUUID()
  contactId?: string

  @IsOptional()
  @IsIn([
    'family',
    'business',
    'travel_companions',
    'group',
    'other',
    'custom',
  ])
  category?: 'family' | 'business' | 'travel_companions' | 'group' | 'other' | 'custom'
}
