/**
 * Update Contact Relationship DTO with runtime validation
 */

import { PartialType } from '@nestjs/mapped-types'
import { CreateContactRelationshipDto } from './create-contact-relationship.dto'
import { OmitType } from '@nestjs/mapped-types'

/**
 * All fields from CreateContactRelationshipDto except contactId2 are optional
 * contactId2 cannot be changed after creation (would require delete + recreate)
 */
export class UpdateContactRelationshipDto extends PartialType(
  OmitType(CreateContactRelationshipDto, ['contactId2'] as const),
) {}
