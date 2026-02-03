/**
 * Activities Module
 *
 * NestJS module for tours & activities search endpoints.
 */

import { Module } from '@nestjs/common'
import { ActivitiesController } from './activities.controller'
import { AmadeusModule } from '../amadeus'
import { ApiCredentialsModule } from '../../../api-credentials/api-credentials.module'

@Module({
  imports: [AmadeusModule, ApiCredentialsModule],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
