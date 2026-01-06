/**
 * Users Module
 *
 * Provides admin user management endpoints.
 */

import { Module } from '@nestjs/common'
import { DatabaseModule } from '../db/database.module'
import { EmailModule } from '../email/email.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
