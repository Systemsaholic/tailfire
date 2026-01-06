/**
 * Hotels Module
 *
 * NestJS module for hotel search functionality.
 * Composes Google Places and Amadeus Hotels providers.
 * Includes photo import capability for enriching lodging activities.
 */

import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { HotelsController } from './hotels.controller'
import { GooglePlacesModule } from '../google-places'
import { AmadeusModule } from '../amadeus'
import { ApiCredentialsModule } from '../../../api-credentials/api-credentials.module'
import { TripsModule } from '../../../trips/trips.module'

@Module({
  imports: [
    HttpModule,
    GooglePlacesModule,
    AmadeusModule,
    ApiCredentialsModule,
    TripsModule,
  ],
  controllers: [HotelsController],
})
export class HotelsModule {}
