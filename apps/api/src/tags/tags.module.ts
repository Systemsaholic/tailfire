/**
 * Tags Module
 *
 * Provides tag management and entity tag assignment functionality.
 */

import { Module } from '@nestjs/common'
import { DatabaseModule } from '../db/database.module'
import { TagsService } from './tags.service'
import { TagsController, TripTagsController, ContactTagsController } from './tags.controller'

@Module({
  imports: [DatabaseModule],
  controllers: [TagsController, TripTagsController, ContactTagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
