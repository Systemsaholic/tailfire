import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createDbClient, type Database, schema } from '@tailfire/database'

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private _db: Database | null = null
  private readonly logger = new Logger(DatabaseService.name)

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL')
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    this._db = createDbClient(databaseUrl)
    this.logger.log('Database connection established')
  }

  async onModuleDestroy() {
    // Connection cleanup if needed
    this.logger.log('Database connection closed')
  }

  get db(): Database {
    if (!this._db) {
      throw new Error('Database not initialized')
    }
    return this._db
  }

  /**
   * Alias for db - provides direct access to Drizzle client
   */
  get client(): Database {
    return this.db
  }

  /**
   * Access to database schema for query building
   */
  get schema() {
    return schema
  }
}
