import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { join } from 'path'
import { sql } from 'drizzle-orm'

/**
 * Resets the database by dropping all tables and running migrations from scratch
 *
 * ⚠️ DANGEROUS: This will DELETE ALL DATA in the database!
 * Only use in development/test environments.
 *
 * @param connectionString - PostgreSQL connection string (requires service role key)
 *
 * @example
 * ```typescript
 * // apps/api/src/db/reset.ts
 * import { resetDatabase } from '@tailfire/database'
 *
 * await resetDatabase(process.env.DATABASE_URL!)
 * ```
 */
export async function resetDatabase(connectionString: string) {
  console.log('🔄 Resetting database...')
  console.log('⚠️  This will DELETE ALL DATA!')

  const connection = postgres(connectionString, { max: 1 })
  const db = drizzle(connection)

  try {
    // Drop all tables in the public schema
    console.log('🗑️  Dropping all tables...')
    await db.execute(sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `)

    // Drop drizzle metadata schema
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`)

    console.log('✅ All tables dropped')

    // Run migrations
    console.log('🔄 Running migrations...')
    // Find migrations folder - works whether running from src or dist
    // When compiled: __dirname = .../packages/database/dist
    // When in source: __dirname = .../packages/database/src
    const migrationsFolder = __dirname.endsWith('/dist')
      ? join(__dirname, '..', 'src', 'migrations')
      : join(__dirname, 'migrations')

    await migrate(db, { migrationsFolder })
    console.log('✅ Migrations completed successfully')

    console.log('✅ Database reset complete')
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    throw error
  } finally {
    await connection.end()
  }
}
