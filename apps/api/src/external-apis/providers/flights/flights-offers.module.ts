/**
 * Flight Offers Module
 *
 * NestJS module for flight price shopping endpoints.
 */

import { Module } from '@nestjs/common'
import { FlightsOffersController } from './flights-offers.controller'
import { AmadeusModule } from '../amadeus'
import { ApiCredentialsModule } from '../../../api-credentials/api-credentials.module'

@Module({
  imports: [AmadeusModule, ApiCredentialsModule],
  controllers: [FlightsOffersController],
})
export class FlightsOffersModule {}
