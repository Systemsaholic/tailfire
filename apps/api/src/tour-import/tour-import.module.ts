/**
 * Tour Import Module
 *
 * Handles tour catalog data import from external providers.
 * Currently supports:
 * - Globus Family of Brands (Globus, Cosmos, Monograms)
 *
 * IMPORTANT: Sync only runs on Production. Dev/Preview use FDW.
 */

import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { TourImportController } from './tour-import.controller'
import { TourImportService } from './tour-import.service'
import { GlobusImportProvider } from './providers/globus-import.provider'
import { GeocodingModule } from '../geocoding'

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 120000, // 2 minutes for large file downloads
      maxRedirects: 3,
    }),
    GeocodingModule,
  ],
  controllers: [TourImportController],
  providers: [TourImportService, GlobusImportProvider],
  exports: [TourImportService],
})
export class TourImportModule {}
