/**
 * Amenities Module
 *
 * Provides dynamic amenity management and activity-amenity assignments.
 * Amenities are auto-created from external APIs (Google Places, Booking.com)
 * and can be manually managed.
 */

import { Module } from '@nestjs/common'
import { DatabaseModule } from '../db/database.module'
import { AmenitiesService } from './amenities.service'
import { AmenitiesController, ActivityAmenitiesController } from './amenities.controller'

@Module({
  imports: [DatabaseModule],
  controllers: [AmenitiesController, ActivityAmenitiesController],
  providers: [AmenitiesService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}
