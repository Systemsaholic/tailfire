/**
 * Suppliers Module
 *
 * Provides supplier management functionality for bookings.
 */

import { Module } from '@nestjs/common'
import { DatabaseModule } from '../db/database.module'
import { SuppliersService } from './suppliers.service'
import { SuppliersController } from './suppliers.controller'

@Module({
  imports: [DatabaseModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
