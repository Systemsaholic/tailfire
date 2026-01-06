/**
 * Update Contact DTO with runtime validation
 */

import { PartialType } from '@nestjs/mapped-types'
import { CreateContactDto } from './create-contact.dto'

/**
 * All fields from CreateContactDto are optional for partial updates
 */
export class UpdateContactDto extends PartialType(CreateContactDto) {}
