/**
 * Google Places Module
 *
 * NestJS module for Google Places API integration.
 * Provides hotel search and details via Google Places API (New).
 */

import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { GooglePlacesHotelsProvider } from './google-places-hotels.provider'

@Module({
  imports: [HttpModule],
  providers: [GooglePlacesHotelsProvider],
  exports: [GooglePlacesHotelsProvider],
})
export class GooglePlacesModule {}
