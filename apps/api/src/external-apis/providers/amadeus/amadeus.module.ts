/**
 * Amadeus Module
 *
 * NestJS module for Amadeus API providers:
 * - Flights: On Demand Flight Status API (fallback for Aerodatabox)
 * - Hotels: Hotel Search and Offers APIs (fallback for Google Places)
 *
 * Note: HttpModule is provided globally by ExternalApisModule with
 * configured timeout (15s) and maxRedirects (3). Do not import HttpModule
 * here to avoid bypassing the global config.
 */

import { Module } from '@nestjs/common'
import { AmadeusAuthService } from './amadeus-auth.service'
import { AmadeusFlightsProvider } from './amadeus-flights.provider'
import { AmadeusHotelsProvider } from './amadeus-hotels.provider'
import { AmadeusFlightOffersProvider } from './amadeus-flight-offers.provider'
import { AmadeusTransfersProvider } from './amadeus-transfers.provider'
import { AmadeusActivitiesProvider } from './amadeus-activities.provider'

@Module({
  providers: [
    AmadeusAuthService,
    AmadeusFlightsProvider,
    AmadeusHotelsProvider,
    AmadeusFlightOffersProvider,
    AmadeusTransfersProvider,
    AmadeusActivitiesProvider,
  ],
  exports: [
    AmadeusAuthService,
    AmadeusFlightsProvider,
    AmadeusHotelsProvider,
    AmadeusFlightOffersProvider,
    AmadeusTransfersProvider,
    AmadeusActivitiesProvider,
  ],
})
export class AmadeusModule {}
