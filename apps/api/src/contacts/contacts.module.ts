/**
 * Contacts Module
 *
 * Provides CRUD operations for the Contact CRM system.
 * Includes contacts, relationships, and groups management.
 */

import { Module } from '@nestjs/common'
import { ContactsController } from './contacts.controller'
import { ContactsService } from './contacts.service'
import { ContactRelationshipsController } from './contact-relationships.controller'
import { ContactRelationshipsService } from './contact-relationships.service'
import { ContactGroupsController } from './contact-groups.controller'
import { ContactGroupsService } from './contact-groups.service'

@Module({
  controllers: [
    ContactsController,
    ContactRelationshipsController,
    ContactGroupsController,
  ],
  providers: [
    ContactsService,
    ContactRelationshipsService,
    ContactGroupsService,
  ],
  exports: [
    ContactsService,
    ContactRelationshipsService,
    ContactGroupsService,
  ],
})
export class ContactsModule {}
