/**
 * Activity Logs Module
 *
 * Provides centralized activity logging for all entities in the system.
 * Listens to domain events and persists activity logs to the database.
 *
 * This module is designed to be imported globally to capture all activity across the app.
 */

import { Module } from '@nestjs/common'
import { DatabaseModule } from '../db/database.module'
import { ActivityLogsService } from './activity-logs.service'

@Module({
  imports: [DatabaseModule],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
