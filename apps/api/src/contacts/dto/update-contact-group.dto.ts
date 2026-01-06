/**
 * Update Contact Group DTO with runtime validation
 */

import { PartialType } from '@nestjs/mapped-types'
import { CreateContactGroupDto } from './create-contact-group.dto'

/**
 * All fields from CreateContactGroupDto are optional for partial updates
 */
export class UpdateContactGroupDto extends PartialType(CreateContactGroupDto) {}
