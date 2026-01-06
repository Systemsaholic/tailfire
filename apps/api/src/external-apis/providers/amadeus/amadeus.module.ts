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
import { AmadeusFlightsProvider } from './amadeus-flights.provider'
import { AmadeusHotelsProvider } from './amadeus-hotels.provider'

@Module({
  providers: [AmadeusFlightsProvider, AmadeusHotelsProvider],
  exports: [AmadeusFlightsProvider, AmadeusHotelsProvider],
})
export class AmadeusModule {}
