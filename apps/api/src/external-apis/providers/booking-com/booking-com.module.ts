/**
 * Booking.com Module
 *
 * NestJS module for Booking.com API integration.
 * Provides hotel amenity enrichment via RapidAPI DataCrawler.
 */

import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { BookingComHotelsProvider } from './booking-com-hotels.provider'

@Module({
  imports: [HttpModule],
  providers: [BookingComHotelsProvider],
  exports: [BookingComHotelsProvider],
})
export class BookingComModule {}
