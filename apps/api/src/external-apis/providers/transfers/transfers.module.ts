/**
 * Transfers Module
 *
 * NestJS module for transfer search endpoints.
 */

import { Module } from '@nestjs/common'
import { TransfersController } from './transfers.controller'
import { AmadeusModule } from '../amadeus'
import { ApiCredentialsModule } from '../../../api-credentials/api-credentials.module'

@Module({
  imports: [AmadeusModule, ApiCredentialsModule],
  controllers: [TransfersController],
})
export class TransfersModule {}
