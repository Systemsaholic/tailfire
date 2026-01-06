/**
 * User Profiles Module
 *
 * Provides user profile management endpoints.
 */

import { Module } from '@nestjs/common'
import { DatabaseModule } from '../db/database.module'
import { TripsModule } from '../trips/trips.module'
import { UserProfilesController } from './user-profiles.controller'
import { UserProfilesService } from './user-profiles.service'

@Module({
  imports: [DatabaseModule, TripsModule],
  controllers: [UserProfilesController],
  providers: [UserProfilesService],
  exports: [UserProfilesService],
})
export class UserProfilesModule {}
