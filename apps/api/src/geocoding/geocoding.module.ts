/**
 * Geocoding Module
 *
 * Provides geocoding functionality for the API.
 * Used by tour-import to geocode tour cities during sync.
 */

import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { GeocodingService } from './geocoding.service'
import { DatabaseModule } from '../db/database.module'

@Module({
  imports: [
    HttpModule.register({ timeout: 10000 }),
    ConfigModule,
    DatabaseModule,
  ],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}
